import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises';

// Load .env.local file
config({ path: path.resolve(process.cwd(), '.env.local') });

import { ToolResult, handleToolError } from './index';
import OpenAI from 'openai';
import { TagDictionaryManager, generateShortFileName, TagDictionary } from './figma-tag-dictionary';

interface NewsRabbitsProcessorParams {
  figmaUrl: string;
  outputDirectory?: string;
  context?: {
    campaign_type?: 'urgent' | 'newsletter' | 'seasonal' | 'promotional' | 'informational';
    content_theme?: string;
    target_audience?: string;
    brand_guidelines?: string[];
  };
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

interface FigmaPageNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaPageNode[];
  componentPropertyDefinitions?: Record<string, any>;
  variantProperties?: Record<string, string>;
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Основной процессор для обработки листа "Зайцы Новости" из Figma
 * Извлекает компоненты, анализирует варианты, генерирует теги через GPT-4
 */
export async function processNewsRabbits(params: NewsRabbitsProcessorParams): Promise<ToolResult> {
  try {
    console.log('🐰 News Rabbits Processor: Начинаем обработку листа "Зайцы Новости"');

    const figmaToken = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN;
    
    if (!figmaToken) {
      throw new Error('FIGMA_ACCESS_TOKEN не найден в переменных окружения');
    }

    // Извлекаем данные из Figma URL
    const { fileId, nodeId } = extractFigmaIds(params.figmaUrl);
    
    // Получаем структуру страницы "Зайцы Новости"
    const pageStructure = await getFigmaPageStructure(figmaToken, fileId, nodeId);
    
    // Находим компоненты зайцев
    const rabbitComponents = await findRabbitComponents(pageStructure);
    
    console.log(`📋 Найдено ${rabbitComponents.length} компонентов зайцев`);

    // Создаем директорию для результатов
    const outputDir = params.outputDirectory || path.join(process.cwd(), `news-rabbits-${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });

    // Создаем менеджер словаря тегов
    const tagDictionaryManager = new TagDictionaryManager(outputDir);
    const tagDictionary = await tagDictionaryManager.loadOrCreateDictionary();

    const processedAssets: ProcessedAsset[] = [];

    // Обрабатываем каждый компонент
    for (const component of rabbitComponents) {
      console.log(`🔍 Обрабатываем: "${component.name}"`);
      
      try {
        const processedAsset = await processRabbitComponent(
          figmaToken,
          fileId,
          component,
          outputDir,
          params.context,
          tagDictionary,
          tagDictionaryManager
        );
        
        processedAssets.push(processedAsset);
        
      } catch (error) {
        console.error(`❌ Ошибка обработки ${component.name}:`, error.message);
      }
    }

    // Сохраняем словарь тегов
    await tagDictionaryManager.saveDictionary(tagDictionary);

    // Экспортируем упрощенную версию для агента
    const agentExportPath = path.join(outputDir, 'agent-file-mapping.json');
    await tagDictionaryManager.exportForAgent(tagDictionary, agentExportPath);

    // Генерируем отчет
    const report = await generateProcessingReport(processedAssets, outputDir, params.context);

    console.log(`✅ Обработка завершена! Результаты в: ${outputDir}`);
    console.log(`📊 Обработано: ${processedAssets.length} ассетов`);
    console.log(`📖 Словарь тегов: ${tagDictionary.totalFiles} файлов, ${tagDictionary.totalTags} уникальных тегов`);

    return {
      success: true,
      data: {
        processedAssets,
        outputDirectory: outputDir,
        report,
        summary: {
          totalAssets: processedAssets.length,
          assetsWithVariants: processedAssets.filter(a => a.metadata.hasVariants).length,
          uniqueTags: Array.from(new Set(processedAssets.flatMap(a => a.tags))),
        }
      },
      metadata: {
        tool: 'figma-news-rabbits-processor',
        timestamp: new Date().toISOString(),
        figmaFile: fileId,
        figmaNode: nodeId
      }
    };

  } catch (error) {
    return handleToolError('processNewsRabbits', error);
  }
}

/**
 * Извлекает fileId и nodeId из Figma URL
 */
function extractFigmaIds(figmaUrl: string): { fileId: string; nodeId?: string } {
  const urlMatch = figmaUrl.match(/figma\.com\/design\/([a-zA-Z0-9]+)/);
  if (!urlMatch) {
    throw new Error('Неверный формат Figma URL');
  }

  const fileId = urlMatch[1];
  
  // Попытка извлечь node ID из URL
  const nodeMatch = figmaUrl.match(/node-id=([^&]+)/);
  const nodeId = nodeMatch ? decodeURIComponent(nodeMatch[1]) : undefined;

  return { fileId, nodeId };
}

/**
 * Получает структуру страницы из Figma API
 */
async function getFigmaPageStructure(token: string, fileId: string, nodeId?: string): Promise<FigmaPageNode> {
  console.log('🔍 Получаем структуру Figma файла...');

  const url = nodeId 
    ? `https://api.figma.com/v1/files/${fileId}/nodes?ids=${encodeURIComponent(nodeId)}`
    : `https://api.figma.com/v1/files/${fileId}`;

  const response = await fetch(url, {
    headers: { 'X-Figma-Token': token }
  });

  if (!response.ok) {
    throw new Error(`Figma API ошибка: ${response.status}`);
  }

  const data = await response.json();

  if (data.err) {
    throw new Error(`Figma API ошибка: ${data.err}`);
  }

  // Если указан nodeId, возвращаем конкретный узел
  if (nodeId && data.nodes) {
    return data.nodes[nodeId]?.document;
  }

  // Иначе ищем страницу "Зайцы Новости"
  const pages = data.document?.children || [];
  const newsRabbitsPage = pages.find((page: any) => 
    page.name.toLowerCase().includes('зайцы') && 
    page.name.toLowerCase().includes('новости')
  );

  if (!newsRabbitsPage) {
    throw new Error('Страница "Зайцы Новости" не найдена');
  }

  return newsRabbitsPage;
}

/**
 * Находит все компоненты зайцев на странице
 */
async function findRabbitComponents(pageNode: FigmaPageNode): Promise<FigmaPageNode[]> {
  const components: FigmaPageNode[] = [];

  function traverse(node: FigmaPageNode) {
    // Проверяем, является ли узел компонентом зайца
    if (isRabbitComponent(node)) {
      components.push(node);
    }

    // Рекурсивно обходим дочерние элементы
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(pageNode);
  return components;
}

/**
 * Определяет, является ли узел компонентом зайца
 */
function isRabbitComponent(node: FigmaPageNode): boolean {
  const name = node.name.toLowerCase();
  
  // Проверяем тип узла и название
  const isComponent = node.type === 'COMPONENT' || node.type === 'COMPONENT_SET' || node.type === 'INSTANCE';
  const hasRabbitKeyword = name.includes('заяц') || name.includes('rabbit');
  
  // Дополнительные ключевые слова для новостных компонентов
  const hasNewsKeywords = name.includes('новости') || name.includes('news') || 
                          name.includes('подборка') || name.includes('общие');

  return isComponent && hasRabbitKeyword && (hasNewsKeywords || name.includes('заяц'));
}

/**
 * Обрабатывает отдельный компонент зайца
 */
async function processRabbitComponent(
  token: string,
  fileId: string,
  component: FigmaPageNode,
  outputDir: string,
  context?: NewsRabbitsProcessorParams['context'],
  tagDictionary?: TagDictionary,
  tagDictionaryManager?: TagDictionaryManager
): Promise<ProcessedAsset> {
  
  // Если это COMPONENT_SET с вариантами, обрабатываем каждый вариант отдельно
  if (component.type === 'COMPONENT_SET' && component.children) {
    console.log(`🎨 Анализируем варианты для "${component.name}"`);
    const variants = await analyzeComponentVariants(token, fileId, component, outputDir, context, tagDictionary, tagDictionaryManager);
    
    return {
      id: component.id,
      originalName: component.name,
      newName: component.name, // Для COMPONENT_SET не меняем имя
      tags: [],
      variants,
      selectedVariant: selectBestVariant(variants, context),
      filePath: '', // У COMPONENT_SET нет собственного файла
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

  // Генерируем короткое имя файла и записываем в словарь тегов
  const { shortName, selectedTags } = generateShortFileName(aiAnalysis.suggestedTags);

  // Переименовываем файл
  const newImagePath = await renameImageFile(mainImagePath, shortName);

  // Добавляем запись в словарь тегов
  if (tagDictionary && tagDictionaryManager) {
    const dictionaryEntry = tagDictionaryManager.addEntry(
      shortName,
      component.name,
      aiAnalysis.suggestedTags, // ВСЕ теги от GPT-4
      selectedTags, // Теги, использованные в имени файла
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
  }

  return {
    id: component.id,
    originalName: component.name,
    newName: shortName,
    tags: aiAnalysis.suggestedTags, // Возвращаем ВСЕ теги
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

/**
 * Экспортирует изображение компонента из Figma
 */
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

  // Скачиваем изображение
  const imageResponse = await fetch(imageUrl);
  return Buffer.from(await imageResponse.arrayBuffer());
}

/**
 * Анализирует варианты компонента
 */
async function analyzeComponentVariants(
  token: string,
  fileId: string,
  component: FigmaPageNode,
  outputDir: string,
  context?: NewsRabbitsProcessorParams['context'],
  tagDictionary?: TagDictionary,
  tagDictionaryManager?: TagDictionaryManager
): Promise<VariantInfo[]> {
  
  if (!component.children) return [];

  const variants: VariantInfo[] = [];
  
  // Экспортируем каждый вариант
  const variantIds = component.children.map(child => child.id);
  const exportUrl = `https://api.figma.com/v1/images/${encodeURIComponent(fileId)}?ids=${variantIds.join(',')}&format=png&scale=2`;
  
  const response = await fetch(exportUrl, {
    headers: { 'X-Figma-Token': token }
  });

  const data = await response.json();
  
  if (data.err) {
    throw new Error(`Variants export failed: ${data.err}`);
  }

  // Обрабатываем каждый вариант и сохраняем в основную папку
  for (let i = 0; i < component.children.length; i++) {
    const child = component.children[i];
    const imageUrl = data.images[child.id];
    
    if (!imageUrl) continue;

    // Скачиваем изображение варианта
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    
    // Сохраняем вариант в основную папку (не в подпапку)
    const variantPath = await saveComponentImage(
      imageBuffer,
      child.name,
      outputDir, // Сохраняем в основную папку
      `variant-${i + 1}`
    );

    // Анализируем вариант с помощью GPT-4 для генерации тегов
    const aiAnalysis = await analyzeImageWithAI(
      variantPath,
      child.name,
      context
    );

    // Генерируем короткое имя файла и записываем в словарь тегов
    const { shortName, selectedTags } = generateShortFileName(aiAnalysis.suggestedTags);

    // Переименовываем файл варианта
    const newVariantPath = await renameImageFile(variantPath, shortName);

    // Добавляем запись в словарь тегов
    if (tagDictionary && tagDictionaryManager) {
      const dictionaryEntry = tagDictionaryManager.addEntry(
        shortName,
        child.name,
        aiAnalysis.suggestedTags, // ВСЕ теги от GPT-4
        selectedTags, // Теги, использованные в имени файла
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
    }

    variants.push({
      id: child.id,
      name: child.name,
      newName: shortName,
      tags: aiAnalysis.suggestedTags, // Возвращаем ВСЕ теги
      properties: child.variantProperties || {},
      filePath: newVariantPath,
      confidence: aiAnalysis.confidence,
      aiAnalysis
    });
  }

  return variants;
}

/**
 * Сохраняет изображение компонента
 */
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

/**
 * Анализирует изображение с помощью GPT-4 для генерации тегов
 */
async function analyzeImageWithAI(
  imagePath: string,
  componentName: string,
  context?: NewsRabbitsProcessorParams['context']
): Promise<AITagAnalysis> {
  
  console.log(`🤖 Анализируем "${componentName}" с помощью GPT-4...`);

  // Читаем изображение и конвертируем в base64
  const imageBuffer = await fs.readFile(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const prompt = `
Проанализируй это изображение предложи теги для названия файла.

Контекст:
- Название компонента: "${componentName}"
- Тип кампании: ${context?.campaign_type || 'не указан'}
- Тема контента: ${context?.content_theme || 'не указана'}
- Целевая аудитория: ${context?.target_audience || 'не указана'}

Верни результат в JSON формате:
{
  "suggestedTags": ["тег1", "тег2", "тег3", и так далее неограниченное количество тегов],
  "contentDescription": "описание изображения",
  "emotionalTone": "эмоциональный тон (позитивный/нейтральный/срочный/дружелюбный)",
  "usageContext": ["контекст1", "контекст2", и так далее неограниченное количество контекстов],
  "confidence": 0.95,
  "reasoning": "объяснение выбора тегов"
}

Теги должны быть:
- На русском языке
- Описывать эмоцию, состояние, положение, контекст, ситуацию, цвет, размер, форму, текст, и так далее неограниченное количество параметров
- Указывать тип контента (новости, подборка, общие)
- Быть подходящими для файловых имен (без спецсимволов)
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 2000, // Увеличили лимит для большего количества тегов
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Пустой ответ от GPT-4');
    }

    // Парсим JSON ответ
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Не удалось найти JSON в ответе GPT-4');
    }

    const analysis: AITagAnalysis = JSON.parse(jsonMatch[0]);
    
    // Валидация результата
    if (!analysis.suggestedTags || !Array.isArray(analysis.suggestedTags)) {
      throw new Error('Неверный формат тегов в ответе GPT-4');
    }

    console.log(`✅ Получено ${analysis.suggestedTags.length} тегов: ${analysis.suggestedTags.join(', ')}`);
    
    return analysis;

  } catch (error) {
    console.error('❌ Ошибка анализа GPT-4:', error.message);
    
    // Fallback: генерируем теги на основе имени компонента
    return generateFallbackTags(componentName, context);
  }
}

/**
 * Генерирует fallback теги, если GPT-4 недоступен
 */
function generateFallbackTags(
  componentName: string,
  context?: NewsRabbitsProcessorParams['context']
): AITagAnalysis {
  
  const name = componentName.toLowerCase();
  const tags: string[] = [];

  // Анализируем имя компонента - добавляем "заяц" только если он есть в названии
  if (name.includes('заяц') || name.includes('rabbit')) tags.push('заяц');
  if (name.includes('новости')) tags.push('новости');
  if (name.includes('подборка')) tags.push('подборка');
  if (name.includes('общие')) tags.push('общие');
  if (name.includes('вопрос')) tags.push('вопрос-ответ');
  if (name.includes('билет')) tags.push('билет');
  if (name.includes('путешествия')) tags.push('путешествия');
  
  // Добавляем контекстные теги
  if (context?.campaign_type) {
    tags.push(context.campaign_type);
  }

  // Если не нашли тегов, добавляем базовые
  if (tags.length === 0) {
    tags.push('контент');
  }

  return {
    suggestedTags: tags,
    contentDescription: `Изображение для ${componentName}`,
    emotionalTone: 'нейтральный',
    usageContext: ['email-маркетинг', 'новости'],
    confidence: 0.7,
    reasoning: 'Теги сгенерированы на основе анализа имени компонента (fallback)'
  };
}

/**
 * Генерирует новое имя файла на основе тегов
 */
function generateNewFileName(originalName: string, tags: string[]): string {
  // Используем ВСЕ теги от GPT-4, а не только первые 3-4
  const allTags = tags;
  
  // Очищаем теги от спецсимволов
  const cleanTags = allTags.map(tag => 
    tag.replace(/[^a-zA-Zа-яА-Я0-9\-]/g, '').toLowerCase()
  ).filter(tag => tag.length > 0); // Убираем пустые теги

  // Создаем новое имя из максимального количества тегов (до лимита файловой системы)
  let newName = cleanTags.join('-');
  
  // Проверяем лимит файловой системы (247 символов - экспериментально установленный лимит для macOS)
  const MAX_FILENAME_LENGTH = 247;
  
  if (newName.length > MAX_FILENAME_LENGTH) {
    console.log(`⚠️ Имя файла слишком длинное (${newName.length} символов), обрезаем до ${MAX_FILENAME_LENGTH}`);
    
    // Берем максимальное количество тегов, которые помещаются в лимит
    let truncatedName = '';
    let usedTags = 0;
    
    for (const tag of cleanTags) {
      const testName = truncatedName ? `${truncatedName}-${tag}` : tag;
      if (testName.length <= MAX_FILENAME_LENGTH) {
        truncatedName = testName;
        usedTags++;
      } else {
        break;
      }
    }
    
    newName = truncatedName;
    console.log(`📝 Использовано ${usedTags} из ${cleanTags.length} тегов (${newName.length} символов)`);
  } else {
    console.log(`📝 Используем ВСЕ ${cleanTags.length} тегов (${newName.length} символов)`);
  }
  
  // Логируем информацию о тегах
  console.log(`🏷️ Теги: ${cleanTags.join(', ')}`);
  console.log(`📄 Итоговое имя файла: ${newName}`);
  
  return newName || sanitizeFileName(originalName);
}

/**
 * Переименовывает файл изображения
 */
async function renameImageFile(oldPath: string, newName: string): Promise<string> {
  const dir = path.dirname(oldPath);
  const ext = path.extname(oldPath);
  const newPath = path.join(dir, `${newName}${ext}`);
  
  await fs.rename(oldPath, newPath);
  return newPath;
}

/**
 * Выбирает лучший вариант на основе контекста
 */
function selectBestVariant(
  variants: VariantInfo[],
  context?: NewsRabbitsProcessorParams['context']
): VariantInfo | undefined {
  
  if (variants.length === 0) return undefined;
  if (variants.length === 1) return variants[0];

  // Сортируем по confidence и возвращаем лучший
  const sorted = variants.sort((a, b) => b.confidence - a.confidence);
  return sorted[0];
}

/**
 * Вычисляет confidence для варианта
 */
function calculateVariantConfidence(variant: FigmaPageNode, parent: FigmaPageNode): number {
  // Базовый confidence
  let confidence = 0.5;

  // Увеличиваем confidence, если вариант имеет осмысленные свойства
  if (variant.variantProperties) {
    confidence += Object.keys(variant.variantProperties).length * 0.1;
  }

  // Увеличиваем confidence, если имя варианта содержит ключевые слова
  const name = variant.name.toLowerCase();
  if (name.includes('default') || name.includes('основной')) confidence += 0.2;
  if (name.includes('active') || name.includes('активный')) confidence += 0.15;

  return Math.min(confidence, 1.0);
}

/**
 * Очищает имя файла от недопустимых символов
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Zа-яА-Я0-9\-\s]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
    // Убрали ограничение .substring(0, 100), чтобы использовать все теги
}

/**
 * Генерирует отчет о обработке
 */
async function generateProcessingReport(
  processedAssets: ProcessedAsset[],
  outputDir: string,
  context?: NewsRabbitsProcessorParams['context']
): Promise<string> {
  
  const report = {
    summary: {
      totalAssets: processedAssets.length,
      assetsWithVariants: processedAssets.filter(a => a.metadata.hasVariants).length,
      totalVariants: processedAssets.reduce((sum, a) => sum + (a.variants?.length || 0), 0),
      uniqueTags: Array.from(new Set(processedAssets.flatMap(a => a.tags))),
      averageConfidence: processedAssets.reduce((sum, a) => sum + a.metadata.aiAnalysis.confidence, 0) / processedAssets.length
    },
    assets: processedAssets.map(asset => ({
      originalName: asset.originalName,
      newName: asset.newName,
      tags: asset.tags,
      hasVariants: asset.metadata.hasVariants,
      variantCount: asset.variants?.length || 0,
      aiConfidence: asset.metadata.aiAnalysis.confidence,
      emotionalTone: asset.metadata.aiAnalysis.emotionalTone
    })),
    timestamp: new Date().toISOString()
  };

  const reportPath = path.join(outputDir, 'processing-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  return reportPath;
} 