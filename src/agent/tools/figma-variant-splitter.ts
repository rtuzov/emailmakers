import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises';

// Load .env.local file
config({ path: path.resolve(process.cwd(), '.env.local') });

// Import only what we need to break circular dependency
import { handleToolErrorUnified } from '../core/error-orchestrator';
import { logger } from '../core/logger';

// Define ToolResult locally to avoid circular import
interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Local error handling function
function handleToolError(toolName: string, error: any): ToolResult {
  logger.error(`Tool ${toolName} failed`, { error });
  return handleToolErrorUnified(toolName, error);
}

interface FigmaVariantSplitterParams {
  assetPath?: string;        // Путь к локальному ассету
  figmaNodeId?: string;      // ID нода в Figma для прямого анализа
  figmaUrl?: string;         // Полный URL Figma для извлечения node ID
  context?: {
    campaign_type?: 'urgent' | 'newsletter' | 'seasonal' | 'promotional' | 'informational';
    emotional_tone?: 'positive' | 'neutral' | 'urgent' | 'friendly';
    preferred_variant?: 'first' | 'middle' | 'last' | 'auto'; // Предпочтительный вариант
  };
}

interface FigmaVariantResult {
  variants: VariantInfo[];
  selected_variant: VariantInfo | null;
  selection_reason: string;
  metadata: {
    source_type: 'local_asset' | 'figma_api';
    source_path?: string;
    figma_node_id?: string;
    total_variants: number;
    extraction_method: string;
  };
}

interface VariantInfo {
  id: string;
  name: string;
  path: string;
  properties?: Record<string, string>;
  dimensions: {
    width: number;
    height: number;
  };
  position?: {
    x: number;
    y: number;
  };
  confidence_score: number;
  description: string;
}

