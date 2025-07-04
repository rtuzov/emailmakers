import { NextRequest, NextResponse } from 'next/server';
// import { processAllFigmaPages } from '@/agent/tools/figma-all-pages-processor';

// Stub implementation
async function processAllFigmaPages(params: any) {
  return { success: false, error: 'processAllFigmaPages not implemented' };
}
import { getUsageModel } from '../../../../shared/utils/model-config';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 API: Запуск обработки одной страницы Figma');

    const body = await request.json();
    
    const { figmaUrl, outputDirectory, targetPageId, context } = body;

    if (!figmaUrl) {
      return NextResponse.json(
        { error: 'figmaUrl is required' },
        { status: 400 }
      );
    }

    if (!targetPageId) {
      return NextResponse.json(
        { error: 'targetPageId is required for single page processing' },
        { status: 400 }
      );
    }

    console.log('📋 Параметры обработки одной страницы:', {
      figmaUrl,
      targetPageId,
      outputDirectory: outputDirectory || 'auto-generated',
      context: context || 'default'
    });

    // Модифицируем процессор для обработки только одной страницы
    const result = await processSinglePageOnly({
      figmaUrl,
      outputDirectory,
      targetPageId,
      context
    });

    if (!result.success) {
      console.error('❌ Ошибка обработки страницы:', result.error);
      return NextResponse.json(
        { error: result.error || 'Processing failed' },
        { status: 500 }
      );
    }

    console.log('✅ Обработка страницы завершена успешно');
    console.log(`📊 Результат: ${result.data.processedAssets} ассетов`);

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Успешно обработана страница с ${result.data.processedAssets} ассетами`
    });

  } catch (error) {
    console.error('💥 Критическая ошибка в API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Модифицированная версия процессора для обработки только одной страницы
 */
async function processSinglePageOnly(params: {
  figmaUrl: string;
  outputDirectory?: string;
  targetPageId: string;
  context?: any;
}) {
  try {
    // Импортируем необходимые функции из all-pages-processor
    const { config } = await import('dotenv');
    const path = await import('path');
    const fs = await import('fs/promises');

    // Load .env.local file
    config({ path: path.resolve(process.cwd(), '.env.local') });

    const { TagDictionaryManager } = await import('@/agent/tools/figma-tag-dictionary');
    // const { TagOptimizationService } = await import('@/agent/tools/tag-optimization-service');
    
    // Stub implementation
    class TagOptimizationService {
      static async optimize(params: any) {
        return { success: false, error: 'TagOptimizationService not implemented' };
      }
    }

    console.log('🎯 Single Page Processor: Начинаем обработку одной страницы');

    const figmaToken = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN;
    
    if (!figmaToken) {
      throw new Error('FIGMA_ACCESS_TOKEN не найден в переменных окружения');
    }

    // Извлекаем данные из Figma URL
    const { fileId } = extractFigmaIds(params.figmaUrl);
    
    // Получаем конкретную страницу из Figma файла
    const pageData = await getFigmaPageStructure(figmaToken, fileId, params.targetPageId);
    
    console.log(`📄 Обрабатываем страницу: "${pageData.name}"`);

    // Создаем директорию для результатов
    const outputDir = params.outputDirectory || path.join(process.cwd(), `figma-single-page-${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });

    console.log(`📁 Создана папка: ${outputDir}`);

    // Создаем менеджер словаря тегов
    const tagDictionaryManager = new TagDictionaryManager(outputDir);
    const tagDictionary = await tagDictionaryManager.loadOrCreateDictionary();
    const tagOptimizer = new TagOptimizationService();

    // Находим все компоненты на странице
    const components = await findAllComponents(pageData);
    
    console.log(`🔍 Найдено ${components.length} компонентов на странице`);

    const processedAssets = [];

    // Обрабатываем каждый компонент
    for (const component of components) {
      console.log(`⚙️ Обрабатываем: "${component.name}"`);
      
      try {
        const processedAsset = await processComponent(
          figmaToken,
          fileId,
          component,
          outputDir,
          params.context,
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
    const agentExportPath = `${outputDir}/agent-file-mapping.json`;
    await tagDictionaryManager.exportForAgent(tagDictionary, agentExportPath);

    // Генерируем отчет для страницы
    await generatePageReport(processedAssets, outputDir, pageData.name, params.context);

    return {
      success: true,
      data: {
        pageName: pageData.name,
        pageId: params.targetPageId,
        processedAssets: processedAssets.length,
        totalComponents: components.length,
        outputDirectory: outputDir,
        tagDictionary,
        summary: {
          totalTags: tagDictionary.totalTags,
          uniqueTags: tagDictionary.uniqueTags.length,
          averageTagsPerFile: tagDictionary.totalFiles > 0 ? tagDictionary.totalTags / tagDictionary.totalFiles : 0
        }
      },
      metadata: {
        tool: 'figma-single-page-processor',
        timestamp: new Date().toISOString(),
        figmaFile: fileId,
        targetPageId: params.targetPageId
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Вспомогательные функции (копируем из all-pages-processor)
function extractFigmaIds(figmaUrl: string): { fileId: string } {
  const urlMatch = figmaUrl.match(/figma\.com\/design\/([a-zA-Z0-9]+)/);
  if (!urlMatch) {
    throw new Error('Неверный формат Figma URL');
  }
  return { fileId: urlMatch[1] };
}

async function getFigmaPageStructure(token: string, fileId: string, nodeId: string) {
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

async function findAllComponents(pageNode: any): Promise<any[]> {
  const components: any[] = [];
  
  function traverse(node: any) {
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

function isProcessableComponent(node: any): boolean {
  const isComponent = node.type === 'COMPONENT' || node.type === 'COMPONENT_SET' || node.type === 'INSTANCE';
  return isComponent;
}

async function processComponent(
  token: string,
  fileId: string,
  component: any,
  outputDir: string,
  context: any,
  tagDictionary: any,
  tagDictionaryManager: any,
  tagOptimizer: any
) {
  const OpenAI = (await import('openai')).default;
  const path = await import('path');
  const fs = await import('fs/promises');
  
  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Если это COMPONENT_SET с вариантами, обрабатываем каждый вариант отдельно
  if (component.type === 'COMPONENT_SET' && component.children) {
    console.log(`🎨 Анализируем варианты для "${component.name}"`);
    const variants = await analyzeComponentVariants(token, fileId, component, outputDir, context, tagDictionary, tagDictionaryManager, tagOptimizer, openai);
    
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
    context,
    openai
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
    const { generateShortFileName } = await import('@/agent/tools/figma-tag-dictionary');
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

async function generatePageReport(
  processedAssets: any[],
  outputDir: string,
  pageName: string,
  context: any
): Promise<string> {
  
  const report = {
    pageName,
    timestamp: new Date().toISOString(),
    context,
    summary: {
      totalAssets: processedAssets.length,
      assetsWithVariants: processedAssets.filter(a => a.metadata.hasVariants).length,
      averageConfidence: processedAssets.reduce((sum, a) => sum + a.metadata.aiAnalysis.confidence, 0) / processedAssets.length || 0,
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

  const path = await import('path');
  const fs = await import('fs/promises');
  
  const reportPath = path.join(outputDir, 'page-processing-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  return reportPath;
}

// Дополнительные вспомогательные функции для полной обработки
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
  
  const path = await import('path');
  const fs = await import('fs/promises');
  
  const filePath = path.join(outputDir, fileName);
  await fs.writeFile(filePath, imageBuffer);
  
  return filePath;
}

async function analyzeImageWithAI(
  imagePath: string,
  componentName: string,
  context: any,
  openai: any
): Promise<any> {
  
  try {
    const fs = await import('fs/promises');
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
         let contextPrompt = '';
     if (context?.variant_info) {
       contextPrompt += `${context.variant_info}. Название варианта: "${context.variant_name}".`;
     }

    const response = await openai.chat.completions.create({
      model: getUsageModel(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
                             text: `Проанализируй это изображение и создай теги на русском языке, описывающие его содержимое.

${contextPrompt}

Верни ТОЛЬКО JSON в формате:
{
  "suggestedTags": ["тег1", "тег2", "тег3", "тег4", "тег5"],
  "contentDescription": "краткое описание того, что изображено",
  "emotionalTone": "эмоциональный тон (радостный/грустный/нейтральный/удивленный/злой/и т.д.)",
  "usageContext": ["где может использоваться", "тип контента"],
  "confidence": 0.95,
  "reasoning": "объяснение выбора тегов"
}

Исходное название: "${componentName}"

Требования:
- Анализируй ТОЛЬКО то, что видишь на изображении
- НЕ добавляй теги, которых нет на изображении
- Используй конкретные, описательные теги
- Теги должны быть на русском языке
- Максимум 5-7 тегов
- Фокусируйся на визуальных элементах, цветах, объектах, эмоциях`
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
    console.error(`❌ AI анализ изображения ${componentName} не удался:`, error.message);
    throw new Error(`❌ FigmaAPI: AI image analysis failed for ${componentName} - ${error.message}. No fallback analysis allowed.`);
  }
}

// generateFallbackTags function removed - NO FALLBACK ALLOWED
// All components must be processed through AI analysis

async function renameImageFile(oldPath: string, newName: string): Promise<string> {
  const path = await import('path');
  const fs = await import('fs/promises');
  
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
  component: any,
  outputDir: string,
  context: any,
  tagDictionary: any,
  tagDictionaryManager: any,
  tagOptimizer: any,
  openai: any
): Promise<any[]> {
  
  if (!component.children) return [];

  const variants: any[] = [];
  
  const variantIds = component.children.map((child: any) => child.id);
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
    
         // Создаем временное имя для варианта
     const tempVariantName = `${sanitizeFileName(child.name)}-temp-variant-${i + 1}`;
     const variantPath = await saveComponentImage(
       imageBuffer,
       tempVariantName,
       outputDir,
       ''
     );

         // Улучшенный анализ для вариантов с более детальным контекстом
     const variantContext = {
       ...context,
       variant_info: `Вариант ${i + 1} из ${component.children.length} компонента "${component.name}"`,
       variant_name: child.name
     };
     
     const aiAnalysis = await analyzeImageWithAI(
       variantPath,
       child.name,
       variantContext,
       openai
     );

    let optimizedTags = aiAnalysis.suggestedTags;
    let shortName = '';
    
         if (tagOptimizer) {
       const hasRabbit = child.name.toLowerCase().includes('заяц') || 
                        aiAnalysis.suggestedTags.some((tag: string) => tag.toLowerCase().includes('заяц')) ||
                        aiAnalysis.contentDescription.toLowerCase().includes('заяц');
       
       const optimizationResult = tagOptimizer.optimizeTags(aiAnalysis.suggestedTags, hasRabbit);
       optimizedTags = optimizationResult.optimizedTags;
       
       // Добавляем номер варианта к имени файла для уникальности
       const baseShortName = optimizationResult.shortFileName;
       shortName = `${baseShortName}-v${i + 1}`;
     } else {
       const { generateShortFileName } = await import('@/agent/tools/figma-tag-dictionary');
       const result = generateShortFileName(aiAnalysis.suggestedTags);
       shortName = `${result.shortName}-v${i + 1}`;
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
  variants: any[],
  context?: any
): any | undefined {
  if (variants.length === 0) return undefined;
  
  return variants.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'info') {
      return NextResponse.json({
        endpoint: '/api/figma/process-single-page',
        description: 'Процессор для обработки одной конкретной страницы Figma файла',
        methods: {
          POST: {
            description: 'Запускает обработку одной страницы',
            parameters: {
              figmaUrl: 'string (required) - URL Figma файла',
              targetPageId: 'string (required) - ID страницы для обработки',
              outputDirectory: 'string (optional) - Директория для результатов',
              context: {
                campaign_type: 'urgent | newsletter | seasonal | promotional | informational',
                content_theme: 'string - Тема контента',
                target_audience: 'string - Целевая аудитория', 
                brand_guidelines: 'string[] - Бренд-гайдлайны'
              }
            }
          }
        },
        features: [
          'Обработка одной конкретной страницы',
          'Быстрая обработка без загрузки всего файла',
          'Генерация тегов с помощью GPT-4',
          'Оптимизация тегов и имен файлов',
          'Автоматическое сохранение словаря после каждого файла'
        ],
        availablePages: {
          'цвета': '930:967',
          'айдентика': '1989:9',
          'зайцы-общие': '1718:2',
          'зайцы-прочее': '9622:1080',
          'зайцы-подборка': '9622:1059',
          'зайцы-новости': '9622:1068',
          'зайцы-эмоции': '9622:1076',
          'иллюстрации': '3077:274',
          'иконки': '1816:2',
          'логотипы': '2926:2'
        }
      });
    }

    return NextResponse.json({
      message: 'Figma Single Page Processor API',
      usage: 'POST с параметрами figmaUrl, targetPageId, outputDirectory, context',
      info: 'GET ?action=info для подробной информации'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get API info' },
      { status: 500 }
    );
  }
} 