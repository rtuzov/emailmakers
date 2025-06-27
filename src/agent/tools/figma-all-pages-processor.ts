import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises';

// Load .env.local file
config({ path: path.resolve(process.cwd(), '.env.local') });

import { ToolResult, handleToolError } from './index';
import OpenAI from 'openai';
import { TagDictionaryManager, generateShortFileName, TagDictionary } from './figma-tag-dictionary';
import { TagOptimizationService } from './tag-optimization-service';
import { getUsageModel } from '../../shared/utils/model-config';

interface AllPagesProcessorParams {
  figmaUrl: string;
  outputDirectory?: string;
  context?: {
    campaign_type?: 'urgent' | 'newsletter' | 'seasonal' | 'promotional' | 'informational';
    content_theme?: string;
    target_audience?: string;
    brand_guidelines?: string[];
  };
}

interface ProcessedPage {
  id: string;
  name: string;
  folderName: string;
  totalAssets: number;
  processedAssets: number;
  outputDirectory: string;
  tagDictionary: TagDictionary;
  summary: {
    totalTags: number;
    uniqueTags: number;
    averageTagsPerFile: number;
  };
}

interface FigmaPageNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaPageNode[];
  componentPropertyDefinitions?: Record<string, any>;
  variantProperties?: Record<string, string>;
}

interface ProcessedAsset {
  id: string;
  originalName: string;
  newName: string;
  tags: string[];
  variants?: VariantInfo[];
  selectedVariant?: VariantInfo;
  filePath: string;
  metadata: {
    figmaNodeId: string;
    componentType: string;
    hasVariants: boolean;
    aiAnalysis: AITagAnalysis;
  };
}

interface VariantInfo {
  id: string;
  name: string;
  newName: string;
  tags: string[];
  properties: Record<string, string>;
  filePath: string;
  confidence: number;
  aiAnalysis: AITagAnalysis;
}

interface AITagAnalysis {
  suggestedTags: string[];
  contentDescription: string;
  emotionalTone: string;
  usageContext: string[];
  confidence: number;
  reasoning: string;
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Основной процессор для обработки всех листов Figma
 * Каждый лист обрабатывается в отдельную папку с названием листа
 */
export async function processAllFigmaPages(params: AllPagesProcessorParams): Promise<ToolResult> {
  try {
    console.log('🌟 All Pages Processor: Начинаем обработку всех листов Figma');

    const figmaToken = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN;
    
    if (!figmaToken) {
      throw new Error('FIGMA_ACCESS_TOKEN не найден в переменных окружения');
    }

    // Извлекаем данные из Figma URL
    const { fileId } = extractFigmaIds(params.figmaUrl);
    
    // Получаем все страницы из Figma файла
    const pages = await getAllFigmaPages(figmaToken, fileId);
    
    console.log(`📋 Найдено ${pages.length} страниц в Figma файле`);
    pages.forEach((page, index) => {
      console.log(`  ${index + 1}. "${page.name}" (ID: ${page.id})`);
    });

    // Создаем основную директорию для результатов
    const baseOutputDir = params.outputDirectory || path.join(process.cwd(), `figma-all-pages-${Date.now()}`);
    await fs.mkdir(baseOutputDir, { recursive: true });

    const processedPages: ProcessedPage[] = [];
    const tagOptimizer = new TagOptimizationService();

    // Обрабатываем каждую страницу отдельно
    for (const page of pages) {
      console.log(`\n🎯 Обрабатываем страницу: "${page.name}"`);
      
      try {
        const processedPage = await processPageComponents(
          figmaToken,
          fileId,
          page,
          baseOutputDir,
          params.context,
          tagOptimizer
        );
        
        processedPages.push(processedPage);
        
        console.log(`✅ Страница "${page.name}" обработана: ${processedPage.processedAssets}/${processedPage.totalAssets} ассетов`);
        
      } catch (error) {
        console.error(`❌ Ошибка обработки страницы "${page.name}":`, error.message);
      }
    }

    // Генерируем общий отчет
    const globalReport = await generateGlobalReport(processedPages, baseOutputDir, params.context);

    console.log(`\n🎉 Обработка завершена! Результаты в: ${baseOutputDir}`);
    console.log(`📊 Обработано страниц: ${processedPages.length}`);
    console.log(`📁 Создано папок: ${processedPages.length}`);

    return {
      success: true,
      data: {
        processedPages,
        outputDirectory: baseOutputDir,
        globalReport,
        summary: {
          totalPages: processedPages.length,
          totalAssets: processedPages.reduce((sum, page) => sum + page.processedAssets, 0),
          totalTags: processedPages.reduce((sum, page) => sum + page.summary.totalTags, 0),
          uniqueTagsGlobal: Array.from(new Set(
            processedPages.flatMap(page => page.tagDictionary.uniqueTags)
          )).length
        }
      },
      metadata: {
        tool: 'figma-all-pages-processor',
        timestamp: new Date().toISOString(),
        figmaFile: fileId
      }
    };

  } catch (error) {
    return handleToolError('processAllFigmaPages', error);
  }
}

/**
 * Извлекает fileId из Figma URL
 */
function extractFigmaIds(figmaUrl: string): { fileId: string } {
  const urlMatch = figmaUrl.match(/figma\.com\/design\/([a-zA-Z0-9]+)/);
  if (!urlMatch) {
    throw new Error('Неверный формат Figma URL');
  }

  return { fileId: urlMatch[1] };
}

/**
 * Получает все страницы из Figma файла
 */
async function getAllFigmaPages(token: string, fileId: string): Promise<FigmaPageNode[]> {
  console.log('🔍 Получаем список всех страниц из Figma...');

  const url = `https://api.figma.com/v1/files/${fileId}`;
  
  const response = await fetch(url, {
    headers: { 'X-Figma-Token': token }
  });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.document || !data.document.children) {
    throw new Error('Неверная структура ответа Figma API');
  }

