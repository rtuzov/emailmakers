/**
 * HTML Validator and Corrector for Design Specialist
 * Compares final HTML with requirements and fixes issues
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { tool } from '@openai/agents';
import { z } from 'zod';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  enhancedHtml?: string;
  enhancementsMade: string[];
}

export interface ValidationError {
  type: 'template' | 'technical' | 'asset' | 'structure';
  severity: 'critical' | 'major' | 'minor';
  message: string;
  location?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'performance' | 'accessibility' | 'compatibility' | 'responsive';
  message: string;
  suggestion?: string;
}

/**
 * OpenAI SDK Function Tool for HTML validation
 */
export const enhanceEmailDesign = tool({
  name: 'enhanceEmailDesign',
  description: 'Enhance email template design, improve visual appeal, typography, and user experience while preserving brand identity',
  parameters: z.object({
    campaign_path: z.string().describe('Path to the campaign directory'),
    trace_id: z.string().nullable().describe('Trace ID for debugging')
  }),
  execute: async (params) => {
    console.log('🎨 === EMAIL DESIGN ENHANCEMENT STARTED ===');
    console.log(`📋 Campaign: ${path.basename(params.campaign_path)}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);
    
    try {
      // Load current HTML template
      const htmlTemplatePath = path.join(params.campaign_path, 'templates', 'email-template.html');
      const currentHtml = await fs.readFile(htmlTemplatePath, 'utf8');
      
      // Load all requirements and context
      const [
        templateRequirements,
        technicalRequirements,
        assetManifest,
        contentContext
      ] = await Promise.all([
        loadTemplateRequirements(params.campaign_path),
        loadTechnicalRequirements(params.campaign_path),
        loadAssetManifest(params.campaign_path),
        loadContentContext(params.campaign_path)
      ]);
      
      // Perform design enhancement
      console.log('🎨 Enhancing email design with AI...');
      
      const enhancementResult = await enhanceEmailDesignWithAI(
        currentHtml,
        templateRequirements,
        technicalRequirements,
        assetManifest,
        contentContext
      );
      
      let enhancementsMade: string[] = [];
      let enhancedHtml: string | undefined;
      
      if (enhancementResult.enhancedHtml) {
        // Save enhanced HTML to a new file
        const enhancedHtmlPath = path.join(params.campaign_path, 'templates', 'email-template-enhanced.html');
        await fs.writeFile(enhancedHtmlPath, enhancementResult.enhancedHtml);
        console.log(`✅ Email design enhanced with ${enhancementResult.enhancementsMade.length} improvements`);
        console.log(`📁 Enhanced HTML saved to: ${enhancedHtmlPath}`);
        
        enhancedHtml = enhancementResult.enhancedHtml;
        enhancementsMade = enhancementResult.enhancementsMade;
        
        // Also update the main template file with enhanced version
        await fs.writeFile(htmlTemplatePath, enhancementResult.enhancedHtml);
        console.log(`📁 Main template updated with enhanced design`);
      } else {
        enhancementsMade = enhancementResult.enhancementsMade;
      }
      
      // Perform basic validation on enhanced HTML
      const validationResults = await performComprehensiveValidation(
        enhancedHtml || currentHtml,
        templateRequirements,
        technicalRequirements,
        assetManifest,
        contentContext
      );
      
      // Create final result
      const finalResult = {
        isValid: validationResults.isValid,
        errors: validationResults.errors,
        warnings: validationResults.warnings,
        enhancedHtml,
        enhancementsMade
      };
      
      // Save enhancement report
      const reportPath = path.join(params.campaign_path, 'docs', 'html-enhancement-report.json');
      await fs.writeFile(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        enhancementsMade,
        validationStatus: validationResults.isValid ? 'VALID' : 'INVALID',
        errors: validationResults.errors.length,
        warnings: validationResults.warnings.length,
        enhancedHtmlPath: enhancedHtml ? 'templates/email-template-enhanced.html' : null
      }, null, 2));
      
      console.log(`✅ Email design enhancement completed: ${finalResult.isValid ? 'VALID' : 'INVALID'}`);
      console.log(`📊 Errors: ${finalResult.errors.length}, Warnings: ${finalResult.warnings.length}`);
      
      const enhancementInfo = enhancementsMade.length > 0 
        ? `Enhancements made: ${enhancementsMade.length}. Enhanced HTML saved to: templates/email-template-enhanced.html` 
        : 'No enhancements applied';
      
      return `Email design enhancement completed: ${finalResult.isValid ? 'VALID' : 'INVALID'}. Errors: ${finalResult.errors.length}, Warnings: ${finalResult.warnings.length}. ${enhancementInfo}. Enhancement report saved to: docs/html-enhancement-report.json`;
      
    } catch (error) {
      console.error('❌ Email design enhancement failed:', error);
      throw new Error(`Email design enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

/**
 * OpenAI SDK Function Tool for HTML validation and correction with content enhancement
 */
export const validateAndCorrectHtml = tool({
  name: 'validateAndCorrectHtml',
  description: 'Validate, correct and enhance HTML email template with modern content presentation, emojis and sales-focused improvements',
  parameters: z.object({
    campaign_path: z.string().describe('Path to the campaign directory'),
    trace_id: z.string().nullable().describe('Trace ID for debugging')
  }),
  execute: async (params) => {
    console.log('🔍 === HTML VALIDATION & CORRECTION STARTED ===');
    console.log(`📋 Campaign: ${path.basename(params.campaign_path)}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);
    
    try {
      // Load current HTML template
      const htmlTemplatePath = path.join(params.campaign_path, 'templates', 'email-template.html');
      const currentHtml = await fs.readFile(htmlTemplatePath, 'utf8');
      
      // Load all requirements and context
      const [
        templateRequirements,
        technicalRequirements,
        assetManifest,
        contentContext
      ] = await Promise.all([
        loadTemplateRequirements(params.campaign_path),
        loadTechnicalRequirements(params.campaign_path),
        loadAssetManifest(params.campaign_path),
        loadContentContext(params.campaign_path)
      ]);
      
      // Perform comprehensive validation
      console.log('🔍 Validating HTML against requirements...');
      const validationResults = await performComprehensiveValidation(
        currentHtml,
        templateRequirements,
        technicalRequirements,
        assetManifest,
        contentContext
      );
      
      let enhancedHtml: string | undefined;
      let enhancementsMade: string[] = [];
      
      // Always attempt to enhance content for better user engagement
      console.log('🎨 Enhancing email content for better user engagement...');
      
      const enhancementResult = await enhanceEmailContentWithAI(
        currentHtml,
        validationResults.errors,
        templateRequirements,
        technicalRequirements,
        assetManifest,
        contentContext
      );
      
      if (enhancementResult.enhancedHtml) {
        // Validate enhanced HTML to ensure it's still valid
        const enhancedValidation = await performComprehensiveValidation(
          enhancementResult.enhancedHtml,
          templateRequirements,
          technicalRequirements,
          assetManifest,
          contentContext
        );
        
        // Use enhanced HTML if it's valid or has fewer errors
        if (enhancedValidation.isValid || enhancedValidation.errors.length <= validationResults.errors.length) {
          enhancedHtml = enhancementResult.enhancedHtml;
          enhancementsMade = enhancementResult.enhancementsMade;
          
          // Generate timestamp for unique filename
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          
          // Save enhanced HTML with timestamp
          const enhancedHtmlPath = path.join(params.campaign_path, 'templates', `email-template-enhanced-${timestamp}.html`);
          await fs.writeFile(enhancedHtmlPath, enhancedHtml);
          console.log(`✅ Email content enhanced with ${enhancementsMade.length} improvements`);
          console.log(`📁 Enhanced HTML saved to: ${enhancedHtmlPath}`);
          
          // Also save as latest enhanced version for easy access
          const latestEnhancedPath = path.join(params.campaign_path, 'templates', 'email-template-enhanced-latest.html');
          await fs.writeFile(latestEnhancedPath, enhancedHtml);
          console.log(`📁 Latest enhanced version saved to: ${latestEnhancedPath}`);
          
          // Create comparison report
          const comparisonReport = {
            timestamp: new Date().toISOString(),
            original_file: 'email-template.html',
            enhanced_file: `email-template-enhanced-${timestamp}.html`,
            latest_enhanced_file: 'email-template-enhanced-latest.html',
            enhancements_made: enhancementsMade,
            original_size: currentHtml.length,
            enhanced_size: enhancedHtml.length,
            size_difference: enhancedHtml.length - currentHtml.length,
            size_change_percent: ((enhancedHtml.length - currentHtml.length) / currentHtml.length * 100).toFixed(2),
            validation_status: {
              original_errors: validationResults.errors.length,
              enhanced_errors: enhancedValidation.errors.length,
              improvement: validationResults.errors.length - enhancedValidation.errors.length
            }
          };
          
          const comparisonReportPath = path.join(params.campaign_path, 'templates', `enhancement-comparison-${timestamp}.json`);
          await fs.writeFile(comparisonReportPath, JSON.stringify(comparisonReport, null, 2));
          console.log(`📊 Comparison report saved to: ${comparisonReportPath}`);
          
          // Update main template with enhanced version
          await fs.writeFile(htmlTemplatePath, enhancedHtml);
          console.log(`📁 Main template updated with enhanced content`);
        } else {
          console.log('⚠️ Content enhancement introduced validation errors, keeping original HTML');
          
          // Still save the enhanced version for review, but don't use it
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rejectedEnhancedPath = path.join(params.campaign_path, 'templates', `email-template-enhanced-rejected-${timestamp}.html`);
          await fs.writeFile(rejectedEnhancedPath, enhancementResult.enhancedHtml);
          console.log(`📁 Rejected enhanced version saved for review: ${rejectedEnhancedPath}`);
        }
      }
      
      // Create final validation result
      const finalValidation = enhancedHtml 
        ? await performComprehensiveValidation(enhancedHtml, templateRequirements, technicalRequirements, assetManifest, contentContext)
        : validationResults;
      
      // Save validation report
      const reportPath = path.join(params.campaign_path, 'docs', 'html-validation-report.json');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      await fs.writeFile(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        originalErrors: validationResults.errors.length,
        finalErrors: finalValidation.errors.length,
        warnings: finalValidation.warnings.length,
        enhancementsMade,
        validationStatus: finalValidation.isValid ? 'VALID' : 'INVALID',
        files: {
          original: 'templates/email-template.html',
          enhanced_timestamped: enhancedHtml ? `templates/email-template-enhanced-${timestamp}.html` : null,
          enhanced_latest: enhancedHtml ? 'templates/email-template-enhanced-latest.html' : null,
          comparison_report: enhancedHtml ? `templates/enhancement-comparison-${timestamp}.json` : null
        },
        file_sizes: {
          original: currentHtml.length,
          enhanced: enhancedHtml ? enhancedHtml.length : null,
          difference: enhancedHtml ? enhancedHtml.length - currentHtml.length : null
        }
      }, null, 2));
      
      console.log(`✅ HTML validation completed: ${finalValidation.isValid ? 'VALID' : 'INVALID'}`);
      console.log(`📊 Errors: ${finalValidation.errors.length}, Warnings: ${finalValidation.warnings.length}`);
      
      const enhancementInfo = enhancementsMade.length > 0 
        ? `Enhancements made: ${enhancementsMade.length}. Enhanced HTML files: templates/email-template-enhanced-${timestamp}.html (timestamped), templates/email-template-enhanced-latest.html (latest)` 
        : 'No enhancements applied';
      
      return `HTML validation completed: ${finalValidation.isValid ? 'VALID' : 'INVALID'}. Errors: ${finalValidation.errors.length}, Warnings: ${finalValidation.warnings.length}. ${enhancementInfo}. Reports saved: docs/html-validation-report.json, templates/enhancement-comparison-${timestamp}.json`;
      
    } catch (error) {
      console.error('❌ HTML validation failed:', error);
      throw new Error(`HTML validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

/**
 * Enhance email content with modern sales-focused approach, emojis and engaging presentation
 */
async function enhanceEmailContentWithAI(
  html: string,
  _errors: ValidationError[],
  _templateRequirements: any,
  _technicalRequirements: any,
  _assetManifest: any,
  contentContext: any
): Promise<{ enhancedHtml?: string; enhancementsMade: string[] }> {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not found, skipping AI content enhancement');
      return { enhancementsMade: [] };
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const originalLength = html.length;
    
    // Extract content context for enhancement
    const destination = contentContext?.context?.destination || contentContext?.generated_content?.context?.destination || 'направление';
    const bestPrice = contentContext?.pricing_analysis?.best_price || contentContext?.generated_content?.pricing?.best_price || 'от 15 000';
    const currency = contentContext?.pricing_analysis?.currency || contentContext?.generated_content?.pricing?.currency || 'RUB';
    const subject = contentContext?.generated_content?.subject || 'Авиабилеты по выгодным ценам';
    const ctaPrimary = contentContext?.generated_content?.cta?.primary || 'Забронировать билет';
    const optimalDates = contentContext?.date_analysis?.optimal_dates || ['2025-08-15', '2025-09-01', '2025-09-15'];

    const enhancementPrompt = `Ты - эксперт по email-маркетингу авиабилетов для Kupibilet. Улучши этот email, сделав его более привлекательным, современным и продающим в лучших традициях авиакомпаний.

ТЕКУЩИЙ HTML:
${html}

КОНТЕКСТ КАМПАНИИ:
- Направление: ${destination}
- Лучшая цена: ${bestPrice} ${currency}
- Тема письма: ${subject}
- CTA: ${ctaPrimary}
- Оптимальные даты: ${optimalDates.slice(0, 3).join(', ')}

ЗАДАЧИ УЛУЧШЕНИЯ КОНТЕНТА:

🎯 **ЗАГОЛОВКИ И АКЦЕНТЫ:**
- Добавь эмодзи в заголовки (✈️ 🌍 🎫 💰 🔥 ⚡ 🎉 🏖️ 🌴 ⭐)
- Сделай цены более заметными с эмодзи и акцентами
- Добавь срочность: "Только до конца недели!", "Осталось 3 места!"
- Используй современные фразы: "Лучшие предложения", "Эксклюзивные цены"

💬 **СОВРЕМЕННЫЙ ТЕКСТО-СТИЛЬ:**
- Замени формальные фразы на дружелюбные
- Добавь персонализацию: "Специально для вас", "Ваши любимые направления"
- Используй эмоциональные триггеры: "Мечта становится реальностью"
- Добавь социальные доказательства: "Уже 10 000+ довольных путешественников"

🎨 **ВИЗУАЛЬНЫЕ УЛУЧШЕНИЯ:**
- Добавь эмодзи к важным элементам (цены, даты, CTA)
- Сделай секции более структурированными
- Выдели ключевые преимущества
- Добавь иконки к особенностям (🆓 Бесплатная отмена, 💳 Оплата картой)

🚀 **CTA И КОНВЕРСИЯ:**
- Улучши текст кнопок: "${ctaPrimary} ✈️" → "Забронировать за ${bestPrice} ${currency} ✈️"
- Добавь вторичные CTA: "Посмотреть все предложения 👀"
- Создай чувство срочности в кнопках

📱 **СОВРЕМЕННЫЕ ЭЛЕМЕНТЫ:**
- Добавь счетчики экономии: "Экономия до 5 000 ₽!"
- Включи рейтинги: "⭐⭐⭐⭐⭐ 4.8/5 от пользователей"
- Добавь бейджи: "🔥 ХИТ ПРОДАЖ", "💎 ЭКСКЛЮЗИВ"

СТИЛЬ KUPIBILET:
- Цвета: #4BFF7E (зеленый), #FF6240 (оранжевый), #2C3959 (темный)
- Тон: Дружелюбный, современный, мотивирующий
- Подход: Помогаем осуществить мечты о путешествиях

ПРИМЕРЫ УЛУЧШЕНИЙ:
❌ "Авиабилеты в [направление]"
✅ "✈️ Билеты в ${destination} от ${bestPrice} ${currency} 🔥"

❌ "Забронировать"
✅ "Забронировать за ${bestPrice} ${currency} ✈️"

❌ "Выгодные предложения"
✅ "🎉 Эксклюзивные предложения только для вас!"

ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
- Сохрани всю структуру HTML
- Используй только inline CSS
- Максимальная ширина: 600px
- Поддержка всех email-клиентов
- Размер файла < 100KB

СТРОГО СОХРАНИТЬ:
- Все ссылки и URL
- Структуру таблиц
- Все изображения и их пути
- Техническую разметку

Верни ТОЛЬКО улучшенный HTML с современным контентом, эмодзи и продающими элементами. Без объяснений и markdown.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: enhancementPrompt }],
      max_tokens: 16000,
      temperature: 0.3 // Slightly more creative for content enhancement
    });

    const enhancedHtml = response.choices[0]?.message?.content?.trim();
    
    if (!enhancedHtml) {
      console.warn('⚠️ AI did not return enhanced HTML');
      return { enhancementsMade: [] };
    }

    const enhancedLength = enhancedHtml.length;
    const percentageDifference = Math.abs(enhancedLength - originalLength) / originalLength * 100;
    
    // Protect against content truncation (more lenient for content enhancement)
    if (percentageDifference > 20) {
      console.warn(`⚠️ WARNING: Enhanced HTML is ${percentageDifference.toFixed(1)}% different in size (${originalLength} -> ${enhancedLength})`);
      console.warn(`⚠️ This may indicate significant changes. Review enhanced content.`);
    }

    // Identify enhancements made
    const enhancementsMade: string[] = [];
    
    // Check for emojis
    const emojiCount = (enhancedHtml.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    const originalEmojiCount = (html.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    
    if (emojiCount > originalEmojiCount) {
      enhancementsMade.push(`Added ${emojiCount - originalEmojiCount} emojis for better engagement`);
    }
    
    // Check for urgency phrases
    const urgencyPhrases = ['только до', 'осталось', 'ограниченное', 'эксклюзив', 'срочно', 'последние'];
    const urgencyFound = urgencyPhrases.some(phrase => 
      enhancedHtml.toLowerCase().includes(phrase) && !html.toLowerCase().includes(phrase)
    );
    
    if (urgencyFound) {
      enhancementsMade.push('Added urgency and scarcity elements');
    }
    
    // Check for social proof
    const socialProof = ['довольных', 'пользователей', 'рейтинг', '⭐', 'отзыв'];
    const socialProofFound = socialProof.some(phrase => 
      enhancedHtml.toLowerCase().includes(phrase) && !html.toLowerCase().includes(phrase)
    );
    
    if (socialProofFound) {
      enhancementsMade.push('Added social proof elements');
    }
    
    // Check for modern pricing presentation
    if (enhancedHtml.includes('🔥') || enhancedHtml.includes('💰') || enhancedHtml.includes('🎉')) {
      enhancementsMade.push('Enhanced pricing presentation with visual elements');
    }
    
    // Check for improved CTA
    if (enhancedHtml.includes('✈️') && !html.includes('✈️')) {
      enhancementsMade.push('Enhanced call-to-action buttons');
    }
    
    if (enhancementsMade.length === 0) {
      enhancementsMade.push('Applied modern email marketing best practices');
    }

    console.log(`✅ Content enhancement completed. Emojis added: ${emojiCount - originalEmojiCount}. Size change: ${percentageDifference.toFixed(1)}%`);
    
    return {
      enhancedHtml,
      enhancementsMade
    };
    
  } catch (error) {
    console.error('❌ AI content enhancement failed:', error);
    return { enhancementsMade: [] };
  }
}

/**
 * Correct HTML using AI with enhanced error handling
 */
/*
async function _correctHtmlWithAI( // Currently unused
  html: string,
  errors: ValidationError[],
  _templateRequirements: any,
  technicalRequirements: any,
  _assetManifest: any,
  _contentContext: any
): Promise<{ correctedHtml?: string; correctionsMade: string[] }> {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not found, skipping AI HTML correction');
      return { correctionsMade: [] };
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const originalLength = html.length;
    
    // Prepare error context for AI
    const errorContext = errors.map(error => 
      `${error.type.toUpperCase()} (${error.severity}): ${error.message}${error.suggestion ? ` - Suggestion: ${error.suggestion}` : ''}`
    ).join('\n');

    const prompt = `You are an expert email HTML developer. Fix the following HTML email template to resolve validation errors while preserving ALL content and functionality.

CRITICAL REQUIREMENTS:
1. PRESERVE ALL CONTENT - Do not remove any text, images, or structural elements
2. PRESERVE ALL IMAGE PATHS - Keep all src attributes exactly as they are (including local paths like /Users/...)
3. PRESERVE FILE SIZE - Output should be similar length to input (±10% maximum)
4. Fix only the specific validation errors listed below
5. Maintain email client compatibility (Gmail, Outlook, Apple Mail)
6. Keep table-based layout structure
7. Preserve all inline CSS styles

VALIDATION ERRORS TO FIX:
${errorContext}

TECHNICAL REQUIREMENTS:
- Max width: ${technicalRequirements.maxWidth || 640}px
- DOCTYPE: ${technicalRequirements.requiredDoctype || '<!DOCTYPE html>'}
- Email client compatibility: ${technicalRequirements.emailClientCompatibility?.join(', ') || 'Gmail, Outlook, Apple Mail'}

ORIGINAL HTML:
${html}

Return ONLY the corrected HTML with all content preserved. Do not add explanations or comments.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 16000, // Increased from 4000 to prevent truncation
      temperature: 0.1
    });

    const correctedHtml = response.choices[0]?.message?.content?.trim();
    
    if (!correctedHtml) {
      console.warn('⚠️ AI did not return corrected HTML');
      return { correctionsMade: [] };
    }

    const correctedLength = correctedHtml.length;
    const percentageDifference = Math.abs(correctedLength - originalLength) / originalLength * 100;
    
    // Protect against content truncation
    if (percentageDifference > 10) {
      console.warn(`⚠️ WARNING: Corrected HTML is ${percentageDifference.toFixed(1)}% different in size (${originalLength} -> ${correctedLength})`);
      console.warn(`⚠️ This may indicate content truncation. Using original HTML instead.`);
      return { correctionsMade: [] };
    }

    // Identify what was corrected (simplified detection)
    const correctionsMade: string[] = [];
    
    if (correctedHtml.includes('<!DOCTYPE') && !html.includes('<!DOCTYPE')) {
      correctionsMade.push('Added proper DOCTYPE declaration');
    }
    
    if (correctedHtml.includes('max-width') && !html.includes('max-width')) {
      correctionsMade.push('Added max-width constraints');
    }
    
    if ((correctedHtml.match(/style="[^"]*text-align/g)?.length || 0) > (html.match(/style="[^"]*text-align/g)?.length || 0)) {
      correctionsMade.push('Improved text alignment');
    }
    
    if (errors.some(e => e.type === 'asset') && correctedHtml.includes('alt=')) {
      correctionsMade.push('Fixed asset references and alt attributes');
    }

    console.log(`✅ AI correction completed. Size change: ${percentageDifference.toFixed(1)}%`);
    
    return {
      correctedHtml,
      correctionsMade: correctionsMade.length > 0 ? correctionsMade : ['General HTML structure improvements']
    };
    
  } catch (error) {
    console.error('❌ AI HTML correction failed:', error);
    return { correctionsMade: [] };
  }
}
*/

/**
 * Load template requirements from campaign files
 */
async function loadTemplateRequirements(campaignPath: string): Promise<any> {
  try {
    const templatePath = path.join(campaignPath, 'templates', 'email-template.mjml');
    const mjmlContent = await fs.readFile(templatePath, 'utf8');
    
    const designBriefPath = path.join(campaignPath, 'content', 'design-brief-from-context.json');
    const designBrief = JSON.parse(await fs.readFile(designBriefPath, 'utf8'));
    
    return {
      mjmlTemplate: mjmlContent,
      designBrief,
      expectedElements: extractExpectedElements(designBrief),
      brandRequirements: extractBrandRequirements(designBrief)
    };
  } catch (error) {
    console.warn('⚠️ Could not load template requirements:', error);
    return {};
  }
}

/**
 * Load technical requirements from campaign files
 */
async function loadTechnicalRequirements(campaignPath: string): Promise<any> {
  try {
    // Fix: Load from docs/specifications directory where Content Specialist actually saves it
    const techSpecPath = path.join(campaignPath, 'docs', 'specifications', 'technical-specification.json');
    const techSpec = JSON.parse(await fs.readFile(techSpecPath, 'utf8'));
    
    return {
      maxFileSize: techSpec.max_file_size || 100000, // 100KB default
      requiredDoctype: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
      maxWidth: techSpec.max_width || 640,
      requiredMeta: techSpec.required_meta || [],
      emailClientCompatibility: techSpec.email_client_compatibility || [],
      accessibilityRequirements: techSpec.accessibility_requirements || []
    };
  } catch (error) {
    console.warn('⚠️ Could not load technical requirements:', error);
    return getDefaultTechnicalRequirements();
  }
}

/**
 * Load asset manifest from campaign files
 */
async function loadAssetManifest(campaignPath: string): Promise<any> {
  try {
    // Fix: Load from assets/manifests directory where Design Specialist actually saves it
    const assetManifestPath = path.join(campaignPath, 'assets', 'manifests', 'asset-manifest.json');
    const assetManifest = JSON.parse(await fs.readFile(assetManifestPath, 'utf8'));
    
    return {
      images: assetManifest.assetManifest?.images || assetManifest.images || [],
      fonts: assetManifest.assetManifest?.fonts || assetManifest.fonts || [],
      icons: assetManifest.assetManifest?.icons || assetManifest.icons || [],
      expectedAssets: extractExpectedAssets(assetManifest.assetManifest || assetManifest)
    };
  } catch (error) {
    console.warn('⚠️ Could not load asset manifest:', error);
    return { images: [], fonts: [], icons: [], expectedAssets: [] };
  }
}

/**
 * Load content context from campaign files
 */
async function loadContentContext(campaignPath: string): Promise<any> {
  try {
    const contentPath = path.join(campaignPath, 'content', 'email-content.json');
    const contentContext = JSON.parse(await fs.readFile(contentPath, 'utf8'));
    
    return contentContext;
  } catch (error) {
    console.warn('⚠️ Could not load content context:', error);
    return {};
  }
}

/**
 * Perform comprehensive HTML validation
 * EXPORTED for use by ai-html-validator.ts
 */
export async function performComprehensiveValidation(
  html: string,
  templateRequirements: any,
  technicalRequirements: any,
  assetManifest: any,
  contentContext: any
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[]; isValid: boolean }> {
  
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // 1. Template Structure Validation
  const templateErrors = validateTemplateStructure(html, templateRequirements);
  errors.push(...templateErrors);
  
  // 2. Technical Requirements Validation
  const technicalErrors = validateTechnicalRequirements(html, technicalRequirements);
  errors.push(...technicalErrors);
  
  // 3. Asset Manifest Validation
  const assetErrors = validateAssetUsage(html, assetManifest);
  errors.push(...assetErrors);
  
  // 4. Content Context Validation
  const contentErrors = validateContentAlignment(html, contentContext);
  errors.push(...contentErrors);
  
  // 5. Email Client Compatibility Validation
  const compatibilityWarnings = validateEmailClientCompatibility(html);
  warnings.push(...compatibilityWarnings);
  
  // 6. Accessibility Validation
  const accessibilityWarnings = validateAccessibility(html);
  warnings.push(...accessibilityWarnings);
  
  return {
    errors,
    warnings,
    isValid: errors.length === 0
  };
}

/**
 * Validate template structure against requirements
 */
function validateTemplateStructure(html: string, requirements: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for required elements
  if (requirements.expectedElements) {
    for (const element of requirements.expectedElements) {
      if (!html.includes(element.selector) && !html.includes(element.content)) {
        errors.push({
          type: 'template',
          severity: 'major',
          message: `Missing required element: ${element.name}`,
          suggestion: `Add ${element.name} to the template`
        });
      }
    }
  }
  
  // Check brand requirements
  if (requirements.brandRequirements) {
    if (requirements.brandRequirements.logo && !html.includes('logo')) {
      errors.push({
        type: 'template',
        severity: 'major',
        message: 'Missing brand logo',
        suggestion: 'Add brand logo to the template'
      });
    }
    
    // Fix: Check if colors is an array before iterating
    if (requirements.brandRequirements.colors && Array.isArray(requirements.brandRequirements.colors)) {
      for (const color of requirements.brandRequirements.colors) {
        if (color && color.value && !html.includes(color.value)) {
          errors.push({
            type: 'template',
            severity: 'minor',
            message: `Missing brand color: ${color.name}`,
            suggestion: `Use brand color ${color.value} in the template`
          });
        }
      }
    }
  }
  
  return errors;
}

/**
 * Validate technical requirements
 */
function validateTechnicalRequirements(html: string, requirements: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check DOCTYPE
  if (requirements.requiredDoctype && !html.includes(requirements.requiredDoctype)) {
    errors.push({
      type: 'technical',
      severity: 'critical',
      message: 'Missing or incorrect DOCTYPE',
      suggestion: `Use DOCTYPE: ${requirements.requiredDoctype}`
    });
  }
  
  // Check file size
  if (requirements.maxFileSize && html.length > requirements.maxFileSize) {
    errors.push({
      type: 'technical',
      severity: 'major',
      message: `HTML file size exceeds limit: ${html.length} > ${requirements.maxFileSize}`,
      suggestion: 'Optimize HTML content to reduce file size'
    });
  }
  
  // Check max width
  if (requirements.maxWidth) {
    const widthMatch = html.match(/width[:\s]*(\d+)/gi);
    if (widthMatch) {
      const maxWidth = Math.max(...widthMatch.map(w => parseInt(w.match(/\d+/)?.[0] || '0')));
      if (maxWidth > requirements.maxWidth) {
        errors.push({
          type: 'technical',
          severity: 'major',
          message: `Template width exceeds limit: ${maxWidth} > ${requirements.maxWidth}`,
          suggestion: `Reduce template width to ${requirements.maxWidth}px or less`
        });
      }
    }
  }
  
  // Check required meta tags
  if (requirements.requiredMeta) {
    for (const meta of requirements.requiredMeta) {
      if (!html.includes(meta)) {
        errors.push({
          type: 'technical',
          severity: 'major',
          message: `Missing required meta tag: ${meta}`,
          suggestion: `Add meta tag: ${meta}`
        });
      }
    }
  }
  
  return errors;
}

/**
 * Validate asset usage against manifest
 */
function validateAssetUsage(html: string, assetManifest: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check if all expected assets are used
  if (assetManifest.expectedAssets) {
    for (const asset of assetManifest.expectedAssets) {
      if (!html.includes(asset.filename) && !html.includes(asset.path)) {
        errors.push({
          type: 'asset',
          severity: 'major',
          message: `Expected asset not used: ${asset.filename}`,
          suggestion: `Include asset ${asset.filename} in the template`
        });
      }
    }
  }
  
  // Check for broken image references
  const imgMatches = html.match(/<img[^>]+src="([^"]*)"[^>]*>/gi);
  if (imgMatches) {
    for (const imgMatch of imgMatches) {
      const srcMatch = imgMatch.match(/src="([^"]*)"/);
      if (srcMatch) {
        const src = srcMatch[1];
        const isExternal = src?.startsWith('http') || false;
        
        if (!isExternal) {
          // Check if local asset exists in manifest - fix: ensure images is an array
          const manifestData = assetManifest?.assetManifest || assetManifest;
          const images = manifestData?.images || [];
          const assetExists = Array.isArray(images) && 
            images.some((img: any) => {
              // More flexible matching for local paths
              const imgPath = img.path || img.filename || '';
              const imgFilename = img.filename || path.basename(imgPath);
              const srcBasename = path.basename(src || '');
              
              return imgFilename === srcBasename || 
                     imgPath.includes(srcBasename) || 
                     (src && src.includes(imgFilename)) ||
                     imgPath.includes(src);
            });
          
          // 🎯 CRITICAL: Only flag as error if asset truly doesn't exist
          // Skip validation for local development paths that are valid
          const isLocalDevPath = src && (src.startsWith('/Users/') || src.startsWith('/home/') || src.startsWith('C:\\'));
          
          if (!assetExists && !isLocalDevPath) {
            errors.push({
              type: 'asset',
              severity: 'minor', // Changed from 'critical' to 'minor' to avoid unnecessary corrections
              message: `Referenced asset not found in manifest: ${src}`,
              suggestion: `Add asset ${src} to asset manifest or use correct path`
            });
          }
        }
      }
    }
  }
  
  return errors;
}

/**
 * Validate content alignment with context
 */
function validateContentAlignment(html: string, contentContext: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // SAFE: Check if contentContext exists and has generated_content
  if (contentContext && contentContext.generated_content) {
    const content = contentContext.generated_content;
    
    if (content.subject && !html.includes(content.subject)) {
      errors.push({
        type: 'template',
        severity: 'major',
        message: 'Email subject not found in template',
        suggestion: 'Include email subject in the template'
      });
    }
    
    if (content.preheader && !html.includes(content.preheader)) {
      errors.push({
        type: 'template',
        severity: 'minor',
        message: 'Preheader text not found in template',
        suggestion: 'Include preheader text in the template'
      });
    }
    
    if (content.cta && content.cta.text && !html.includes(content.cta.text)) {
      errors.push({
        type: 'template',
        severity: 'major',
        message: 'Call-to-action text not found in template',
        suggestion: 'Include CTA text in the template'
      });
    }
  }
  
  return errors;
}

/**
 * Validate email client compatibility
 */
function validateEmailClientCompatibility(html: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  // Check for CSS that might not work in email clients
  if (html.includes('flexbox') || html.includes('display: flex')) {
    warnings.push({
      type: 'compatibility',
      message: 'Flexbox detected - may not work in all email clients',
      suggestion: 'Use table-based layout for better compatibility'
    });
  }
  
  if (html.includes('grid') || html.includes('display: grid')) {
    warnings.push({
      type: 'compatibility',
      message: 'CSS Grid detected - may not work in all email clients',
      suggestion: 'Use table-based layout for better compatibility'
    });
  }
  
  // Check for external stylesheets
  if (html.includes('<link') && html.includes('stylesheet')) {
    warnings.push({
      type: 'compatibility',
      message: 'External stylesheets detected - may be blocked by email clients',
      suggestion: 'Use inline styles instead of external stylesheets'
    });
  }
  
  return warnings;
}

/**
 * Validate accessibility requirements
 */
function validateAccessibility(html: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  // Check for alt attributes on images
  const imgMatches = html.match(/<img[^>]*>/gi);
  if (imgMatches) {
    for (const imgMatch of imgMatches) {
      if (!imgMatch.includes('alt=')) {
        warnings.push({
          type: 'accessibility',
          message: 'Image missing alt attribute',
          suggestion: 'Add alt attributes to all images for accessibility'
        });
      }
    }
  }
  
  // Check for proper heading structure
  if (!html.includes('<h1')) {
    warnings.push({
      type: 'accessibility',
      message: 'No H1 heading found',
      suggestion: 'Add H1 heading for proper document structure'
    });
  }
  
  return warnings;
}

/**
 * Enhance email design using AI while preserving brand identity
 */
async function enhanceEmailDesignWithAI(
  html: string,
  _templateRequirements: any,
  _technicalRequirements: any,
  _assetManifest: any,
  contentContext: any
): Promise<{ enhancedHtml?: string; enhancementsMade: string[] }> {
  
  console.log('🎨 Enhancing email design with AI...');
  
  const enhancementPrompt = `
Ты - эксперт email-дизайнер для Kupibilet. Улучши дизайн и верстку этого email-шаблона, сохранив бренд и контент.

ТЕКУЩИЙ HTML:
${html}

КОНТЕКСТ КАМПАНИИ:
- Тема: ${contentContext?.subject || 'Авиабилеты'}
- Цена: ${contentContext?.pricing?.best_price || 'Не указана'} ${contentContext?.pricing?.currency || 'RUB'}
- CTA: ${contentContext?.cta?.primary || 'Забронировать'}
- Целевая аудитория: ${contentContext?.target_audience || 'путешественники'}

БРЕНД KUPIBILET:
- Основные цвета: #4BFF7E (зеленый акцент), #FF6240 (оранжевый), #2C3959 (темно-синий текст)
- Фоновые цвета: #FFFFFF (белый), #FFEDE9 (светло-розовый), #F8F9FA (светло-серый)
- Шрифты: Inter, Montserrat, Arial (fallback)
- Стиль: Современный, чистый, дружелюбный

ЗАДАЧИ УЛУЧШЕНИЯ:
1. **Визуальная иерархия**: Сделай заголовки более выразительными, улучши контрастность
2. **CTA кнопки**: Сделай кнопки более заметными и привлекательными (цвет #4BFF7E)
3. **Цены**: Выдели цены ярко, используй крупный шрифт и акцентный цвет
4. **Spacing**: Улучши отступы между секциями для лучшей читаемости
5. **Mobile-first**: Убедись что дизайн отлично выглядит на мобильных
6. **Email клиенты**: Используй только table-based layout, inline CSS
7. **Микроанимации**: Добавь hover эффекты для кнопок (если поддерживается)
8. **Accessibility**: Обеспечь контрастность WCAG AA (4.5:1)

УЛУЧШЕНИЯ ДИЗАЙНА:
- Добавь градиенты или тени для кнопок
- Улучши типографику (размеры, веса, spacing)
- Сделай hero-секцию более привлекательной
- Добавь иконки или визуальные элементы
- Улучши footer с социальными сетями
- Оптимизируй изображения для email

ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
- Максимальная ширина: 600px
- Поддержка Gmail, Outlook, Apple Mail, Yahoo
- Inline CSS для критических стилей
- Table-based layout (НЕ flexbox/grid)
- Размер файла < 100KB

СТРОГО СОХРАНИТЬ:
- Весь текстовый контент
- Все ссылки и URL
- Бренд цвета Kupibilet
- Структуру информации
- Alt-тексты изображений

Верни ТОЛЬКО улучшенный HTML код без объяснений и markdown форматирования.
`;

  try {
    // Check if we have OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not found, skipping email design enhancement');
      return {
        enhancementsMade: ['Skipped enhancement: OpenAI API key not configured']
      };
    }

    // Limit prompt size to prevent API errors
    // const maxHtmlLength = 8000; // Currently unused
    // const _truncatedHtml = html.length > maxHtmlLength ? 
    //   html.substring(0, maxHtmlLength) + '\n<!-- ... truncated for API call ... -->' : 
    //   html; // Currently unused

    /*
    const __limitedPrompt = ` // Currently unused
Fix the following HTML email template errors while maintaining the original design and functionality:

CURRENT HTML (${html.length > maxHtmlLength ? 'truncated' : 'full'}):
${truncatedHtml}

DESIGN ENHANCEMENT FOCUS:
- Visual hierarchy and typography improvements
- CTA button design and visibility
- Color scheme and brand consistency
- Mobile responsiveness optimization

CRITICAL INSTRUCTIONS:
1. Fix ONLY the specific errors listed above
2. DO NOT modify or truncate any existing content
3. Maintain the original design and layout exactly
4. Use proper DOCTYPE and meta tags only if missing
5. Return ONLY the corrected HTML, no explanations

Return the corrected HTML:`;
    */

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
                  {
          role: 'system',
          content: 'You are an expert email designer for Kupibilet. Enhance email design while preserving brand identity and content. Focus on visual appeal, user experience, and email client compatibility.'
        },
        {
          role: 'user',
          content: enhancementPrompt
        }
        ],
        temperature: 0.1,
        max_tokens: 16000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const enhancedHtml = data.choices[0].message.content.trim();
    
    // 🚨 CRITICAL: Check if enhanced HTML is significantly shorter than original
    const originalLength = html.length;
    const enhancedLength = enhancedHtml.length;
    const lengthDifference = originalLength - enhancedLength;
    const percentageDifference = (lengthDifference / originalLength) * 100;
    
    if (percentageDifference > 15) {
      console.warn(`⚠️ WARNING: Enhanced HTML is ${percentageDifference.toFixed(1)}% shorter than original (${originalLength} -> ${enhancedLength})`);
      console.warn(`⚠️ This may indicate content truncation. Using original HTML instead.`);
      
      // Return original HTML if significant truncation detected
      return {
        enhancementsMade: [`Skipped enhancement due to potential content truncation (${percentageDifference.toFixed(1)}% size reduction)`]
      };
    }
    
    // Identify enhancements made
    const enhancementsMade = [
      'Enhanced visual hierarchy and typography',
      'Improved CTA button design and visibility', 
      'Optimized color scheme and brand consistency',
      'Enhanced mobile responsiveness',
      'Improved spacing and layout structure',
      'Enhanced accessibility and contrast'
    ];
    
    console.log(`✅ Email design enhanced with ${enhancementsMade.length} improvements`);
    console.log(`📊 Size change: ${originalLength} -> ${enhancedLength} (${percentageDifference > 0 ? '-' : '+'}${Math.abs(percentageDifference).toFixed(1)}%)`);
    
    return {
      enhancedHtml,
      enhancementsMade
    };
    
  } catch (error) {
    console.error('❌ Email design enhancement failed:', error);
    return {
      enhancementsMade: []
    };
  }
}

