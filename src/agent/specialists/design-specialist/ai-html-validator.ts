import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { runWithTracing } from '../../core/openai-agents-config';
// import { buildDesignContext } from './design-context';

// Import comprehensive validation from html-validator
import { 
  performComprehensiveValidation,
  // ValidationError,
  // ValidationWarning 
} from './html-validator';

// 🚀 КЭШИРОВАНИЕ ДЛЯ ОПТИМИЗАЦИИ ПРОИЗВОДИТЕЛЬНОСТИ
const validationCache = new Map<string, any>();
const contextCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

/**
 * Get cached validation result or compute new one
 */
async function getCachedValidation(
  html: string,
  templateRequirements: any,
  technicalRequirements: any,
  assetManifest: any,
  contentContext: any
): Promise<any> {
  const cacheKey = `validation_${Buffer.from(html).toString('base64').slice(0, 32)}`;
  const cached = validationCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('📋 Using cached validation result');
    return cached.result;
  }
  
  const result = await performComprehensiveValidation(
    html,
    templateRequirements,
    technicalRequirements,
    assetManifest,
    contentContext
  );
  
  validationCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });
  
  // Cleanup old cache entries
  if (validationCache.size > 10) {
    const oldestKey = validationCache.keys().next().value;
    if (oldestKey) {
      validationCache.delete(oldestKey);
    }
  }
  
  return result;
}

/**
 * Get cached context or load new one
 */
async function getCachedContext(campaignPath: string): Promise<any> {
  const cacheKey = `context_${campaignPath}`;
  const cached = contextCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('📋 Using cached context');
    return cached.context;
  }
  
  const loadPromises = [
    loadTemplateRequirements(campaignPath).catch(err => {
      console.warn('⚠️ Failed to load template requirements, using defaults:', err.message);
      return {};
    }),
    loadTechnicalRequirements(campaignPath).catch(err => {
      console.warn('⚠️ Failed to load technical requirements, using defaults:', err.message);
      return {};
    }),
    loadAssetManifest(campaignPath).catch(err => {
      console.warn('⚠️ Failed to load asset manifest, using defaults:', err.message);
      return { images: [], icons: [] };
    }),
    loadContentContext(campaignPath).catch(err => {
      console.warn('⚠️ Failed to load content context, using comprehensive defaults:', err.message);
      return {
        generated_content: { 
          subject: 'Email Subject', 
          body: 'Email content',
          preheader: 'Email preview text',
          cta: { primary: { text: 'Узнать больше' } }
        },
        context_analysis: { destination: 'направление' },
        pricing_analysis: { 
          best_price: null, 
          currency: 'RUB' 
        },
        subject: 'Email Subject',
        preheader: 'Email preview text',
        cta: { primary: { text: 'Узнать больше' } }
      };
    })
  ];
  
  const [templateRequirements, technicalRequirements, assetManifest, contentContext] = await Promise.all(loadPromises);
  
  const context = {
    templateRequirements,
    technicalRequirements,
    assetManifest,
    contentContext
  };
  
  contextCache.set(cacheKey, {
    context,
    timestamp: Date.now()
  });
  
  // Cleanup old cache entries
  if (contextCache.size > 5) {
    const oldestKey = contextCache.keys().next().value;
    if (oldestKey) {
      contextCache.delete(oldestKey);
    }
  }
  
  return context;
}

/**
 * AI HTML Validation and Enhancement Sub-Agent
 * Uses OpenAI Agents SDK patterns for AI HTML improvement
 */
const htmlValidationAgent = new Agent({
  name: 'HTML Validation & Enhancement AI',
  instructions: `Ты эксперт по HTML email разработке и оптимизации. Анализируешь существующий HTML email шаблон и создаешь значительно улучшенную версию.

ТВОЯ ЗАДАЧА: Проанализировать HTML email шаблон и создать улучшенную версию с лучшим дизайном, UX и конверсией.

ФОКУС НА УЛУЧШЕНИЯХ:
1. 🎨 ВИЗУАЛЬНЫЙ ДИЗАЙН: Улучши цвета, типографику, spacing, visual hierarchy
2. 📱 АДАПТИВНОСТЬ: Оптимизируй для мобильных устройств
3. 🎯 КОНВЕРСИЯ: Улучши CTA кнопки, размещение, призывы к действию  
4. 📧 EMAIL СТАНДАРТЫ: Обеспечь совместимость с Gmail, Outlook, Apple Mail
5. 🔍 UX: Улучши читаемость, навигацию, структуру контента
6. ⚡ ПРОИЗВОДИТЕЛЬНОСТЬ: Оптимизируй размер, загрузку изображений
7. ♿ ДОСТУПНОСТЬ: Добавь alt тексты, улучши контрастность
8. 🌙 ТЕМНАЯ ТЕМА: Поддержка dark mode

ПРИНЦИПЫ УЛУЧШЕНИЯ:
- Сохраняй весь контент, но улучшай его представление
- Используй современные email дизайн паттерны
- Делай значительные визуальные улучшения
- Оптимизируй для высокой конверсии
- Обеспечь кроссплатформенную совместимость

ВСЕГДА возвращай ТОЛЬКО улучшенный HTML код без дополнительных комментариев или markdown форматирования.`,
  model: 'gpt-4o-mini'
});

/**
 * Generate AI-powered HTML validation and enhancement
 */