  // Возвращаем только страницы (не включаем другие типы узлов)
  return data.document.children.filter((child: any) => child.type === 'CANVAS');
}

/**
 * Обрабатывает компоненты одной страницы
 */
async function processPageComponents(
  token: string,
  fileId: string,
  page: FigmaPageNode,
  baseOutputDir: string,
  context?: AllPagesProcessorParams['context'],
  tagOptimizer?: TagOptimizationService
): Promise<ProcessedPage> {
  
  // Создаем папку для страницы (санитизируем название)
  const folderName = sanitizeFileName(page.name);
  const pageOutputDir = path.join(baseOutputDir, folderName);
  await fs.mkdir(pageOutputDir, { recursive: true });

  console.log(`📁 Создана папка: ${folderName}`);

  // Создаем менеджер словаря тегов для этой страницы
  const tagDictionaryManager = new TagDictionaryManager(pageOutputDir);
  const tagDictionary = await tagDictionaryManager.loadOrCreateDictionary();

  // Получаем структуру страницы
  const pageStructure = await getFigmaPageStructure(token, fileId, page.id);
  
  // Находим все компоненты на странице
  const components = await findAllComponents(pageStructure);
  
  console.log(`🔍 Найдено ${components.length} компонентов на странице "${page.name}"`);

  const processedAssets: ProcessedAsset[] = [];

  // Обрабатываем каждый компонент
  for (const component of components) {
    console.log(`⚙️ Обрабатываем: "${component.name}"`);
    
    try {
      const processedAsset = await processComponent(
        token,
        fileId,
        component,
        pageOutputDir,
        context,
        tagDictionary,
        tagDictionaryManager,
        tagOptimizer
      );
      
      processedAssets.push(processedAsset);
      
    } catch (error) {
      console.error(`❌ Ошибка обработки компонента ${component.name}:`, error.message);
    }
  }

  // Финальное сохранение словаря
  await tagDictionaryManager.saveDictionary(tagDictionary);
  
  // Экспорт для агента
  const agentExportPath = `${pageOutputDir}/agent-file-mapping.json`;
  await tagDictionaryManager.exportForAgent(tagDictionary, agentExportPath);

  // Генерируем отчет для страницы
  await generatePageReport(processedAssets, pageOutputDir, page.name, context);

  return {
    id: page.id,
    name: page.name,
    folderName,
    totalAssets: components.length,
    processedAssets: processedAssets.length,
    outputDirectory: pageOutputDir,
    tagDictionary,
    summary: {
      totalTags: tagDictionary.totalTags,
      uniqueTags: tagDictionary.uniqueTags.length,
      averageTagsPerFile: tagDictionary.totalFiles > 0 ? tagDictionary.totalTags / tagDictionary.totalFiles : 0
    }
  };
}