interface FigmaNodeStructure {
  id: string;
  name: string;
  type: string;
  children?: FigmaNodeStructure[];
  variantProperties?: Record<string, string>;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Figma Variant Splitter Tool
 * Автоматически разделяет Figma ассеты на варианты и выбирает подходящий
 */
export async function splitFigmaVariants(params: FigmaVariantSplitterParams): Promise<ToolResult> {
  try {
    console.log('🎯 Figma Variant Splitter: Начинаем разделение вариантов');

    const figmaToken = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN;
    const figmaProjectId = process.env.FIGMA_PROJECT_ID;

    if (!figmaToken || !figmaProjectId) {
      throw new Error('Figma credentials not found. FIGMA_ACCESS_TOKEN and FIGMA_PROJECT_ID required.');
    }

    let result: FigmaVariantResult;

    // Определяем источник данных
    if (params.figmaNodeId || params.figmaUrl) {
      // Работаем с Figma API
      const nodeId = params.figmaNodeId || extractNodeIdFromUrl(params.figmaUrl!);
      result = await splitFromFigmaAPI(figmaToken, figmaProjectId, nodeId, params.context);
    } else if (params.assetPath) {
      // Работаем с локальным ассетом
      result = await splitFromLocalAsset(params.assetPath, params.context);
    } else {
      throw new Error('Either assetPath, figmaNodeId, or figmaUrl must be provided');
    }

    // Выбираем подходящий вариант
    if (result.variants.length > 0) {
      const selectedVariant = selectBestVariant(result.variants, params.context);
      result.selected_variant = selectedVariant.variant;
      result.selection_reason = selectedVariant.reason;
    }

    console.log(`✅ Обработано ${result.variants.length} вариантов, выбран: ${result.selected_variant?.name || 'none'}`);

    return {
      success: true,
      data: result,
      metadata: {
        tool: 'figma-variant-splitter',
        timestamp: new Date().toISOString(),
        source: result.metadata.source_type
      }
    };

  } catch (error) {
    return handleToolError('splitFigmaVariants', error);
  }
}

/**
 * Разделение вариантов через Figma API
 */
async function splitFromFigmaAPI(
  token: string, 
  projectId: string, 
  nodeId: string, 
  context?: FigmaVariantSplitterParams['context']
): Promise<FigmaVariantResult> {
  console.log(`🔍 Анализируем Figma node: ${nodeId}`);

  // Получаем структуру нода
  const nodeUrl = `https://api.figma.com/v1/files/${projectId}/nodes?ids=${nodeId}`;
  
  const nodeResponse = await fetch(nodeUrl, {
    headers: { 'X-Figma-Token': token }
  });

  if (!nodeResponse.ok) {
    throw new Error(`Figma API request failed: ${nodeResponse.status}`);
  }

  const nodeData = await nodeResponse.json();
  
  if (nodeData.err) {
    throw new Error(`Figma API error: ${nodeData.err}`);
  }

  const targetNode = nodeData.nodes[nodeId]?.document;
  
  if (!targetNode) {
    throw new Error('Target node not found');
  }

  console.log(`📋 Найден ${targetNode.type}: "${targetNode.name}"`);

  let variants: VariantInfo[] = [];

  if (targetNode.type === 'COMPONENT_SET' && targetNode.children) {
    // Это набор компонентов с вариантами
    console.log(`🎨 Обнаружено ${targetNode.children.length} вариантов в COMPONENT_SET`);
    
    // Экспортируем каждый вариант отдельно
    const variantIds = targetNode.children.map((child: any) => child.id);
    const exportUrl = `https://api.figma.com/v1/images/${encodeURIComponent(projectId)}?ids=${variantIds.join(',')}&format=png&scale=2`;
    
    const exportResponse = await fetch(exportUrl, {
      headers: { 'X-Figma-Token': token }
    });
    
    const exportData = await exportResponse.json();
    
    if (exportData.err) {
      throw new Error(`Export failed: ${exportData.err}`);
    }

    // Создаем директорию для вариантов
    const outputDir = path.join(process.cwd(), 'figma-assets', `variants-${nodeId}-${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });

    // Скачиваем каждый вариант
    for (let i = 0; i < targetNode.children.length; i++) {
      const child = targetNode.children[i];
      const imageUrl = exportData.images[child.id];
      
      if (!imageUrl) {
        console.log(`⚠️ Нет URL для варианта ${child.name}`);
        continue;
      }

      console.log(`📥 Скачиваем вариант: "${child.name}"`);
      
      const imageResponse = await fetch(imageUrl);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      
      const filename = `variant-${i + 1}-${sanitizeFilename(child.name)}.png`;
      const outputPath = path.join(outputDir, filename);
      
      await fs.writeFile(outputPath, buffer);

      // Определяем описание варианта
      const description = generateVariantDescription(child, i, targetNode.children.length);
      
      variants.push({
        id: child.id,
        name: child.name,
        path: outputPath,
        properties: child.variantProperties || {},
        dimensions: {
          width: child.absoluteBoundingBox?.width || 0,
          height: child.absoluteBoundingBox?.height || 0
        },
        position: child.absoluteBoundingBox ? {
          x: child.absoluteBoundingBox.x,
          y: child.absoluteBoundingBox.y
        } : undefined,
        confidence_score: 0.9, // Высокая уверенность для API экспорта
        description
      });
    }

  } else {
    // Это обычный компонент, попробуем найти локальный ассет для разделения
    console.log('🔍 Обычный компонент, ищем локальный ассет для pixel-анализа');
    
    // Экспортируем оригинальное изображение
    const exportUrl = `https://api.figma.com/v1/images/${encodeURIComponent(projectId)}?ids=${nodeId}&format=png&scale=2`;
    
    const exportResponse = await fetch(exportUrl, {
      headers: { 'X-Figma-Token': token }
    });
    
    const exportData = await exportResponse.json();
    
    if (exportData.err) {
      throw new Error(`Export failed: ${exportData.err}`);
    }

    const imageUrl = exportData.images[nodeId];
    if (imageUrl) {
      // Скачиваем и анализируем
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      const tempPath = path.join(tempDir, `figma-node-${nodeId}-${Date.now()}.png`);
      
      const imageResponse = await fetch(imageUrl);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      await fs.writeFile(tempPath, buffer);
      
      console.log(`📥 Скачан ассет для анализа: ${tempPath}`);
      
      // Анализируем локально
      const localResult = await splitFromLocalAsset(tempPath, context);
      variants = localResult.variants;
    }
  }

  return {
    variants,
    selected_variant: null,
    selection_reason: '',
    metadata: {
      source_type: 'figma_api',
      figma_node_id: nodeId,
      total_variants: variants.length,
      extraction_method: targetNode.type === 'COMPONENT_SET' ? 'api_export' : 'pixel_analysis'
    }
  };
}

/**
 * Разделение вариантов из локального ассета
 */
async function splitFromLocalAsset(
  assetPath: string, 
  context?: FigmaVariantSplitterParams['context']
): Promise<FigmaVariantResult> {
  console.log(`🖼️ Анализируем локальный ассет: ${assetPath}`);

  // Проверяем существование файла
  try {
    await fs.access(assetPath);
  } catch {
    throw new Error(`Asset file not found: ${assetPath}`);
  }

  // Используем существующий sprite splitter для pixel-анализа
  const sharp = require('sharp');
  
  const image = sharp(assetPath);
  const metadata = await image.metadata();
  
  console.log(`📐 Размеры изображения: ${metadata.width}×${metadata.height}`);

  const variants: VariantInfo[] = [];

  // Улучшенная эвристика для определения вариантов
  if (metadata.width && metadata.height) {
    const aspectRatio = metadata.width / metadata.height;
    
    if (aspectRatio > 1.5) {
      // Горизонтальное расположение - анализируем пустые колонки
      console.log('🔄 Обнаружено горизонтальное расположение вариантов');
      const horizontalVariants = await analyzeHorizontalVariants(image, metadata, assetPath);
      variants.push(...horizontalVariants);
      
    } else if (aspectRatio < 1.2) {
      // Вертикальное расположение - анализируем пустые строки
      console.log('🔄 Обнаружено вертикальное расположение вариантов');
      const verticalVariants = await analyzeVerticalVariants(image, metadata, assetPath);
      variants.push(...verticalVariants);
      
    } else {
      // Неопределенное соотношение - пробуем оба метода
      console.log('🔄 Неопределенное соотношение сторон - пробуем оба метода анализа');
      
      // Сначала пробуем вертикальный анализ
      const verticalVariants = await analyzeVerticalVariants(image, metadata, assetPath);
      if (verticalVariants.length > 1) {
        variants.push(...verticalVariants);
      } else {
        // Если вертикальный не дал результата, пробуем горизонтальный
        const horizontalVariants = await analyzeHorizontalVariants(image, metadata, assetPath);
        if (horizontalVariants.length > 1) {
          variants.push(...horizontalVariants);
        } else {
          // Если ничего не найдено, считаем единственным вариантом
          console.log('🔄 Варианты не найдены - предполагаем один вариант');
          
          variants.push({
            id: 'local-single',
            name: 'Single Variant',
            path: assetPath,
            dimensions: {
              width: metadata.width,
              height: metadata.height
            },
            confidence_score: 0.9,
            description: 'Единственный вариант'
          });
        }
      }
    }
  }

  return {
    variants,
    selected_variant: null,
    selection_reason: '',
    metadata: {
      source_type: 'local_asset',
      source_path: assetPath,
      total_variants: variants.length,
      extraction_method: 'smart_pixel_analysis'
    }
  };
}

/**
 * Анализ горизонтальных вариантов с поиском разделителей
 */
async function analyzeHorizontalVariants(
  image: any, 
  metadata: any, 
  assetPath: string
): Promise<VariantInfo[]> {
  const variants: VariantInfo[] = [];
  
  try {
    // Получаем данные пикселей для анализа
    const { data } = await image.raw().toBuffer({ resolveWithObject: true });
    const channels = metadata.channels || 4;
    
    // Анализируем колонки на предмет пустых областей
    const emptyColumns: number[] = [];
    
    for (let x = 0; x < metadata.width; x++) {
      let isEmpty = true;
      
      for (let y = 0; y < metadata.height; y++) {
        const pixelIndex = (y * metadata.width + x) * channels;
        
        // Проверяем альфа-канал (если есть) или яркость
        const alpha = channels === 4 ? data[pixelIndex + 3] : 255;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        // Считаем пиксель непустым, если есть альфа или не белый/прозрачный
        if (alpha > 10 && (r < 240 || g < 240 || b < 240)) {
          isEmpty = false;
          break;
        }
      }
      
      if (isEmpty) {
        emptyColumns.push(x);
      }
    }
    
    console.log(`📊 Найдено ${emptyColumns.length} пустых колонок`);
    
    // Находим группы пустых колонок (разделители)
    const separators = findSeparators(emptyColumns, 5); // минимум 5 пикселей для разделителя
    
    if (separators.length > 0) {
      console.log(`🔍 Найдено ${separators.length} разделителей: ${separators.join(', ')}`);
      
      // Создаем варианты на основе разделителей
      let startX = 0;
      
      for (let i = 0; i <= separators.length; i++) {
        const endX = i < separators.length ? separators[i] : metadata.width;
        const variantWidth = endX - startX;
        
        if (variantWidth > 50) { // Минимальная ширина варианта
          const outputPath = assetPath.replace('.png', `-variant-${i + 1}.png`);
          
          try {
            await image
              .extract({ left: startX, top: 0, width: variantWidth, height: metadata.height })
              .png()
              .toFile(outputPath);
            
            variants.push({
              id: `horizontal-variant-${i + 1}`,
              name: `Variant ${i + 1}`,
              path: outputPath,
              dimensions: {
                width: variantWidth,
                height: metadata.height
              },
              position: { x: startX, y: 0 },
              confidence_score: 0.8,
              description: `Горизонтальный вариант ${i + 1} (${startX}-${endX}px)`
            });
            
            console.log(`✅ Создан вариант ${i + 1}: ${startX}-${endX}px (ширина: ${variantWidth}px)`);
            
          } catch (error) {
            console.log(`⚠️ Ошибка создания варианта ${i + 1}: ${error.message}`);
          }
        }
        
        startX = endX;
      }
    } else {
      // Если разделители не найдены, делим на равные части
      console.log('🔄 Разделители не найдены, используем равномерное деление');
      return await createEqualHorizontalVariants(image, metadata, assetPath, 3);
    }
    
  } catch (error) {
    console.log(`❌ Ошибка анализа горизонтальных вариантов: ${error.message}`);
  }
  
  return variants;
}

/**
 * Анализ вертикальных вариантов с поиском разделителей
 */
async function analyzeVerticalVariants(
  image: any, 
  metadata: any, 
  assetPath: string
): Promise<VariantInfo[]> {
  const variants: VariantInfo[] = [];
  
  try {
    // Получаем данные пикселей для анализа
    const { data } = await image.raw().toBuffer({ resolveWithObject: true });
    const channels = metadata.channels || 4;
    
    // Анализируем строки на предмет пустых областей
    const emptyRows: number[] = [];
    
    for (let y = 0; y < metadata.height; y++) {
      let isEmpty = true;
      
      for (let x = 0; x < metadata.width; x++) {
        const pixelIndex = (y * metadata.width + x) * channels;
        
        // Проверяем альфа-канал (если есть) или яркость
        const alpha = channels === 4 ? data[pixelIndex + 3] : 255;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        // Считаем пиксель непустым, если есть альфа или не белый/прозрачный
        if (alpha > 10 && (r < 240 || g < 240 || b < 240)) {
          isEmpty = false;
          break;
        }
      }
      
      if (isEmpty) {
        emptyRows.push(y);
      }
    }
    
    console.log(`📊 Найдено ${emptyRows.length} пустых строк`);
    
    // Находим группы пустых строк (разделители)
    const separators = findSeparators(emptyRows, 10); // минимум 10 пикселей для разделителя
    
    if (separators.length > 0) {
      console.log(`🔍 Найдено ${separators.length} разделителей: ${separators.join(', ')}`);
      
      // Создаем варианты на основе разделителей
      let startY = 0;
      
      for (let i = 0; i <= separators.length; i++) {
        const endY = i < separators.length ? separators[i] : metadata.height;
        const variantHeight = endY - startY;
        
        if (variantHeight > 100) { // Минимальная высота варианта
          const outputPath = assetPath.replace('.png', `-variant-${i + 1}.png`);
          
          try {
            await image
              .extract({ left: 0, top: startY, width: metadata.width, height: variantHeight })
              .png()
              .toFile(outputPath);
            
            variants.push({
              id: `vertical-variant-${i + 1}`,
              name: `Variant ${i + 1}`,
              path: outputPath,
              dimensions: {
                width: metadata.width,
                height: variantHeight
              },
              position: { x: 0, y: startY },
              confidence_score: 0.8,
              description: `Вертикальный вариант ${i + 1} (${startY}-${endY}px)`
            });
            
            console.log(`✅ Создан вариант ${i + 1}: ${startY}-${endY}px (высота: ${variantHeight}px)`);
            
          } catch (error) {
            console.log(`⚠️ Ошибка создания варианта ${i + 1}: ${error.message}`);
          }
        }
        
        startY = endY;
      }
    } else {
      // Если разделители не найдены, делим на равные части
      console.log('🔄 Разделители не найдены, используем равномерное деление');
      return await createEqualVerticalVariants(image, metadata, assetPath, 3);
    }
    
  } catch (error) {
    console.log(`❌ Ошибка анализа вертикальных вариантов: ${error.message}`);
  }
  
  return variants;
}

/**
 * Поиск разделителей в массиве пустых позиций
 */
function findSeparators(emptyPositions: number[], minGapSize: number): number[] {
  if (emptyPositions.length === 0) return [];
  
  const separators: number[] = [];
  let gapStart = -1;
  let gapSize = 0;
  
  for (let i = 1; i < emptyPositions.length; i++) {
    if (emptyPositions[i] === emptyPositions[i - 1] + 1) {
      // Продолжение группы
      if (gapStart === -1) {
        gapStart = emptyPositions[i - 1];
      }
      gapSize++;
    } else {
      // Конец группы
      if (gapSize >= minGapSize && gapStart !== -1) {
        // Добавляем середину группы как разделитель
        separators.push(gapStart + Math.floor(gapSize / 2));
      }
      gapStart = -1;
      gapSize = 0;
    }
  }
  
  // Проверяем последнюю группу
  if (gapSize >= minGapSize && gapStart !== -1) {
    separators.push(gapStart + Math.floor(gapSize / 2));
  }
  
  return separators;
}

/**
 * Создание равномерных горизонтальных вариантов
 */
async function createEqualHorizontalVariants(
  image: any, 
  metadata: any, 
  assetPath: string, 
  count: number
): Promise<VariantInfo[]> {
  const variants: VariantInfo[] = [];
  const variantWidth = Math.floor(metadata.width / count);
  
  for (let i = 0; i < count; i++) {
    const x = i * variantWidth;
    const outputPath = assetPath.replace('.png', `-variant-${i + 1}.png`);
    
    try {
      await image
        .extract({ left: x, top: 0, width: variantWidth, height: metadata.height })
        .png()
        .toFile(outputPath);
      
      variants.push({
        id: `equal-horizontal-variant-${i + 1}`,
        name: `Variant ${i + 1}`,
        path: outputPath,
        dimensions: {
          width: variantWidth,
          height: metadata.height
        },
        position: { x, y: 0 },
        confidence_score: 0.6, // Низкая уверенность для равномерного деления
        description: `Равномерный горизонтальный вариант ${i + 1} из ${count}`
      });
      
    } catch (error) {
      console.log(`⚠️ Ошибка создания равномерного варианта ${i + 1}: ${error.message}`);
    }
  }
  
  return variants;
}

/**
 * Создание равномерных вертикальных вариантов
 */
async function createEqualVerticalVariants(
  image: any, 
  metadata: any, 
  assetPath: string, 
  count: number
): Promise<VariantInfo[]> {
  const variants: VariantInfo[] = [];
  const variantHeight = Math.floor(metadata.height / count);
  
  for (let i = 0; i < count; i++) {
    const y = i * variantHeight;
    const outputPath = assetPath.replace('.png', `-variant-${i + 1}.png`);
    
    try {
      await image
        .extract({ left: 0, top: y, width: metadata.width, height: variantHeight })
        .png()
        .toFile(outputPath);
      
      variants.push({
        id: `equal-vertical-variant-${i + 1}`,
        name: `Variant ${i + 1}`,
        path: outputPath,
        dimensions: {
          width: metadata.width,
          height: variantHeight
        },
        position: { x: 0, y },
        confidence_score: 0.6, // Низкая уверенность для равномерного деления
        description: `Равномерный вертикальный вариант ${i + 1} из ${count}`
      });
      
    } catch (error) {
      console.log(`⚠️ Ошибка создания равномерного варианта ${i + 1}: ${error.message}`);
    }
  }
  
  return variants;
}

/**
 * Выбор лучшего варианта на основе контекста
 */
function selectBestVariant(
  variants: VariantInfo[], 
  context?: FigmaVariantSplitterParams['context']
): { variant: VariantInfo; reason: string } {
  
  if (variants.length === 0) {
    throw new Error('No variants available for selection');
  }

  if (variants.length === 1) {
    return {
      variant: variants[0],
      reason: 'Единственный доступный вариант'
    };
  }

  // Логика выбора на основе контекста
  let selectedIndex = 0;
  let reason = 'Выбран первый вариант по умолчанию';

  if (context?.preferred_variant) {
    switch (context.preferred_variant) {
      case 'first':
        selectedIndex = 0;
        reason = 'Выбран первый вариант по запросу';
        break;
      case 'middle':
        selectedIndex = Math.floor(variants.length / 2);
        reason = 'Выбран средний вариант по запросу';
        break;
      case 'last':
        selectedIndex = variants.length - 1;
        reason = 'Выбран последний вариант по запросу';
        break;
      case 'auto':
        // Автоматический выбор на основе контекста
        selectedIndex = selectVariantByContext(variants, context);
        reason = 'Автоматический выбор на основе контекста кампании';
        break;
    }
  } else if (context?.emotional_tone || context?.campaign_type) {
    // Выбор на основе эмоционального тона и типа кампании
    selectedIndex = selectVariantByContext(variants, context);
    reason = `Выбран на основе тона: ${context.emotional_tone}, типа: ${context.campaign_type}`;
  }

  return {
    variant: variants[selectedIndex],
    reason
  };
}

/**
 * Выбор варианта на основе контекста кампании
 */
function selectVariantByContext(
  variants: VariantInfo[], 
  context: FigmaVariantSplitterParams['context']
): number {
  
  // Простая эвристика:
  // - urgent/positive -> первый вариант (обычно самый яркий)
  // - neutral -> средний вариант
  // - friendly -> последний вариант (обычно самый дружелюбный)
  
  if (context?.emotional_tone === 'urgent' || context?.campaign_type === 'urgent') {
    return 0; // Первый вариант для срочности
  }
  
  if (context?.emotional_tone === 'neutral' || context?.campaign_type === 'informational') {
    return Math.floor(variants.length / 2); // Средний для нейтральности
  }
  
  if (context?.emotional_tone === 'friendly' || context?.campaign_type === 'newsletter') {
    return variants.length - 1; // Последний для дружелюбности
  }
  
  if (context?.emotional_tone === 'positive' || context?.campaign_type === 'promotional') {
    return 0; // Первый для позитива
  }
  
  // По умолчанию средний
  return Math.floor(variants.length / 2);
}

/**
 * Извлечение Node ID из Figma URL
 */
function extractNodeIdFromUrl(url: string): string {
  const match = url.match(/node-id=([^&]+)/);
  if (!match) {
    throw new Error('Cannot extract node ID from Figma URL');
  }
  
  // Декодируем URL-encoded символы
  return decodeURIComponent(match[1]).replace(/-/g, ':');
}

/**
 * Очистка имени файла от недопустимых символов
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9а-яА-Я\s\-_]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

/**
 * Генерация описания варианта
 */
function generateVariantDescription(
  variant: any, 
  index: number, 
  total: number
): string {
  const descriptions = [
    'Первый вариант - обычно основной или наиболее заметный',
    'Средний вариант - сбалансированный выбор',
    'Последний вариант - альтернативный или дополнительный'
  ];
  
  if (variant.variantProperties) {
    const props = Object.entries(variant.variantProperties)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    return `Вариант ${index + 1} из ${total} (${props})`;
  }
  
  return descriptions[Math.min(index, descriptions.length - 1)] || `Вариант ${index + 1} из ${total}`;
}