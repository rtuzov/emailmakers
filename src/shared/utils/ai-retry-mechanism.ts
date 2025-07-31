/**
 * Universal AI Self-Correction Retry Mechanism
 * NO FALLBACKS - only AI retry with error feedback
 * 
 * This utility provides retry logic for all AI specialists:
 * - Content Specialist
 * - Design Specialist 
 * - Quality Specialist
 * - Delivery Specialist
 * - Data Collection Specialist
 */

import { OpenAI } from 'openai';
import { ENV_CONFIG } from '../../config/env';

export interface AIRetryParams {
  specialist_name: string;
  task_description: string;
  original_prompt: string;
  ai_function: (params: any) => Promise<any>;
  function_params: any;
  validation_function?: (result: any) => void | undefined;
  max_attempts?: number;
  temperature?: number;
  max_tokens?: number;
}

export interface AIRetryResult<T> {
  success: boolean;
  result?: T;
  attempts_used: number;
  errors: string[];
  final_error?: string;
}

/**
 * Universal AI Self-Correction Retry with Error Feedback
 */
export async function aiSelfCorrectionRetry<T>(params: AIRetryParams): Promise<T> {
  const {
    specialist_name,
    task_description,
    original_prompt,
    ai_function,
    function_params,
    validation_function,
    max_attempts = 5
    // temperature and max_tokens are passed but not used in this function
    // as they are handled by the ai_function implementation
  } = params;

  let lastError = '';
  const errors: string[] = [];

  console.log(`🔄 Starting AI Self-Correction Retry for ${specialist_name}`);
  console.log(`🎯 Task: ${task_description}`);

  for (let attempt = 0; attempt < max_attempts; attempt++) {
    try {
      let result: T;

      if (attempt === 0) {
        console.log(`🎨 ${specialist_name} - Initial AI Attempt`);
        result = await ai_function(function_params);
      } else {
        console.log(`🔄 ${specialist_name} - Self-Correction Attempt ${attempt + 1}/${max_attempts}`);
        console.log(`🎯 Fixing error: ${lastError.substring(0, 100)}...`);

        // Create enhanced params with error feedback
        const enhancedParams = {
          ...function_params,
          error_feedback: lastError,
          retry_attempt: attempt + 1,
          specialist_name,
          task_description,
          original_prompt: original_prompt
        };

        result = await ai_function(enhancedParams);
      }

      // Validate result if validation function provided
      if (validation_function) {
        console.log(`🔍 ${specialist_name} - Validating generated result...`);
        validation_function(result);
      }

      console.log(`✅ ${specialist_name} - Success on attempt ${attempt + 1}`);
      return result;

    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      errors.push(`Attempt ${attempt + 1}: ${lastError}`);
      
      console.warn(`⚠️ ${specialist_name} - Attempt ${attempt + 1} failed: ${lastError}`);

      if (attempt === max_attempts - 1) {
        throw new Error(`${specialist_name} failed after ${max_attempts} attempts with self-correction. Errors: ${errors.join(' | ')}`);
      }

      console.log(`🔄 ${specialist_name} - Retrying with error feedback (attempt ${attempt + 2}/${max_attempts})...`);
    }
  }

  throw new Error(`${specialist_name} failed: Maximum retry attempts reached`);
}

/**
 * Enhanced AI prompt with error feedback for retry attempts
 */