/**
 * Получает структуру конкретной страницы
 */
async function getFigmaPageStructure(token: string, fileId: string, nodeId: string): Promise<FigmaPageNode> {
  const url = `https://api.figma.com/v1/files/${fileId}/nodes?ids=${encodeURIComponent(nodeId)}`;

  const response = await fetch(url, {
    headers: { 'X-Figma-Token': token }
  });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.nodes || !data.nodes[nodeId]) {
    throw new Error(`Страница с ID ${nodeId} не найдена`);
  }

  return data.nodes[nodeId].document;
}

/**
 * Находит все компоненты на странице
 */
async function findAllComponents(pageNode: FigmaPageNode): Promise<FigmaPageNode[]> {
  const components: FigmaPageNode[] = [];
  
  function traverse(node: FigmaPageNode) {
    if (isProcessableComponent(node)) {
      components.push(node);
    }
    
    if (node.children) {
      node.children.forEach(traverse);
    }
  }
  
  traverse(pageNode);
  return components;
}

/**
 * Проверяет, является ли узел обрабатываемым компонентом
 */
function isProcessableComponent(node: FigmaPageNode): boolean {
  const isComponent = node.type === 'COMPONENT' || node.type === 'COMPONENT_SET' || node.type === 'INSTANCE';
  
  // Фильтруем по размеру (исключаем слишком маленькие элементы)
  const hasReasonableSize = true; // TODO: добавить проверку размера если нужно
  
  return isComponent && hasReasonableSize;
}

/**
 * Обрабатывает отдельный компонент (аналогично processRabbitComponent)
 */
