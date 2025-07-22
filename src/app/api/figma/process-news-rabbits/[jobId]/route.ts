import { NextRequest, NextResponse } from 'next/server';

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

// Импортируем хранилище задач (в реальном проекте это будет внешнее хранилище)
// Для демонстрации создаем заглушку
const processingJobs = new Map<string, ProcessingJob>();

/**
 * GET /api/figma/process-news-rabbits/[jobId]
 * Возвращает статус конкретной задачи обработки
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID не указан' },
        { status: 400 }
      );
    }

    const job = processingJobs.get(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Задача не найдена' },
        { status: 404 }
      );
    }

    // Базовая информация о задаче
    const response: any = {
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        startTime: job.startTime,
        endTime: job.endTime,
        metadata: job.metadata,
      },
    };

    // Добавляем результат, если задача завершена
    if (job.status === 'completed' && job.result) {
      response.job.result = {
        summary: job.result.summary,
        outputDirectory: job.result.outputDirectory,
        reportPath: job.result.report,
        // Не включаем полные данные ассетов для экономии трафика
        assetCount: job.result.processedAssets?.length || 0,
      };
    }

    // Добавляем ошибку, если задача провалилась
    if (job.status === 'failed' && job.error) {
      response.job.error = job.error;
    }

    // Добавляем расчетное время завершения для активных задач
    if (job.status === 'processing') {
      const elapsed = Date.now() - job.startTime.getTime();
      const estimatedTotal = (elapsed / job.progress) * 100;
      const estimatedRemaining = estimatedTotal - elapsed;
      
      response.job.estimatedTimeRemaining = Math.max(0, Math.round(estimatedRemaining / 1000)); // в секундах
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Ошибка получения статуса задачи:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/figma/process-news-rabbits/[jobId]
 * Отменяет задачу (если возможно) или удаляет из истории
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID не указан' },
        { status: 400 }
      );
    }

    const job = processingJobs.get(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Задача не найдена' },
        { status: 404 }
      );
    }

    // Если задача выполняется, помечаем как отмененную
    if (job.status === 'processing' || job.status === 'pending') {
      job.status = 'failed';
      job.error = 'Задача отменена пользователем';
      job.endTime = new Date();
      processingJobs.set(jobId, job);

      return NextResponse.json({
        success: true,
        message: 'Задача отменена',
        job: {
          id: job.id,
          status: job.status,
          endTime: job.endTime,
        },
      });
    }

    // Если задача завершена, удаляем из истории
    processingJobs.delete(jobId);

    return NextResponse.json({
      success: true,
      message: 'Задача удалена из истории',
    });

  } catch (error) {
    console.error('Ошибка удаления задачи:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 