export function buildRetryPrompt(params: {
  original_prompt: string;
  error_feedback: string;
  retry_attempt: number;
  max_attempts: number;
  specialist_name: string;
  task_description: string;
}): string {
  const { 
    original_prompt, 
    error_feedback, 
    retry_attempt, 
    max_attempts, 
    specialist_name,
    task_description 
  } = params;

  return `🚨 ${specialist_name.toUpperCase()} - ПОПЫТКА ${retry_attempt}/${max_attempts} - ИСПРАВЛЕНИЕ ОШИБКИ

ЗАДАЧА: ${task_description}

ПРЕДЫДУЩАЯ ОШИБКА: ${error_feedback}

КРИТИЧЕСКИЕ ТРЕБОВАНИЯ ДЛЯ ИСПРАВЛЕНИЯ:

${error_feedback.includes('JSON') || error_feedback.includes('parse') ? `
🔧 ОШИБКА JSON - ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
- Верни ТОЛЬКО валидный JSON без комментариев
- Убери все markdown блоки (\`\`\`json)
- Проверь все скобки и запятые
- Все строки в двойных кавычках
- Валидируй JSON перед ответом` : ''}

${error_feedback.includes('required') || error_feedback.includes('missing') ? `
🔧 ОШИБКА ОБЯЗАТЕЛЬНЫХ ПОЛЕЙ:
- Добавь ВСЕ обязательные поля
- Заполни все поля согласно требованиям
- НЕ оставляй поля пустыми или null
- Следуй точно указанной структуре` : ''}

${error_feedback.includes('format') || error_feedback.includes('invalid') ? `
🔧 ОШИБКА ФОРМАТА:
- Соблюдай ТОЧНО указанный формат
- Проверь типы данных (string, number, array)
- Используй правильные значения (HEX цвета #RRGGBB)
- Валидируй все форматы` : ''}

${error_feedback.includes('unique') || error_feedback.includes('уникал') ? `
🔧 ОШИБКА УНИКАЛЬНОСТИ:
- Создай ПРИНЦИПИАЛЬНО НОВОЕ решение
- Измени ВСЕ ключевые параметры
- Используй ДРУГОЙ подход
- Избегай повторений предыдущих вариантов` : ''}

${error_feedback.includes('validation') || error_feedback.includes('валидац') ? `
🔧 ОШИБКА ВАЛИДАЦИИ:
- Пройди ВСЕ проверки валидации
- Соблюдай ВСЕ ограничения
- Проверь логическую консистентность
- Убедись в корректности всех значений` : ''}

ИСПРАВЬ ОШИБКУ И СОЗДАЙ КОРРЕКТНЫЙ РЕЗУЛЬТАТ!

ОРИГИНАЛЬНЫЙ ЗАПРОС:
${original_prompt}

ВНИМАНИЕ: Это попытка ${retry_attempt} из ${max_attempts}. Если не исправишь ошибку, система упадет!`;
}

/**
 * Enhanced OpenAI call with error feedback support
 */
export async function enhancedOpenAICall(params: {
  prompt: string;
  error_feedback?: string | undefined;
  retry_attempt?: number | undefined;
  specialist_name?: string | undefined;
  task_description?: string | undefined;
  temperature?: number | undefined;
  max_tokens?: number | undefined;
  model?: string | undefined;
}): Promise<string> {
  const { 
    prompt, 
    error_feedback, 
    retry_attempt = 0, 
    specialist_name = 'AI Specialist',
    task_description = 'AI Task',
    temperature = 0.7, 
    max_tokens = 8000,
    model = 'gpt-4o-mini'
  } = params;

  const openai = new OpenAI({
    apiKey: ENV_CONFIG.OPENAI_API_KEY
  });

  // Build enhanced prompt with error feedback if this is a retry
  const finalPrompt = error_feedback && retry_attempt > 0 
    ? buildRetryPrompt({
        original_prompt: prompt,
        error_feedback,
        retry_attempt,
        max_attempts: 5,
        specialist_name,
        task_description
      })
    : prompt;

  console.log(`🤖 ${specialist_name} - Making OpenAI call (attempt ${retry_attempt + 1})`);

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `You are an expert ${specialist_name}. ${error_feedback ? 'Fix the error and generate correct result. Learn from your mistakes.' : 'Generate high-quality results according to specifications.'}`
      },
      {
        role: 'user',
        content: finalPrompt
      }
    ],
    temperature: error_feedback ? 0.8 : temperature, // Slightly higher creativity for corrections
    max_tokens
  });

  const aiResponse = response.choices[0]?.message?.content?.trim() || '';
  
  if (!aiResponse) {
    throw new Error(`${specialist_name}: OpenAI returned empty response`);
  }

  console.log(`📝 ${specialist_name} - OpenAI response received (${aiResponse.length} characters)`);
  return aiResponse;
}

/**
 * Common JSON parsing with retry support
 */
export function parseJSONWithRetry(jsonString: string, specialist_name: string): any {
  try {
    // Clean JSON response aggressively
    let cleanJson = jsonString.trim();
    
    // Remove ALL markdown code blocks - multiple patterns
    cleanJson = cleanJson.replace(/^```json\s*/gm, '').replace(/\s*```$/gm, '');
    cleanJson = cleanJson.replace(/^```\s*/gm, '').replace(/\s*```$/gm, '');
    
    // Remove any remaining backticks at start/end
    cleanJson = cleanJson.replace(/^`+/, '').replace(/`+$/, '');
    
    // Remove any text before first { and after last }
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    }
    
    // Final trim
    cleanJson = cleanJson.trim();
    
    const result = JSON.parse(cleanJson);
    console.log(`✅ ${specialist_name} - JSON parsed successfully`);
    return result;
    
  } catch (parseError) {
    const error = parseError instanceof Error ? parseError.message : 'Unknown JSON parse error';
    console.error(`❌ ${specialist_name} - JSON parsing debug info:`);
    console.error(`Original length: ${jsonString.length}`);
    console.error(`Cleaned length: ${jsonString.trim().replace(/^```json\s*/gm, '').replace(/\s*```$/gm, '').length}`);
    console.error(`First 200 chars: ${jsonString.substring(0, 200)}`);
    console.error(`Last 200 chars: ${jsonString.substring(Math.max(0, jsonString.length - 200))}`);
    
    throw new Error(`${specialist_name} JSON parsing failed: ${error}. Original input length: ${jsonString.length}. Use proper JSON format without markdown blocks.`);
  }
}

/**
 * Common validation patterns
 */
export const commonValidations = {
  required: (value: any, fieldName: string, specialist: string) => {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${specialist}: Required field '${fieldName}' is missing or empty`);
    }
  },

  hexColor: (color: string, fieldName: string, specialist: string) => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    if (!hexPattern.test(color)) {
      throw new Error(`${specialist}: Field '${fieldName}' must be valid HEX color (#RRGGBB). Received: ${color}`);
    }
  },

  nonEmpty: (value: any, fieldName: string, specialist: string) => {
    if (Array.isArray(value) && value.length === 0) {
      throw new Error(`${specialist}: Array field '${fieldName}' cannot be empty`);
    }
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      throw new Error(`${specialist}: Object field '${fieldName}' cannot be empty`);
    }
  },

  validUrl: (url: string, fieldName: string, specialist: string) => {
    try {
      new URL(url);
    } catch {
      throw new Error(`${specialist}: Field '${fieldName}' must be valid URL. Received: ${url}`);
    }
  }
}; 