async function processComponent(
  token: string,
  fileId: string,
  component: FigmaPageNode,
  outputDir: string,
  context?: AllPagesProcessorParams['context'],
  tagDictionary?: TagDictionary,
  tagDictionaryManager?: TagDictionaryManager,
  tagOptimizer?: TagOptimizationService
): Promise<ProcessedAsset> {
  
  // Если это COMPONENT_SET с вариантами, обрабатываем каждый вариант отдельно
  if (component.type === 'COMPONENT_SET' && component.children) {
    console.log(`🎨 Анализируем варианты для "${component.name}"`);
    const variants = await analyzeComponentVariants(token, fileId, component, outputDir, context, tagDictionary, tagDictionaryManager, tagOptimizer);
    
    return {
      id: component.id,
      originalName: component.name,
      newName: component.name,
      tags: [],
      variants,
      selectedVariant: selectBestVariant(variants, context),
      filePath: '',
      metadata: {
        figmaNodeId: component.id,
        componentType: component.type,
        hasVariants: true,
        aiAnalysis: {
          suggestedTags: [],
          contentDescription: `Component set: ${component.name}`,
          emotionalTone: 'нейтральный',
          usageContext: [],
          confidence: 1.0,
          reasoning: 'Component set processed as variants'
        }
      }
    };
  }

  // Для обычных компонентов обрабатываем как раньше
  const imageData = await exportComponentImage(token, fileId, component.id);

  // Сохраняем изображение
  const mainImagePath = await saveComponentImage(
    imageData,
    component.name,
    outputDir,
    'main'
  );

  // Анализируем изображение с помощью GPT-4 для генерации тегов
  const aiAnalysis = await analyzeImageWithAI(
    mainImagePath,
    component.name,
    context
  );

  // Оптимизируем теги с помощью нового сервиса
  let optimizedTags = aiAnalysis.suggestedTags;
  let shortName = '';
  
  if (tagOptimizer) {
    // Проверяем, есть ли заяц на изображении
    const hasRabbit = component.name.toLowerCase().includes('заяц') || 
                     aiAnalysis.suggestedTags.some(tag => tag.toLowerCase().includes('заяц')) ||
                     aiAnalysis.contentDescription.toLowerCase().includes('заяц');
    
    const optimizationResult = tagOptimizer.optimizeTags(aiAnalysis.suggestedTags, hasRabbit);
    optimizedTags = optimizationResult.optimizedTags;
    shortName = optimizationResult.shortFileName;
    
    console.log(`🎯 Оптимизация тегов для "${component.name}":`);
    console.log(`   Исходные теги (${optimizationResult.originalTags.length}): ${optimizationResult.originalTags.slice(0, 3).join(', ')}...`);
    console.log(`   Оптимизированные теги (${optimizedTags.length}): ${optimizedTags.join(', ')}`);
  } else {
    // Фоллбэк к старой системе
    const result = generateShortFileName(aiAnalysis.suggestedTags);
    shortName = result.shortName;
  }

  // Переименовываем файл
  const newImagePath = await renameImageFile(mainImagePath, shortName);

  // Добавляем запись в словарь тегов
  if (tagDictionary && tagDictionaryManager) {
    const dictionaryEntry = tagDictionaryManager.addEntry(
      shortName,
      component.name,
      aiAnalysis.suggestedTags,
      optimizedTags,
      {
        contentDescription: aiAnalysis.contentDescription,
        emotionalTone: aiAnalysis.emotionalTone,
        usageContext: aiAnalysis.usageContext,
        confidence: aiAnalysis.confidence,
        reasoning: aiAnalysis.reasoning
      },
      {
        figmaNodeId: component.id,
        componentType: component.type,
        hasVariants: false,
        createdAt: new Date().toISOString()
      }
    );

    tagDictionary.entries[shortName] = dictionaryEntry;
    
    // 🔄 АВТОМАТИЧЕСКОЕ СОХРАНЕНИЕ: Сохраняем словарь после каждого файла
    await tagDictionaryManager.saveDictionary(tagDictionary);
    
    // 📤 ЭКСПОРТ ДЛЯ АГЕНТА: Создаем упрощенную версию для агента
    const agentExportPath = `${outputDir}/agent-file-mapping.json`;
    await tagDictionaryManager.exportForAgent(tagDictionary, agentExportPath);
    
    console.log(`💾 Словарь сохранен и экспортирован после обработки: ${shortName}`);
  }

  return {
    id: component.id,
    originalName: component.name,
    newName: shortName,
    tags: optimizedTags,
    variants: [],
    selectedVariant: undefined,
    filePath: newImagePath,
    metadata: {
      figmaNodeId: component.id,
      componentType: component.type,
      hasVariants: false,
      aiAnalysis
    }
  };
}

// Импортируем остальные функции из news-rabbits-processor
async function exportComponentImage(token: string, fileId: string, nodeId: string): Promise<Buffer> {
  const exportUrl = `https://api.figma.com/v1/images/${encodeURIComponent(fileId)}?ids=${nodeId}&format=png&scale=2`;
  
  const response = await fetch(exportUrl, {
    headers: { 'X-Figma-Token': token }
  });

  const data = await response.json();
  
  if (data.err) {
    throw new Error(`Export failed: ${data.err}`);
  }

  const imageUrl = data.images[nodeId];
  if (!imageUrl) {
    throw new Error(`No image URL for node ${nodeId}`);
  }

  const imageResponse = await fetch(imageUrl);
  return Buffer.from(await imageResponse.arrayBuffer());
}

async function saveComponentImage(
  imageBuffer: Buffer,
  componentName: string,
  outputDir: string,
  suffix: string = ''
): Promise<string> {
  
  const fileName = suffix 
    ? `${sanitizeFileName(componentName)}-${suffix}.png`
    : `${sanitizeFileName(componentName)}.png`;
  
  const filePath = path.join(outputDir, fileName);
  await fs.writeFile(filePath, imageBuffer);
  
  return filePath;
}