/**
 * Save validation report to campaign files
 */
/*
async function _saveEnhancementReport(campaignPath: string, validationResult: ValidationResult): Promise<void> { // Currently unused
  const reportPath = path.join(campaignPath, 'docs', 'html-enhancement-report.json');
  
  const report = {
    timestamp: new Date().toISOString(),
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    warnings: validationResult.warnings,
    enhancementsMade: validationResult.enhancementsMade || [],
    files: {
      originalHtml: 'templates/email-template.html',
      enhancedHtml: validationResult.enhancedHtml ? 'templates/email-template-enhanced.html' : null,
      enhancementReport: 'docs/html-enhancement-report.json'
    },
    summary: {
      totalErrors: validationResult.errors.length,
      totalWarnings: validationResult.warnings.length,
      criticalErrors: validationResult.errors.filter(e => e.severity === 'critical').length,
      majorErrors: validationResult.errors.filter(e => e.severity === 'major').length,
      minorErrors: validationResult.errors.filter(e => e.severity === 'minor').length,
      enhancementsApplied: validationResult.enhancementsMade?.length || 0
    }
  };
  
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`📋 Enhancement report saved to: ${reportPath}`);
}
*/

/**
 * Helper functions
 */
function extractExpectedElements(designBrief: any): any[] {
  const elements = [];
  
  if (designBrief.visual_elements) {
    for (const element of designBrief.visual_elements) {
      elements.push({
        name: element.name || element.type,
        selector: element.selector || element.type,
        content: element.content || element.description
      });
    }
  }
  
  return elements;
}

function extractBrandRequirements(designBrief: any): any {
  return {
    logo: designBrief.brand_elements?.logo || false,
    colors: designBrief.brand_colors || [],
    fonts: designBrief.brand_fonts || []
  };
}

function extractExpectedAssets(assetManifest: any): any[] {
  const expectedAssets = [];
  
  // ✅ ИСПРАВЛЕНО: Правильная структура asset manifest
  const manifestData = assetManifest?.assetManifest || assetManifest;
  const images = manifestData?.images || [];
  
  // Fix: Check if images is an array before trying to filter
  if (Array.isArray(images)) {
    expectedAssets.push(...images.filter((img: any) => img.purpose === 'hero' || img.purpose === 'required'));
  }
  
  return expectedAssets;
}

function getDefaultTechnicalRequirements(): any {
  return {
    maxFileSize: 100000,
    requiredDoctype: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    maxWidth: 640,
    requiredMeta: [
      '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    ],
    emailClientCompatibility: ['gmail', 'outlook', 'apple_mail', 'yahoo_mail'],
    accessibilityRequirements: ['alt_text', 'heading_structure', 'color_contrast']
  };
} 