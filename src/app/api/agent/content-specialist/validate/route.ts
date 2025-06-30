import { NextRequest, NextResponse } from 'next/server';
import { ContentSpecialistValidator } from '@/agent/validators/content-specialist-validator';

/**
 * 🔍 CONTENT SPECIALIST VALIDATION API
 * 
 * Валидирует выходные данные ContentSpecialistAgent
 * Возвращает детальный отчет о корректности структуры данных
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { output, originalInput, enableRetry = false } = body;

    if (!output) {
      return NextResponse.json(
        { 
          error: 'Output data is required for validation',
          valid: false,
          errors: ['No output data provided'],
          warnings: [],
          handoff_ready: false
        },
        { status: 400 }
      );
    }

    console.log('🔍 Validating content specialist output:', {
      hasOutput: !!output,
      outputType: typeof output,
      outputKeys: output ? Object.keys(output) : [],
      enableRetry,
      hasOriginalInput: !!originalInput
    });

    let validationResult;
    
    // Выполняем валидацию с повторными запросами если включено
    if (enableRetry && originalInput) {
      // Создаем mock retry callback для демонстрации
      const mockRetryCallback = async (prompt: string, attempt: number) => {
        console.log(`🔄 Mock retry attempt ${attempt} with prompt length: ${prompt.length}`);
        
        // В реальной реализации здесь был бы вызов к LLM
        // Для демонстрации возвращаем улучшенную версию исходного output
        const improvedOutput = {
          ...output,
          success: true,
          results: {
            ...output.results,
            content_data: output.results?.content_data || {
              complete_content: {
                subject: "Исправленная тема письма",
                preheader: "Исправленный preheader",
                body: "Исправленное содержимое письма с достаточной длиной для валидации",
                cta: "Исправленный CTA",
                language: "ru",
                tone: "friendly"
              }
            }
          },
          recommendations: {
            ...output.recommendations,
            next_agent: "design_specialist",
            next_actions: ["Apply content to templates", "Generate design"],
            handoff_data: {
              content_package: {
                content: {
                  subject: "Исправленная тема письма",
                  preheader: "Исправленный preheader", 
                  body: "Исправленное содержимое письма с достаточной длиной для валидации",
                  cta: "Исправленный CTA",
                  language: "ru",
                  tone: "friendly"
                }
              },
              design_requirements: {
                tone: "friendly",
                style: "modern",
                color_scheme: "warm",
                imagery_focus: "travel",
                layout_priority: "mobile_first"
              },
              brand_guidelines: {
                brand_voice: "friendly",
                visual_style: "modern",
                color_palette: ["#2B5CE6", "#FF6B6B"],
                typography: "readable"
              }
            }
          },
          analytics: {
            execution_time: 1000,
            operations_performed: 1,
            confidence_score: 85,
            agent_efficiency: 90
          }
        };
        
        return improvedOutput;
      };

      validationResult = await ContentSpecialistValidator.validateOutputWithRetry(
        output, 
        originalInput, 
        mockRetryCallback
      );
    } else {
      // Обычная валидация без повторных запросов
      validationResult = ContentSpecialistValidator.validateOutput(output);
    }
    
    // Создаем отчет
    const report = ContentSpecialistValidator.createValidationReport(validationResult);

    console.log('📊 Validation result:', {
      valid: validationResult.valid,
      errorsCount: validationResult.errors.length,
      warningsCount: validationResult.warnings.length,
      handoffReady: validationResult.handoff_ready,
      attempts: (validationResult as any).attempts || 1
    });

    // Если валидация прошла успешно, попробуем извлечь handoff данные
    let handoffData = null;
    if (validationResult.valid && validationResult.sanitized && validationResult.handoff_ready) {
      try {
        handoffData = ContentSpecialistValidator.extractHandoffData(validationResult.sanitized);
      } catch (error) {
        console.warn('Failed to extract handoff data:', error);
      }
    }

    return NextResponse.json({
      ...validationResult,
      report,
      handoff_data: handoffData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Validation API error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown validation error',
        valid: false,
        errors: ['Validation service failed'],
        warnings: [],
        handoff_ready: false,
        report: `❌ Validation service failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
} 