async function analyzeImageWithAI(
  imagePath: string,
  componentName: string,
  context?: AllPagesProcessorParams['context']
): Promise<AITagAnalysis> {
  
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    const contextPrompt = context?.content_theme 
      ? `Контекст: ${context.content_theme}. Тип кампании: ${context.campaign_type || 'general'}.`
      : '';

    const response = await openai.chat.completions.create({
      model: getUsageModel(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Проанализируй это изображение и создай теги для email-маркетинга.
              
${contextPrompt}

Верни ТОЛЬКО JSON в формате:
{
  "suggestedTags": ["тег1", "тег2", "тег3"],
  "contentDescription": "краткое описание",
  "emotionalTone": "тон (позитивный/нейтральный/срочный/дружелюбный)",
  "usageContext": ["контекст1", "контекст2"],
  "confidence": 0.95,
  "reasoning": "объяснение выбора тегов"
}

Исходное название: "${componentName}"
Фокусируйся на элементах, релевантных для email-кампаний.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Пустой ответ от OpenAI');
    }

    // Парсим JSON ответ
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON не найден в ответе OpenAI');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      suggestedTags: analysis.suggestedTags || [],
      contentDescription: analysis.contentDescription || '',
      emotionalTone: analysis.emotionalTone || 'нейтральный',
      usageContext: analysis.usageContext || [],
      confidence: analysis.confidence || 0.8,
      reasoning: analysis.reasoning || ''
    };

  } catch (error) {
    console.error(`Ошибка анализа изображения ${componentName}:`, error.message);
    return generateFallbackTags(componentName, context);
  }
}

function generateFallbackTags(
  componentName: string,
  context?: AllPagesProcessorParams['context']
): AITagAnalysis {
  const baseTags = ['компонент', 'дизайн'];
  
  if (context?.campaign_type) {
    baseTags.push(context.campaign_type);
  }
  
  if (context?.content_theme) {
    baseTags.push(...context.content_theme.split(' ').slice(0, 2));
  }
  
  return {
    suggestedTags: baseTags,
    contentDescription: `Компонент: ${componentName}`,
    emotionalTone: 'нейтральный',
    usageContext: ['общий'],
    confidence: 0.6,
    reasoning: 'Fallback анализ из-за ошибки AI'
  };
}

async function renameImageFile(oldPath: string, newName: string): Promise<string> {
  const dir = path.dirname(oldPath);
  const ext = path.extname(oldPath);
  const newPath = path.join(dir, `${newName}${ext}`);
  
  await fs.rename(oldPath, newPath);
  return newPath;
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^а-яё\w\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

async function analyzeComponentVariants(
  token: string,
  fileId: string,
  component: FigmaPageNode,
  outputDir: string,
  context?: AllPagesProcessorParams['context'],
  tagDictionary?: TagDictionary,
  tagDictionaryManager?: TagDictionaryManager,
  tagOptimizer?: TagOptimizationService
): Promise<VariantInfo[]> {
  
  if (!component.children) return [];

  const variants: VariantInfo[] = [];
  
  const variantIds = component.children.map(child => child.id);
  const exportUrl = `https://api.figma.com/v1/images/${encodeURIComponent(fileId)}?ids=${variantIds.join(',')}&format=png&scale=2`;
  
  const response = await fetch(exportUrl, {
    headers: { 'X-Figma-Token': token }
  });

  const data = await response.json();
  
  if (data.err) {
    throw new Error(`Variants export failed: ${data.err}`);
  }

  for (let i = 0; i < component.children.length; i++) {
    const child = component.children[i];
    const imageUrl = data.images[child.id];
    
    if (!imageUrl) continue;

    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    
    const variantPath = await saveComponentImage(
      imageBuffer,
      child.name,
      outputDir,
      `variant-${i + 1}`
    );

    const aiAnalysis = await analyzeImageWithAI(
      variantPath,
      child.name,
      context
    );

    let optimizedTags = aiAnalysis.suggestedTags;
    let shortName = '';
    
    if (tagOptimizer) {
      const hasRabbit = child.name.toLowerCase().includes('заяц') || 
                       aiAnalysis.suggestedTags.some(tag => tag.toLowerCase().includes('заяц')) ||
                       aiAnalysis.contentDescription.toLowerCase().includes('заяц');
      
      const optimizationResult = tagOptimizer.optimizeTags(aiAnalysis.suggestedTags, hasRabbit);
      optimizedTags = optimizationResult.optimizedTags;
      shortName = optimizationResult.shortFileName;
    } else {
      const result = generateShortFileName(aiAnalysis.suggestedTags);
      shortName = result.shortName;
    }

    const newVariantPath = await renameImageFile(variantPath, shortName);

    if (tagDictionary && tagDictionaryManager) {
      const dictionaryEntry = tagDictionaryManager.addEntry(
        shortName,
        child.name,
        aiAnalysis.suggestedTags,
        optimizedTags,
        {
          contentDescription: aiAnalysis.contentDescription,
          emotionalTone: aiAnalysis.emotionalTone,
          usageContext: aiAnalysis.usageContext,
          confidence: aiAnalysis.confidence,
          reasoning: aiAnalysis.reasoning
        },
        {
          figmaNodeId: child.id,
          componentType: 'VARIANT',
          hasVariants: false,
          createdAt: new Date().toISOString()
        }
      );

      tagDictionary.entries[shortName] = dictionaryEntry;
      
      await tagDictionaryManager.saveDictionary(tagDictionary);
      const agentExportPath = `${outputDir}/agent-file-mapping.json`;
      await tagDictionaryManager.exportForAgent(tagDictionary, agentExportPath);
      
      console.log(`💾 Словарь сохранен и экспортирован после обработки варианта: ${shortName}`);
    }

    variants.push({
      id: child.id,
      name: child.name,
      newName: shortName,
      tags: optimizedTags,
      properties: child.variantProperties || {},
      filePath: newVariantPath,
      confidence: aiAnalysis.confidence,
      aiAnalysis
    });
  }

  return variants;
}

function selectBestVariant(
  variants: VariantInfo[],
  context?: AllPagesProcessorParams['context']
): VariantInfo | undefined {
  if (variants.length === 0) return undefined;
  
  return variants.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );
}

