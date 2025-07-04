import { NextRequest, NextResponse } from 'next/server';
// import { processNewsRabbits } from '@/agent/tools/figma-news-rabbits-processor';

// Stub implementation
async function processNewsRabbits(params: any) {
  return { success: false, error: 'processNewsRabbits not implemented', data: { summary: { totalAssets: 0 }, processedAssets: [] } };
}
import { z } from 'zod';

// Схема валидации запроса
const ProcessNewsRabbitsSchema = z.object({
  figmaUrl: z.string().url('Неверный формат Figma URL'),
  outputDirectory: z.string().optional().nullable(),
  context: z.object({
    campaign_type: z.enum(['urgent', 'newsletter', 'seasonal', 'promotional', 'informational']).optional().nullable(),
    content_theme: z.string().optional().nullable(),
    target_audience: z.string().optional().nullable(),
    brand_guidelines: z.array(z.string()).optional().nullable(),
  }).optional().nullable(),
  options: z.object({
    includeVariants: z.boolean().default(true),
    generateReport: z.boolean().default(true),
    aiAnalysis: z.boolean().default(true),
    maxAssets: z.number().min(1).max(50).default(20),
  }).optional().nullable(),
});

type ProcessNewsRabbitsRequest = z.infer<typeof ProcessNewsRabbitsSchema>;

interface ProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  metadata: {
    figmaUrl: string;
    totalAssets?: number;
    processedAssets?: number;
  };
}

// Простое хранилище задач в памяти (в продакшене использовать Redis/DB)
const processingJobs = new Map<string, ProcessingJob>();

/**
 * POST /api/figma/process-news-rabbits
 * Запускает обработку компонентов "Зайцы Новости" из Figma
 */
export async function POST(request: NextRequest) {
  try {
    // Валидация входных данных
    const body = await request.json();
    const validatedData = ProcessNewsRabbitsSchema.parse(body);

    // Проверка переменных окружения
    const figmaToken = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!figmaToken) {
      return NextResponse.json(
        { error: 'FIGMA_ACCESS_TOKEN не настроен' },
        { status: 500 }
      );
    }

    if (!openaiKey && validatedData.options?.aiAnalysis !== false) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY не настроен для AI анализа' },
        { status: 500 }
      );
    }

    // Создаем задачу обработки
    const jobId = generateJobId();
    const job: ProcessingJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      startTime: new Date(),
      metadata: {
        figmaUrl: validatedData.figmaUrl,
      },
    };

    processingJobs.set(jobId, job);

    // Запускаем обработку асинхронно
    processInBackground(jobId, validatedData);

    // Возвращаем ID задачи для отслеживания
    return NextResponse.json({
      success: true,
      jobId,
      status: 'pending',
      message: 'Обработка запущена. Используйте jobId для отслеживания прогресса.',
      trackingUrl: `/api/figma/process-news-rabbits/${jobId}`,
    });

  } catch (error) {
    console.error('Ошибка валидации запроса:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Неверные параметры запроса',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/figma/process-news-rabbits
 * Возвращает список всех задач обработки
 */
export async function GET() {
  const jobs = Array.from(processingJobs.values())
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, 50); // Последние 50 задач

  return NextResponse.json({
    success: true,
    jobs: jobs.map(job => ({
      id: job.id,
      status: job.status,
      progress: job.progress,
      startTime: job.startTime,
      endTime: job.endTime,
      metadata: job.metadata,
      hasError: !!job.error,
    })),
  });
}

/**
 * Асинхронная обработка в фоне
 */
async function processInBackground(jobId: string, params: ProcessNewsRabbitsRequest) {
  const job = processingJobs.get(jobId);
  if (!job) return;

  try {
    // Обновляем статус
    job.status = 'processing';
    job.progress = 10;
    processingJobs.set(jobId, job);

    console.log(`🐰 Начинаем обработку задачи ${jobId}`);

    // Подготавливаем параметры для процессора
    const processorParams = {
      figmaUrl: params.figmaUrl,
      outputDirectory: params.outputDirectory || `./figma-output/${jobId}`,
      context: params.context,
    };

    // Обновляем прогресс
    job.progress = 30;
    processingJobs.set(jobId, job);

    // Запускаем основную обработку
    const result = await processNewsRabbits(processorParams);

    if (result.success) {
      job.status = 'completed';
      job.progress = 100;
      job.endTime = new Date();
      job.result = result.data;
      job.metadata.totalAssets = result.data.summary.totalAssets;
      job.metadata.processedAssets = result.data.processedAssets.length;

      console.log(`✅ Задача ${jobId} завершена успешно`);
    } else {
      throw new Error(result.error || 'Неизвестная ошибка обработки');
    }

  } catch (error) {
    console.error(`❌ Ошибка обработки задачи ${jobId}:`, error);
    
    job.status = 'failed';
    job.endTime = new Date();
    job.error = error instanceof Error ? error.message : 'Неизвестная ошибка';
  }

  processingJobs.set(jobId, job);
}

/**
 * Генерирует уникальный ID задачи
 */
function generateJobId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `figma-${timestamp}-${random}`;
} 