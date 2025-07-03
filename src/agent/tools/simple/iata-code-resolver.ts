import { z } from 'zod';

export const iataCodeResolverSchema = z.object({
  city_names: z.array(z.string()).describe('Array of city names in any language to convert to IATA codes'),
  language: z.enum(['ru', 'en', 'auto']).default('auto').describe('Language of the input city names'),
  include_alternatives: z.boolean().default(false).describe('Include alternative airport codes for the same city'),
  validate_codes: z.boolean().default(true).describe('Validate that returned codes are real IATA codes')
});

export type IataCodeResolverParams = z.infer<typeof iataCodeResolverSchema>;

interface IataCodeResult {
  success: boolean;
  resolved_codes: Array<{
    input_city: string;
    iata_code: string;
    city_name_en: string;
    country: string;
    confidence: number;
    alternatives?: string[];
    validation_status: 'valid' | 'invalid' | 'unknown';
  }>;
  unresolved_cities: string[];
  analytics: {
    total_cities: number;
    resolved_count: number;
    success_rate: number;
    execution_time: number;
  };
  error?: string;
}

/**
 * IATA Code Resolver - Использует нейронку для получения IATA кодов городов
 * 
 * Этот инструмент использует AI для:
 * 1. Распознавания городов на любом языке
 * 2. Конвертации в стандартные IATA коды
 * 3. Валидации кодов
 * 4. Предоставления альтернатив
 */
export async function iataCodeResolver(params: IataCodeResolverParams): Promise<IataCodeResult> {
  const startTime = Date.now();
  
  console.log(`✈️ IATA Code Resolver: Processing ${params.city_names.length} cities`);
  
  try {
    // Создаем промпт для нейронки
    const prompt = buildIataResolutionPrompt(params);
    
    // Используем OpenAI для получения IATA кодов
    const aiResponse = await callOpenAIForIataCodes(prompt);
    
    // Парсим ответ нейронки
    const parsedResponse = parseAIResponse(aiResponse);
    
    // Валидируем коды если требуется
    const validatedCodes = params.validate_codes 
      ? await validateIataCodes(parsedResponse)
      : parsedResponse;
    
    // Подготавливаем результат
    const resolvedCodes = validatedCodes.filter(code => code.iata_code !== 'UNKNOWN');
    const unresolvedCities = params.city_names.filter(city => 
      !resolvedCodes.some(resolved => resolved.input_city.toLowerCase() === city.toLowerCase())
    );
    
    const result: IataCodeResult = {
      success: true,
      resolved_codes: resolvedCodes,
      unresolved_cities: unresolvedCities,
      analytics: {
        total_cities: params.city_names.length,
        resolved_count: resolvedCodes.length,
        success_rate: Math.round((resolvedCodes.length / params.city_names.length) * 100),
        execution_time: Date.now() - startTime
      }
    };
    
    console.log(`✅ IATA Resolution completed: ${resolvedCodes.length}/${params.city_names.length} cities resolved`);
    
    return result;
    
  } catch (error) {
    console.error('❌ IATA Code Resolver error:', error);
    
    return {
      success: false,
      resolved_codes: [],
      unresolved_cities: params.city_names,
      analytics: {
        total_cities: params.city_names.length,
        resolved_count: 0,
        success_rate: 0,
        execution_time: Date.now() - startTime
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Построение промпта для нейронки
 */
function buildIataResolutionPrompt(params: IataCodeResolverParams): string {
  const languageInstruction = params.language === 'ru' 
    ? 'Города указаны на русском языке.'
    : params.language === 'en' 
    ? 'Cities are provided in English.'
    : 'Cities may be in any language (auto-detect).';
    
  return `
Ты эксперт по авиации и IATA кодам аэропортов. Твоя задача - конвертировать названия городов в трёхбуквенные IATA коды аэропортов.

${languageInstruction}

Города для конвертации: ${params.city_names.join(', ')}

Требования:
1. Для каждого города найди основной аэропорт и его IATA код
2. Если у города несколько аэропортов, выбери главный (обычно самый крупный)
3. ${params.include_alternatives ? 'Включи альтернативные коды если есть' : 'Используй только главный код'}
4. Если город не найден или нет аэропорта, используй "UNKNOWN"
5. Укажи уверенность от 1 до 100

Формат ответа (строго JSON):
{
  "codes": [
    {
      "input_city": "название города как в запросе",
      "iata_code": "XXX",
      "city_name_en": "English name",
      "country": "Country name",
      "confidence": 95,
      ${params.include_alternatives ? '"alternatives": ["XXX", "YYY"],' : ''}
    }
  ]
}

Важно: Отвечай ТОЛЬКО JSON, без дополнительного текста.
`;
}

/**
 * Вызов OpenAI API для получения IATA кодов
 */
async function callOpenAIForIataCodes(prompt: string): Promise<string> {
  const { OpenAI } = await import('openai');
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an aviation expert specializing in IATA airport codes. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1, // Низкая температура для точности
    max_tokens: 2000
  });
  
  return response.choices[0]?.message?.content || '';
}

/**
 * Парсинг ответа нейронки
 */
function parseAIResponse(aiResponse: string): Array<{
  input_city: string;
  iata_code: string;
  city_name_en: string;
  country: string;
  confidence: number;
  alternatives?: string[];
  validation_status: 'unknown';
}> {
  try {
    // Очищаем ответ от возможного мусора
    const cleanResponse = aiResponse.trim();
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.codes || !Array.isArray(parsed.codes)) {
      throw new Error('Invalid response format: missing codes array');
    }
    
    return parsed.codes.map((code: any) => ({
      input_city: code.input_city || '',
      iata_code: code.iata_code || 'UNKNOWN',
      city_name_en: code.city_name_en || '',
      country: code.country || '',
      confidence: Math.min(100, Math.max(0, code.confidence || 0)),
      alternatives: code.alternatives || undefined,
      validation_status: 'unknown' as const
    }));
    
  } catch (error) {
    console.error('❌ Failed to parse AI response:', error);
    console.log('Raw AI response:', aiResponse);
    
    // Возвращаем пустой массив в случае ошибки парсинга
    return [];
  }
}

/**
 * Валидация IATA кодов
 */
async function validateIataCodes(codes: Array<{
  input_city: string;
  iata_code: string;
  city_name_en: string;
  country: string;
  confidence: number;
  alternatives?: string[];
  validation_status: string;
}>): Promise<Array<{
  input_city: string;
  iata_code: string;
  city_name_en: string;
  country: string;
  confidence: number;
  alternatives?: string[];
  validation_status: 'valid' | 'invalid' | 'unknown';
}>> {
  
  // Простая валидация формата IATA кода
  const iataRegex = /^[A-Z]{3}$/;
  
  return codes.map(code => ({
    ...code,
    validation_status: code.iata_code === 'UNKNOWN' 
      ? 'unknown' as const
      : iataRegex.test(code.iata_code) 
      ? 'valid' as const 
      : 'invalid' as const
  }));
} 