async function generatePageReport(
  processedAssets: ProcessedAsset[],
  outputDir: string,
  pageName: string,
  context?: AllPagesProcessorParams['context']
): Promise<string> {
  
  const report = {
    pageName,
    timestamp: new Date().toISOString(),
    context,
    summary: {
      totalAssets: processedAssets.length,
      assetsWithVariants: processedAssets.filter(a => a.metadata.hasVariants).length,
      averageConfidence: processedAssets.reduce((sum, a) => sum + a.metadata.aiAnalysis.confidence, 0) / processedAssets.length,
      uniqueTags: Array.from(new Set(processedAssets.flatMap(a => a.tags))),
    },
    assets: processedAssets.map(asset => ({
      id: asset.id,
      originalName: asset.originalName,
      newName: asset.newName,
      tags: asset.tags,
      confidence: asset.metadata.aiAnalysis.confidence,
      hasVariants: asset.metadata.hasVariants,
      variantCount: asset.variants?.length || 0
    }))
  };

  const reportPath = path.join(outputDir, 'page-processing-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  return reportPath;
}

async function generateGlobalReport(
  processedPages: ProcessedPage[],
  outputDir: string,
  context?: AllPagesProcessorParams['context']
): Promise<string> {
  
  const report = {
    timestamp: new Date().toISOString(),
    context,
    summary: {
      totalPages: processedPages.length,
      totalAssets: processedPages.reduce((sum, page) => sum + page.processedAssets, 0),
      totalTags: processedPages.reduce((sum, page) => sum + page.summary.totalTags, 0),
      uniqueTagsGlobal: Array.from(new Set(
        processedPages.flatMap(page => page.tagDictionary.uniqueTags)
      )).length,
      averageAssetsPerPage: processedPages.length > 0 
        ? processedPages.reduce((sum, page) => sum + page.processedAssets, 0) / processedPages.length 
        : 0
    },
    pages: processedPages.map(page => ({
      name: page.name,
      folderName: page.folderName,
      totalAssets: page.totalAssets,
      processedAssets: page.processedAssets,
      uniqueTags: page.summary.uniqueTags,
      outputDirectory: page.outputDirectory
    }))
  };

  const reportPath = path.join(outputDir, 'global-processing-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  return reportPath;
} 