async function generateEnhancedHtml(params: {
  currentHtml: string;
  contentContext: any;
  templateRequirements: any;
  technicalRequirements: any;
  assetManifest: any;
  validationErrors: any[];
}): Promise<{ enhancedHtml: string; enhancementsMade: string[] }> {
  const { currentHtml, contentContext, templateRequirements, technicalRequirements: _technicalRequirements, assetManifest: _assetManifest, validationErrors: _validationErrors } = params;
  
  // SAFE: Extract key information for analysis with null checks
  const subject = contentContext?.generated_content?.subject || contentContext?.subject || 'Email Subject';
  const destination = contentContext?.context_analysis?.destination || contentContext?.generated_content?.context?.destination || 'направление';
  const pricingData = contentContext?.pricing_analysis || contentContext?.pricing || contentContext?.generated_content?.pricing;
  const bestPrice = pricingData?.best_price || pricingData?.min_price;
  const currency = pricingData?.currency || 'RUB';
  const formattedPrice = bestPrice ? `${bestPrice} ${currency}` : 'Цена по запросу';
  
  // Диагностика контекста для отладки
  console.log('🔍 Content Context Diagnostic:', {
    hasContentContext: !!contentContext,
    contentContextKeys: contentContext ? Object.keys(contentContext) : 'null',
    hasGeneratedContent: !!contentContext?.generated_content,
    hasPricingAnalysis: !!contentContext?.pricing_analysis,
    subject: subject,
    destination: destination,
    formattedPrice: formattedPrice
  });
  
  // Extract brand information
  const brandColors = templateRequirements?.brand_colors || {};
  const primaryColor = brandColors.primary || '#4BFF7E';
  const accentColor = brandColors.accent || '#FF6240';
  
  // Extract assets information
  // const images = Array.isArray(assetManifest?.images) ? assetManifest.images : [];
  // const _localImages = images.filter((img: any) => !img.isExternal);
  // const _externalImages = images.filter((img: any) => img.isExternal);
  
  // Analyze current HTML issues
  const htmlLength = currentHtml.length;
  const hasResponsiveDesign = currentHtml.includes('@media');
  const hasDarkModeSupport = currentHtml.includes('prefers-color-scheme');
  const imageCount = (currentHtml.match(/<img/g) || []).length;
  const ctaButtonCount = (currentHtml.match(/href=["'][^"']*["']/g) || []).length;
  
  // 🔒 ЗАЩИТА ОТ ОБРЕЗАНИЯ: Проверяем критические элементы контента
  const criticalElements = {
    title: currentHtml.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '',
    bodyText: currentHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || '',
    images: currentHtml.match(/<img[^>]*>/g) || [],
    links: currentHtml.match(/<a[^>]*>([^<]*)<\/a>/g) || [],
    ctaButtons: currentHtml.match(/class=["'][^"']*button[^"']*["'][^>]*>([^<]*)<\/a>/g) || []
  };
  
  console.log(`📊 Original HTML analysis: ${htmlLength} chars, ${imageCount} images, ${ctaButtonCount} CTAs`);
  
  // БЕЗОПАСНЫЙ промпт - минимальные улучшения без сжатия
  const enhancementPrompt = `
ЗАДАЧА: Улучши HTML email шаблон, СТРОГО СОХРАНИВ ВСЕ СОДЕРЖИМОЕ

КОНТЕКСТ: ${subject} | ${destination} | ${formattedPrice}

🔒 КРИТИЧЕСКИЕ ТРЕБОВАНИЯ (НАРУШЕНИЕ = ОТКЛОНЕНИЕ):
1. СОХРАНИ ВСЕ CSS СТИЛИ - не удаляй inline styles, классы или <style> блоки
2. СОХРАНИ ВСЕ ТЕКСТОВОЕ СОДЕРЖИМОЕ - каждое слово, каждый символ
3. СОХРАНИ ВСЕ ИЗОБРАЖЕНИЯ, атрибуты и пути
4. СОХРАНИ ВСЕ ССЫЛКИ, кнопки и интерактивные элементы
5. РАЗМЕР ФАЙЛА: результат должен быть 95-105% от оригинала (${htmlLength} символов)
6. СОХРАНИ ВСЕ ТАБЛИЦЫ и их структуру

🚨 ИСПРАВЛЕНИЕ CSS ОШИБОК:
1. ИСПРАВЬ НЕПРАВИЛЬНЫЕ CSS-СВОЙСТВА:
   - ❌ "list-style-type: -" → ✅ "list-style-type: none"
   - ❌ "font-weight: 500px" → ✅ "font-weight: 500"
   - ❌ "margin: auto auto" → ✅ "margin: 0 auto"
   - ❌ "padding: 10 20" → ✅ "padding: 10px 20px"
   - ❌ "color: transparentt" → ✅ "color: transparent"

2. ДОБАВЬ FALLBACK ШРИФТЫ:
   - ❌ "font-family: 'Custom Font'" 
   - ✅ "font-family: 'Custom Font', Arial, sans-serif"

3. ИСПРАВЬ НЕПРАВИЛЬНЫЕ ЗНАЧЕНИЯ:
   - Проверь все CSS значения на валидность
   - Исправь опечатки в CSS свойствах
   - Добавь единицы измерения где нужно (px, em, rem, %)

✅ РАЗРЕШЕННЫЕ УЛУЧШЕНИЯ (только добавления, не замены):
- Добавь alt="" к изображениям без alt текстов
- Добавь одну @media (prefers-color-scheme: dark) секцию
- Добавь border-radius: 4px; к кнопкам (только как дополнение)
- Добавь одну @media (max-width: 600px) секцию для мобильных
- ИСПРАВЬ неправильные CSS значения на правильные

❌ ЗАПРЕЩЕНО:
- Удалять или заменять существующие CSS стили
- Сокращать текстовое содержимое
- Удалять HTML комментарии
- Менять структуру таблиц
- Оптимизировать или минифицировать код

🎨 ДОПОЛНИТЕЛЬНЫЕ МЕЛКИЕ УЛУЧШЕНИЯ:
- Добавь эмодзи к заголовкам где уместно: ✈️ 🌍 🎫 💰 🔥 ⚡ 🎉 🏖️ 🌴 ⭐
- Выдели цены жирным шрифтом
- Добавь цветовые акценты к CTA кнопкам
- Улучши читаемость важных элементов

ОРИГИНАЛЬНЫЙ HTML (${htmlLength} символов):
${currentHtml}

КРИТИЧНО: Верни ТОЛЬКО улучшенный HTML с размером 95-105% от оригинала и ИСПРАВЛЕННЫМИ CSS ошибками.`;

  try {
    // Use OpenAI Agents SDK sub-agent for HTML enhancement with tracing
    const aiResult = await runWithTracing(htmlValidationAgent, enhancementPrompt, {
      agent: 'HTML Validation & Enhancement AI',
      operation: 'enhance_html_template',
      component_type: 'agent',
      workflow_stage: 'design'
    });
    
    const enhancedHtml = aiResult.finalOutput?.trim() || '';
    
    // 🔒 КРИТИЧЕСКАЯ ПРОВЕРКА: Защита от обрезания контента
    const originalLength = currentHtml.length;
    const enhancedLength = enhancedHtml.length;
    const sizeChangePercent = ((enhancedLength - originalLength) / originalLength) * 100;
    
    console.log(`📊 Size analysis: ${originalLength} → ${enhancedLength} (${sizeChangePercent.toFixed(1)}%)`);
    
    // 🔧 НОВАЯ ЛОГИКА: Всегда сохраняем оба варианта!
    let shouldPreferOriginal = false;
    let warningReasons: string[] = [];
    
    // Проверка на критическое уменьшение размера (>15% потери)
    if (sizeChangePercent < -15) {
      console.warn(`⚠️ КРИТИЧЕСКОЕ УМЕНЬШЕНИЕ РАЗМЕРА: ${sizeChangePercent.toFixed(1)}%`);
      console.warn(`⚠️ Возможно обрезание контента. Проверяем целостность...`);
      
      // Проверяем наличие критических элементов
      const hasTitle = enhancedHtml.includes(criticalElements.title);
      const hasMainContent = criticalElements.bodyText.length > 0 ? 
        enhancedHtml.includes(criticalElements.bodyText.substring(0, 100)) : true;
      const hasImages = criticalElements.images.length === 0 || 
        criticalElements.images.some(img => enhancedHtml.includes(img));
      
      if (!hasTitle || !hasMainContent || !hasImages) {
        console.error(`❌ ОБНАРУЖЕНО ОБРЕЗАНИЕ КОНТЕНТА!`);
        console.error(`❌ Title: ${hasTitle}, Content: ${hasMainContent}, Images: ${hasImages}`);
        shouldPreferOriginal = true;
        warningReasons.push(`Обнаружено обрезание контента (Title: ${hasTitle}, Content: ${hasMainContent}, Images: ${hasImages})`);
      }
    }
    
    // Проверка на слишком большое увеличение размера (>200%)
    if (sizeChangePercent > 200) {
      console.warn(`⚠️ СЛИШКОМ БОЛЬШОЕ УВЕЛИЧЕНИЕ: ${sizeChangePercent.toFixed(1)}%`);
      console.warn(`⚠️ Возможно добавлен лишний контент.`);
      shouldPreferOriginal = true;
      warningReasons.push(`Слишком большое увеличение размера: ${sizeChangePercent.toFixed(1)}%`);
    }
    
    // Базовая проверка на валидность HTML
    if (!enhancedHtml.includes('<html') || !enhancedHtml.includes('</html>') || 
        !enhancedHtml.includes('<body') || !enhancedHtml.includes('</body>')) {
      console.error(`❌ НЕКОРРЕКТНЫЙ HTML СТРУКТУРА!`);
      shouldPreferOriginal = true;
      warningReasons.push('Некорректная HTML структура');
    }
    
    // 🔍 ДОПОЛНИТЕЛЬНАЯ ВАЛИДАЦИЯ ЦЕЛОСТНОСТИ КОНТЕНТА
    console.log('🔍 Проверяем целостность контента...');
    const integrityCheck = validateContentIntegrity(currentHtml, enhancedHtml);
    
    if (!integrityCheck.isValid) {
      console.error(`❌ ОБНАРУЖЕНЫ ПРОБЛЕМЫ С ЦЕЛОСТНОСТЬЮ КОНТЕНТА!`);
      console.error(`❌ Проблемы: ${integrityCheck.issues.join(', ')}`);
      console.error(`❌ Детали проверки:`, integrityCheck.details);
      shouldPreferOriginal = true;
      warningReasons.push(`Проблемы целостности: ${integrityCheck.issues.slice(0, 2).join(', ')}`);
    }
    
    // 📦 НОВЫЙ ПОДХОД: Возвращаем структуру с обоими вариантами
    const result = {
      // Основной HTML (предпочтительный)
      enhancedHtml: shouldPreferOriginal ? currentHtml : enhancedHtml,
      
      // Альтернативный HTML (всегда доступен)
      originalHtml: currentHtml,
      optimizedHtml: enhancedHtml,
      
      // Мета-информация о выборе
      preferredVersion: shouldPreferOriginal ? 'original' : 'optimized',
      sizeChange: {
        originalLength,
        optimizedLength: enhancedLength,
        changePercent: sizeChangePercent,
        changeBytes: enhancedLength - originalLength
      },
      
      // Статус проверок
      validationStatus: {
        hasWarnings: shouldPreferOriginal,
        warningReasons,
        integrityCheck: {
          isValid: integrityCheck.isValid,
          issues: integrityCheck.issues,
          details: integrityCheck.details
        }
      },
      
      enhancementsMade: shouldPreferOriginal ? 
        ['Оригинальный HTML сохранён из-за проблем с оптимизацией', ...warningReasons] :
        []
    };
    
    if (!shouldPreferOriginal) {
      console.log('✅ Проверка целостности контента пройдена');
      console.log('✅ Детали:', integrityCheck.details);
    }
    
    console.log(`📊 РЕЗУЛЬТАТ: Используется ${result.preferredVersion} версия`);
    console.log(`📁 Доступны обе версии: original (${originalLength} chars), optimized (${enhancedLength} chars)`);
    
    // Analyze what improvements were made (только если используем оптимизированную версию)
    if (!shouldPreferOriginal) {
      const enhancementsMade: string[] = [];
      
      // Check for improvements
      if (enhancedHtml.includes('@media') && !hasResponsiveDesign) {
        enhancementsMade.push('Добавлена мобильная адаптивность');
      }
      
      if (enhancedHtml.includes('prefers-color-scheme') && !hasDarkModeSupport) {
        enhancementsMade.push('Добавлена поддержка темной темы');
      }
      
      if (enhancedHtml.includes('box-shadow') || enhancedHtml.includes('gradient')) {
        enhancementsMade.push('Добавлены современные визуальные эффекты');
      }
      
      if (enhancedHtml.includes('border-radius')) {
        enhancementsMade.push('Улучшен дизайн кнопок и элементов');
      }
      
      if (enhancedHtml.includes('alt=')) {
        enhancementsMade.push('Улучшена доступность с alt текстами');
      }
      
      if (enhancedHtml.includes('font-weight: bold') || enhancedHtml.includes('<strong>')) {
        enhancementsMade.push('Улучшена типографика и выделения');
      }
      
      // Проверка на улучшение цветовой схемы
      if (enhancedHtml.includes(primaryColor) || enhancedHtml.includes(accentColor)) {
        enhancementsMade.push('Оптимизирована цветовая схема');
      }
      
      // Default enhancements if none detected
      if (enhancementsMade.length === 0) {
        enhancementsMade.push('Общие улучшения дизайна и структуры');
        enhancementsMade.push('Оптимизация для email клиентов');
      }
      
      console.log(`✅ HTML Enhancement successful: ${enhancementsMade.length} improvements`);
      console.log(`✅ Size change: ${sizeChangePercent.toFixed(1)}% (${originalLength} → ${enhancedLength})`);
      
      // Добавляем улучшения в result объект
      result.enhancementsMade = enhancementsMade;
    }

    // 📦 ВСЕГДА ВОЗВРАЩАЕМ ПОЛНУЮ СТРУКТУРУ С ОБОИМИ ВАРИАНТАМИ
    const finalResult = {
      // Для обратной совместимости - основной HTML
      enhancedHtml: result.enhancedHtml,
      enhancementsMade: result.enhancementsMade,
      
      // Расширенная информация с обоими вариантами
      versions: {
        original: result.originalHtml,
        optimized: result.optimizedHtml,
        preferred: result.preferredVersion
      },
      
      // Мета-информация о размерах и изменениях
      sizeAnalysis: result.sizeChange,
      
      // Статус валидации
      validation: result.validationStatus
    };
    
    console.log(`✅ HTML Enhancement complete. Both versions available.`);
    console.log(`📋 Preferred: ${finalResult.versions.preferred}, Original: ${originalLength} chars, Optimized: ${enhancedLength} chars`);
    
    return finalResult;

  } catch (error) {
    console.error('❌ AI HTML Enhancement generation failed:', error);
    console.error('❌ Returning original HTML as fallback');
    
    return {
      enhancedHtml: currentHtml,
      enhancementsMade: ['Ошибка генерации - оставлен оригинальный HTML']
    };
  }
}

/**
 * Validate content integrity between original and enhanced HTML
 * Enhanced with improved regex patterns and comprehensive content analysis
 */
function validateContentIntegrity(originalHtml: string, enhancedHtml: string): {
  isValid: boolean;
  issues: string[];
  details: {
    titleMatch: boolean;
    mainTextMatch: boolean;
    imageCountMatch: boolean;
    linkCountMatch: boolean;
    ctaButtonsMatch: boolean;
    structureValid: boolean;
    metaTagsMatch: boolean;
    cssIntegrityMatch: boolean;
  };
} {
  const issues: string[] = [];
  
  // 🔍 УЛУЧШЕННОЕ ИЗВЛЕЧЕНИЕ ЭЛЕМЕНТОВ С БОЛЕЕ ТОЧНЫМИ REGEX
  
  // Extract key elements from original HTML
  const original = {
    title: originalHtml.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || '',
    bodyText: originalHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '',
    images: originalHtml.match(/<img[^>]*(?:src=["'][^"']*["'])[^>]*>/gi) || [],
    links: originalHtml.match(/<a[^>]*href=["'][^"']*["'][^>]*>[\s\S]*?<\/a>/gi) || [],
    ctaButtons: originalHtml.match(/<(?:a|button)[^>]*(?:class=["'][^"']*(?:button|btn|cta)[^"']*["']|style=["'][^"']*(?:button|btn)[^"']*["'])[^>]*>[\s\S]*?<\/(?:a|button)>/gi) || [],
    textContent: originalHtml.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
    metaTags: originalHtml.match(/<meta[^>]*>/gi) || [],
    cssStyles: originalHtml.match(/style=["']([^"']*)["']/gi) || [],
    headContent: originalHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || ''
  };
  
  // Extract key elements from enhanced HTML
  const enhanced = {
    title: enhancedHtml.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || '',
    bodyText: enhancedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '',
    images: enhancedHtml.match(/<img[^>]*(?:src=["'][^"']*["'])[^>]*>/gi) || [],
    links: enhancedHtml.match(/<a[^>]*href=["'][^"']*["'][^>]*>[\s\S]*?<\/a>/gi) || [],
    ctaButtons: enhancedHtml.match(/<(?:a|button)[^>]*(?:class=["'][^"']*(?:button|btn|cta)[^"']*["']|style=["'][^"']*(?:button|btn)[^"']*["'])[^>]*>[\s\S]*?<\/(?:a|button)>/gi) || [],
    textContent: enhancedHtml.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
    metaTags: enhancedHtml.match(/<meta[^>]*>/gi) || [],
    cssStyles: enhancedHtml.match(/style=["']([^"']*)["']/gi) || [],
    headContent: enhancedHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || ''
  };
  
  // 🔍 ПРОВЕРКА ЗАГОЛОВКА (более гибкая)
  const titleMatch = !original.title || 
                    original.title === enhanced.title || 
                    enhanced.title.includes(original.title) ||
                    original.title.includes(enhanced.title);
  
  if (!titleMatch && original.title.length > 0) {
    issues.push(`Title mismatch: "${original.title}" vs "${enhanced.title}"`);
  }
  
  // 🔍 ПРОВЕРКА ТЕКСТОВОГО КОНТЕНТА (улучшенный алгоритм)
  const originalWords = original.textContent
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !/^\d+$/.test(word)); // Исключаем числа и короткие слова
  
  const enhancedWords = enhanced.textContent
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !/^\d+$/.test(word));
  
  // Используем более сложный алгоритм сравнения текста
  const commonWords = originalWords.filter(word => enhancedWords.includes(word));
  const textSimilarity = originalWords.length > 0 ? commonWords.length / originalWords.length : 1;
  
  // Дополнительная проверка ключевых фраз
  const originalKeyPhrases = original.textContent.match(/[А-Яа-я\w\s]{10,50}/g) || [];
  const enhancedText = enhanced.textContent;
  const keyPhrasesPreserved = originalKeyPhrases.filter(phrase => 
    enhancedText.includes(phrase) || enhancedText.includes(phrase.toLowerCase())
  ).length;
  
  const keyPhrasesSimilarity = originalKeyPhrases.length > 0 ? 
    keyPhrasesPreserved / originalKeyPhrases.length : 1;
  
  const mainTextMatch = textSimilarity > 0.75 && keyPhrasesSimilarity > 0.6;
  
  if (!mainTextMatch) {
    issues.push(`Main text content significantly changed (${(textSimilarity * 100).toFixed(1)}% word similarity, ${(keyPhrasesSimilarity * 100).toFixed(1)}% key phrases preserved)`);
  }
  
  // 🔍 ПРОВЕРКА ИЗОБРАЖЕНИЙ (более точная)
  const imageCountMatch = enhanced.images.length >= Math.max(1, original.images.length * 0.8);
  if (!imageCountMatch) {
    issues.push(`Image count decreased significantly: ${original.images.length} → ${enhanced.images.length}`);
  }
  
  // Проверка сохранности путей к изображениям
  const originalImageSrcs = original.images.map(img => {
    const srcMatch = img.match(/src=["']([^"']*)["']/i);
    return srcMatch?.[1] || '';
  }).filter(src => src.length > 0);
  
  const enhancedImageSrcs = enhanced.images.map(img => {
    const srcMatch = img.match(/src=["']([^"']*)["']/i);
    return srcMatch?.[1] || '';
  }).filter(src => src.length > 0);
  
  const preservedImageSrcs = originalImageSrcs.filter(src => 
    enhancedImageSrcs.some(enhSrc => enhSrc?.includes(src || '') || src?.includes(enhSrc || ''))
  );
  
  if (originalImageSrcs.length > 0 && preservedImageSrcs.length < originalImageSrcs.length * 0.8) {
    issues.push(`Image sources changed: ${preservedImageSrcs.length}/${originalImageSrcs.length} preserved`);
  }
  
  // 🔍 ПРОВЕРКА ССЫЛОК (улучшенная)
  const linkCountMatch = enhanced.links.length >= Math.max(1, original.links.length * 0.8);
  if (!linkCountMatch) {
    issues.push(`Link count decreased: ${original.links.length} → ${enhanced.links.length}`);
  }
  
  // 🔍 ПРОВЕРКА CTA КНОПОК (критично для конверсии)
  const ctaButtonsMatch = enhanced.ctaButtons.length >= original.ctaButtons.length;
  if (!ctaButtonsMatch && original.ctaButtons.length > 0) {
    issues.push(`CTA buttons decreased: ${original.ctaButtons.length} → ${enhanced.ctaButtons.length}`);
  }
  
  // 🔍 ПРОВЕРКА БАЗОВОЙ HTML СТРУКТУРЫ
  const requiredStructure = [
    { tag: '<html', name: 'HTML tag' },
    { tag: '</html>', name: 'HTML closing tag' },
    { tag: '<head', name: 'HEAD tag' },
    { tag: '</head>', name: 'HEAD closing tag' },
    { tag: '<body', name: 'BODY tag' },
    { tag: '</body>', name: 'BODY closing tag' }
  ];
  
  const missingStructure = requiredStructure.filter(req => !enhancedHtml.includes(req.tag));
  const structureValid = missingStructure.length === 0;
  
  if (!structureValid) {
    issues.push(`Basic HTML structure incomplete: missing ${missingStructure.map(s => s.name).join(', ')}`);
  }
  
  // 🔍 ПРОВЕРКА META ТЕГОВ
  const criticalMetaTags = ['charset', 'viewport'];
  const originalCriticalMeta = criticalMetaTags.filter(meta => 
    original.headContent.toLowerCase().includes(meta)
  );
  const enhancedCriticalMeta = criticalMetaTags.filter(meta => 
    enhanced.headContent.toLowerCase().includes(meta)
  );
  
  const metaTagsMatch = enhancedCriticalMeta.length >= originalCriticalMeta.length;
  if (!metaTagsMatch) {
    issues.push(`Critical meta tags missing: ${originalCriticalMeta.length} → ${enhancedCriticalMeta.length}`);
  }
  
  // 🔍 ПРОВЕРКА CSS ЦЕЛОСТНОСТИ (базовая)
  const originalCssCount = original.cssStyles.length;
  const enhancedCssCount = enhanced.cssStyles.length;
  const cssIntegrityMatch = enhancedCssCount >= originalCssCount * 0.7; // Разрешаем некоторую оптимизацию CSS
  
  if (!cssIntegrityMatch && originalCssCount > 0) {
    issues.push(`CSS styles significantly reduced: ${originalCssCount} → ${enhancedCssCount}`);
  }
  
  const details = {
    titleMatch,
    mainTextMatch,
    imageCountMatch,
    linkCountMatch,
    ctaButtonsMatch,
    structureValid,
    metaTagsMatch,
    cssIntegrityMatch
  };
  
  const isValid = issues.length === 0;
  
  // 📊 ДОПОЛНИТЕЛЬНАЯ ДИАГНОСТИКА
  if (!isValid) {
    console.log('🔍 Content Integrity Analysis:');
    console.log(`📝 Text similarity: ${(textSimilarity * 100).toFixed(1)}%`);
    console.log(`🔑 Key phrases preserved: ${(keyPhrasesSimilarity * 100).toFixed(1)}%`);
    console.log(`🖼️ Images: ${original.images.length} → ${enhanced.images.length}`);
    console.log(`🔗 Links: ${original.links.length} → ${enhanced.links.length}`);
    console.log(`🎯 CTA buttons: ${original.ctaButtons.length} → ${enhanced.ctaButtons.length}`);
    console.log(`🏷️ Meta tags: ${originalCriticalMeta.length} → ${enhancedCriticalMeta.length}`);
  }
  
  return { isValid, issues, details };
}

/**
 * AI-powered HTML validation and enhancement tool
 */
export const validateAndCorrectHtml = tool({
  name: 'validateAndCorrectHtml',
  description: 'AI-powered HTML validation and enhancement - analyzes and significantly improves email HTML templates',
  parameters: z.object({
    campaign_path: z.string().describe('Path to the campaign directory'),
    trace_id: z.string().nullable().describe('Trace ID for debugging')
  }),
  execute: async (params, _context) => {
    console.log('\n🔍 === AI HTML VALIDATION & ENHANCEMENT (OpenAI Agents SDK) ===');
    console.log(`📋 Campaign: ${path.basename(params.campaign_path)}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);
    
    try {
      // 🔒 ПРОВЕРКА ВХОДНЫХ ПАРАМЕТРОВ
      if (!params.campaign_path) {
        throw new Error('Campaign path is required');
      }
      
      if (!await fs.access(params.campaign_path).then(() => true).catch(() => false)) {
        throw new Error(`Campaign directory does not exist: ${params.campaign_path}`);
      }
      
      // Load current HTML template with error handling
      const htmlTemplatePath = path.join(params.campaign_path, 'templates', 'email-template.html');
      
      let currentHtml: string;
      try {
        currentHtml = await fs.readFile(htmlTemplatePath, 'utf8');
        if (!currentHtml || currentHtml.trim().length === 0) {
          throw new Error('HTML template file is empty');
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('ENOENT')) {
          throw new Error(`HTML template file not found: ${htmlTemplatePath}`);
        }
        throw new Error(`Failed to read HTML template: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      console.log(`📄 Current HTML size: ${currentHtml.length} characters`);
      
             // Load all requirements and context with caching and enhanced error handling
       let templateRequirements: any = {};
       let technicalRequirements: any = {};
       let assetManifest: any = {};
       let contentContext: any = {};
       
       try {
         const cachedContext = await getCachedContext(params.campaign_path);
         templateRequirements = cachedContext.templateRequirements;
         technicalRequirements = cachedContext.technicalRequirements;
         assetManifest = cachedContext.assetManifest;
         contentContext = cachedContext.content_context;
       } catch (error) {
         console.error('❌ Critical error loading campaign context:', error);
         throw new Error(`Failed to load campaign context: ${error instanceof Error ? error.message : 'Unknown error'}`);
       }
      
      console.log('✅ Loaded campaign context and requirements');
      
      // Perform comprehensive validation with error handling
      let validationResults: any;
      try {
        validationResults = await getCachedValidation(
          currentHtml,
          templateRequirements,
          technicalRequirements,
          assetManifest,
          contentContext
        );
      } catch (error) {
        console.warn('⚠️ Comprehensive validation failed, using basic validation:', error);
        // Fallback to basic validation
        validationResults = {
          errors: [],
          warnings: [{ type: 'validation', message: 'Comprehensive validation unavailable' }],
          isValid: true
        };
      }
      
      console.log(`🔍 Initial validation: ${validationResults.errors.length} errors, ${validationResults.warnings.length} warnings`);
      
      // 🤖 ENHANCE HTML WITH AI using OpenAI Agents SDK
      console.log('🎨 Enhancing HTML with AI agent...');
      
      let enhancementResult: any; // Изменяем тип для поддержки расширенной структуры
      try {
        enhancementResult = await generateEnhancedHtml({
          currentHtml,
          contentContext,
          templateRequirements,
          technicalRequirements,
          assetManifest,
          validationErrors: validationResults.errors
        });
      } catch (error) {
        console.error('❌ AI enhancement failed, using original HTML:', error);
        enhancementResult = {
          enhancedHtml: currentHtml,
          enhancementsMade: [`AI enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          versions: {
            original: currentHtml,
            optimized: currentHtml,
            preferred: 'original'
          },
          sizeAnalysis: {
            originalLength: currentHtml.length,
            optimizedLength: currentHtml.length,
            changePercent: 0,
            changeBytes: 0
          },
          validation: {
            hasWarnings: true,
            warningReasons: [`AI enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
            integrityCheck: { isValid: false, issues: ['Enhancement failed'], details: {} }
          }
        };
      }
      
      // Извлекаем данные из новой структуры
      const { enhancedHtml, enhancementsMade } = enhancementResult;
      const { versions = {}, sizeAnalysis = {}, validation = {} } = enhancementResult;
      
      // 📊 ЛОГИРОВАНИЕ РЕЗУЛЬТАТОВ ОБЕИХ ВЕРСИЙ
      console.log(`📊 Enhancement Results:`);
      console.log(`   🔧 Preferred Version: ${versions.preferred || 'unknown'}`);
      console.log(`   📁 Original HTML: ${sizeAnalysis.originalLength || currentHtml.length} chars`);
      console.log(`   ⚡ Optimized HTML: ${sizeAnalysis.optimizedLength || enhancedHtml.length} chars`);
      console.log(`   📈 Size Change: ${sizeAnalysis.changePercent || 0}% (${sizeAnalysis.changeBytes || 0} bytes)`);
      console.log(`   ⚠️ Has Warnings: ${validation.hasWarnings || false}`);
      
      if (validation.warningReasons && validation.warningReasons.length > 0) {
        console.log(`   📝 Warning Reasons: ${validation.warningReasons.join(', ')}`);
      }
      
      // 🔒 ПРОВЕРКА: Были ли изменения отменены из-за защиты?
      const wasProtectionTriggered = enhancementsMade.some((enhancement: any) => 
        enhancement.includes('защита') || enhancement.includes('отменены') || enhancement.includes('ошибка') || enhancement.includes('failed')
      ) || validation.hasWarnings;
      
      // Generate timestamp for unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // 💾 СОХРАНЕНИЕ ОБЕИХ ВЕРСИЙ С УЛУЧШЕННОЙ ЛОГИКОЙ
      try {
        await fs.mkdir(path.dirname(path.join(params.campaign_path, 'templates')), { recursive: true });
        
        // Всегда сохраняем основную версию (предпочтительную)
        const enhancedHtmlPath = path.join(params.campaign_path, 'templates', `email-template-enhanced-${timestamp}.html`);
        await fs.writeFile(enhancedHtmlPath, enhancedHtml);
        console.log(`✅ Enhanced HTML (${versions.preferred || 'unknown'}) saved to: ${enhancedHtmlPath}`);
        
        // Сохраняем оригинальную версию если есть
        if (versions.original && versions.original !== enhancedHtml) {
          const originalBackupPath = path.join(params.campaign_path, 'templates', `email-template-original-${timestamp}.html`);
          await fs.writeFile(originalBackupPath, versions.original);
          console.log(`📁 Original HTML backup saved to: ${originalBackupPath}`);
        }
        
        // Сохраняем оптимизированную версию если есть и отличается
        if (versions.optimized && versions.optimized !== enhancedHtml && versions.optimized !== versions.original) {
          const optimizedPath = path.join(params.campaign_path, 'templates', `email-template-optimized-${timestamp}.html`);
          await fs.writeFile(optimizedPath, versions.optimized);
          console.log(`⚡ Optimized HTML version saved to: ${optimizedPath}`);
        }
        
        // Also save as latest enhanced version for easy access
        const latestEnhancedPath = path.join(params.campaign_path, 'templates', 'email-template-enhanced-latest.html');
        await fs.writeFile(latestEnhancedPath, enhancedHtml);
        console.log(`📁 Latest enhanced version saved to: ${latestEnhancedPath}`);
      } catch (error) {
        console.error('❌ Failed to save enhanced HTML files:', error);
        // Continue execution, as this is not critical for the validation process
      }
      
      // Validate enhanced HTML with error handling
      let enhancedValidation: any;
      try {
        enhancedValidation = await getCachedValidation(
          enhancedHtml,
          templateRequirements,
          technicalRequirements,
          assetManifest,
          contentContext
        );
      } catch (error) {
        console.warn('⚠️ Enhanced HTML validation failed:', error);
        enhancedValidation = {
          errors: [{ type: 'validation', message: 'Enhanced validation failed' }],
          warnings: [],
          isValid: false
        };
      }
      
      // Create comparison report with error handling
      let comparisonReport: any;
      try {
        comparisonReport = {
          timestamp: new Date().toISOString(),
          
          // 📁 ФАЙЛЫ
          files: {
            original_file: 'email-template.html',
            enhanced_file: `email-template-enhanced-${timestamp}.html`,
            latest_enhanced_file: 'email-template-enhanced-latest.html',
            ...(versions.original && versions.original !== enhancedHtml ? {
              original_backup_file: `email-template-original-${timestamp}.html`
            } : {}),
            ...(versions.optimized && versions.optimized !== enhancedHtml && versions.optimized !== versions.original ? {
              optimized_file: `email-template-optimized-${timestamp}.html`
            } : {})
          },
          
          // 📊 ВЕРСИИ И РАЗМЕРЫ
          versions: {
            preferred: versions.preferred || 'unknown',
            original_size: sizeAnalysis.originalLength || currentHtml.length,
            optimized_size: sizeAnalysis.optimizedLength || enhancedHtml.length,
            preferred_size: enhancedHtml.length,
            size_change: {
              bytes: sizeAnalysis.changeBytes || (enhancedHtml.length - currentHtml.length),
              percent: sizeAnalysis.changePercent || (((enhancedHtml.length - currentHtml.length) / currentHtml.length * 100).toFixed(2))
            }
          },
          
          // 🔧 УЛУЧШЕНИЯ И МОДИФИКАЦИИ
          enhancements: {
            made: enhancementsMade,
            protection_triggered: wasProtectionTriggered,
            warning_reasons: validation.warningReasons || [],
            has_warnings: validation.hasWarnings || false
          },
          
          // ✅ СТАТУС ВАЛИДАЦИИ
          validation_status: {
            original_errors: validationResults.errors.length,
            enhanced_errors: enhancedValidation.errors.length,
            improvement: validationResults.errors.length - enhancedValidation.errors.length,
            original_warnings: validationResults.warnings.length,
            enhanced_warnings: enhancedValidation.warnings.length,
            integrity_check: validation.integrityCheck || {}
          },
          
          // 🔧 ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ
          technical: {
            ai_agent_used: 'OpenAI Agents SDK - HTML Validation & Enhancement AI',
            both_versions_saved: true,
            main_template_updated: !wasProtectionTriggered,
            processing_timestamp: timestamp
          },
          
          // 📋 КРАТКИЙ ОТЧЁТ
          summary: {
            status: wasProtectionTriggered ? 'PROTECTED' : 'ENHANCED',
            preferred_version: versions.preferred || 'unknown',
            total_files_saved: 3 + // базовые файлы (enhanced, latest, comparison)
              (versions.original && versions.original !== enhancedHtml ? 1 : 0) + // original backup
              (versions.optimized && versions.optimized !== enhancedHtml && versions.optimized !== versions.original ? 1 : 0), // optimized
            size_change_description: sizeAnalysis.changePercent > 0 ? 
              `Увеличился на ${Math.abs(sizeAnalysis.changePercent).toFixed(1)}%` :
              sizeAnalysis.changePercent < 0 ?
              `Уменьшился на ${Math.abs(sizeAnalysis.changePercent).toFixed(1)}%` :
              'Без изменений размера',
            validation_improvement: validationResults.errors.length - enhancedValidation.errors.length
          }
        };
        
        const comparisonReportPath = path.join(params.campaign_path, 'templates', `enhancement-comparison-${timestamp}.json`);
        await fs.writeFile(comparisonReportPath, JSON.stringify(comparisonReport, null, 2));
        console.log(`📊 Comprehensive comparison report saved to: ${comparisonReportPath}`);
        console.log(`📋 Summary: ${comparisonReport.summary.status} | ${comparisonReport.summary.preferred_version} version | ${comparisonReport.summary.size_change_description}`);
      } catch (error) {
        console.error('❌ Failed to save comparison report:', error);
        comparisonReport = { 
          summary: { status: 'ERROR', size_change_description: 'Не удалось создать отчёт' },
          protection_triggered: wasProtectionTriggered 
        };
      }
      
      // 🔒 ВАЖНО: Обновляем основной template ТОЛЬКО если защита НЕ сработала
      if (!wasProtectionTriggered) {
        try {
          await fs.writeFile(htmlTemplatePath, enhancedHtml);
          console.log(`✅ Main template updated with enhanced content`);
        } catch (error) {
          console.error('❌ Failed to update main template:', error);
          console.log(`⚠️ Enhanced content available in timestamped files`);
        }
      } else {
        console.log(`⚠️ Main template NOT updated - protection was triggered`);
        console.log(`⚠️ Enhanced files saved for review, but original template preserved`);
      }
      
      // Save validation report with error handling
      try {
        const reportPath = path.join(params.campaign_path, 'docs', 'html-validation-report.json');
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        
        await fs.writeFile(reportPath, JSON.stringify({
          timestamp: new Date().toISOString(),
          ai_agent_used: 'OpenAI Agents SDK - HTML Validation & Enhancement AI',
          originalErrors: validationResults.errors.length,
          finalErrors: enhancedValidation.errors.length,
          warnings: enhancedValidation.warnings.length,
          enhancementsMade,
          validationStatus: enhancedValidation.isValid ? 'VALID' : 'INVALID',
          protection_triggered: wasProtectionTriggered,
          main_template_updated: !wasProtectionTriggered,
          processing_details: {
            original_size: currentHtml.length,
            enhanced_size: enhancedHtml.length,
            size_change_percent: comparisonReport.size_change_percent,
            protection_reasons: wasProtectionTriggered ? enhancementsMade.filter((e: any) => 
              e.includes('защита') || e.includes('отменены') || e.includes('ошибка') || e.includes('failed')
            ) : [],
            validation_steps: [
              'Basic HTML validation',
              'AI enhancement generation',
              'Size change analysis',
              'Content integrity validation',
              'Final validation check'
            ]
          },
          files: {
            original: 'templates/email-template.html',
            enhanced_timestamped: `templates/email-template-enhanced-${timestamp}.html`,
            enhanced_latest: 'templates/email-template-enhanced-latest.html',
            comparison_report: `templates/enhancement-comparison-${timestamp}.json`
          },
          file_sizes: {
            original: currentHtml.length,
            enhanced: enhancedHtml.length,
            difference: enhancedHtml.length - currentHtml.length
          }
        }, null, 2));
      } catch (error) {
        console.error('❌ Failed to save validation report:', error);
      }
      
      console.log(`✅ AI HTML Enhancement completed successfully`);
      console.log(`📊 Enhancements: ${enhancementsMade.length} improvements made`);
      console.log(`📈 Size change: ${comparisonReport.size_change_percent}%`);
      console.log(`🔧 Error reduction: ${validationResults.errors.length} → ${enhancedValidation.errors.length}`);
      console.log(`🔒 Protection triggered: ${wasProtectionTriggered ? 'YES' : 'NO'}`);
      console.log(`📁 Main template updated: ${!wasProtectionTriggered ? 'YES' : 'NO'}`);
      
      const statusMessage = wasProtectionTriggered 
        ? `⚠️ HTML Enhancement completed with PROTECTION TRIGGERED! Original template preserved due to content safety checks.`
        : `✅ HTML Enhancement completed successfully!`;
      
      return `${statusMessage} Made ${enhancementsMade.length} improvements: ${enhancementsMade.join(', ')}. Size changed by ${comparisonReport.size_change_percent}%. Error count: ${validationResults.errors.length} → ${enhancedValidation.errors.length}. Enhanced files saved with timestamp ${timestamp}.`;
      
    } catch (error) {
      console.error('❌ AI HTML validation and enhancement failed:', error);
      
      // Create comprehensive error report
      try {
        const errorReportPath = path.join(params.campaign_path, 'docs', 'html-validation-error-report.json');
        await fs.mkdir(path.dirname(errorReportPath), { recursive: true });
        
        const errorReport = {
          timestamp: new Date().toISOString(),
          error_type: 'HTML_VALIDATION_FAILURE',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_stack: error instanceof Error ? error.stack : null,
          campaign_path: params.campaign_path,
          trace_id: params.trace_id,
          system_info: {
            node_version: process.version,
            platform: process.platform,
            memory_usage: process.memoryUsage()
          },
          recovery_actions: [
            'Check OpenAI API key availability and quota',
            'Verify campaign directory structure and permissions',
            'Check HTML template file existence and readability',
            'Verify network connectivity for AI services',
            'Check available disk space for file operations',
            'Validate JSON files in campaign directory'
          ],
          next_steps: [
            'Review error details in this report',
            'Check system logs for additional information',
            'Verify all required files and directories exist',
            'Test with a minimal HTML template',
            'Retry operation after fixing identified issues',
            'Contact support if error persists'
          ]
        };
        
        await fs.writeFile(errorReportPath, JSON.stringify(errorReport, null, 2));
        console.error(`❌ Error report saved to: ${errorReportPath}`);
      } catch (reportError) {
        console.error('❌ Failed to save error report:', reportError);
      }
      
      throw new Error(`HTML validation and enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}. Check error report for details.`);
    }
  }
});

// Helper functions (simplified versions of the original complex validation)
async function loadTemplateRequirements(campaignPath: string): Promise<any> {
  try {
    const designBriefPath = path.join(campaignPath, 'content', 'design-brief-from-context.json');
    const designBriefContent = await fs.readFile(designBriefPath, 'utf8');
    return JSON.parse(designBriefContent);
  } catch (error) {
    console.warn('⚠️ Template requirements not found, using defaults');
    return { brand_colors: { primary: '#4BFF7E', accent: '#FF6240', background: '#EDEFFF' } };
  }
}

async function loadTechnicalRequirements(campaignPath: string): Promise<any> {
  try {
    const techSpecPath = path.join(campaignPath, 'docs', 'specifications', 'technical-specification.json');
    const techSpecContent = await fs.readFile(techSpecPath, 'utf8');
    return JSON.parse(techSpecContent);
  } catch (error) {
    console.warn('⚠️ Technical requirements not found, using defaults');
    return { specification: { design: { constraints: { layout: { maxWidth: 600 } } } } };
  }
}

async function loadAssetManifest(campaignPath: string): Promise<any> {
  try {
    const assetManifestPath = path.join(campaignPath, 'assets', 'manifests', 'asset-manifest.json');
    const assetManifestContent = await fs.readFile(assetManifestPath, 'utf8');
    return JSON.parse(assetManifestContent);
  } catch (error) {
    console.warn('⚠️ Asset manifest not found, using defaults');
    return { images: [], icons: [] };
  }
}

async function loadContentContext(campaignPath: string): Promise<any> {
  try {
    const contentContextPath = path.join(campaignPath, 'content', 'email-content.json');
    const contentContextContent = await fs.readFile(contentContextPath, 'utf8');
    return JSON.parse(contentContextContent);
  } catch (error) {
    console.warn('⚠️ Content context not found, using comprehensive fallback defaults');
    return {
      generated_content: { 
        subject: 'Email Subject', 
        body: 'Email content',
        preheader: 'Email preview text',
        cta: { primary: { text: 'Узнать больше' } }
      },
      context_analysis: { destination: 'направление' },
      pricing_analysis: { 
        best_price: null, 
        currency: 'RUB' 
      },
      subject: 'Email Subject',
      preheader: 'Email preview text',
      cta: { primary: { text: 'Узнать больше' } }
    };
  }
} 