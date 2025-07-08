import { NextRequest, NextResponse } from 'next/server';

/**
 * 🚧 УСТАРЕВШИЙ ТЕСТ - ТРЕБУЕТ ОБНОВЛЕНИЯ
 * 
 * Этот тест использовал старые consolidated tools, которые были перемещены в useless/.
 * Для тестирования новой архитектуры используйте:
 * - /api/test-orchestrator - для тестирования orchestrator
 * - /api/test-content - для тестирования content specialist
 * - /api/test-handoff - для тестирования handoff между агентами
 */

export async function POST(request: NextRequest) {
      return NextResponse.json({ 
    success: false,
    message: '🚧 Этот тест устарел. Consolidated tools перемещены в useless/.',
    recommendations: [
      'Используйте /api/test-orchestrator для тестирования новой архитектуры',
      'Используйте /api/test-content для тестирования content specialist',
      'Используйте /api/test-handoff для тестирования handoff между агентами'
    ],
    migration_info: {
      old_path: 'tools/consolidated/*',
      new_path: 'core/specialists/* + tool-registry.ts',
      architecture: 'OpenAI Agents SDK + Specialist Pattern'
    }
  }, { status: 410 }); // Gone
}

export async function GET() {
      return NextResponse.json({ 
    message: 'Test Simple API - Устарел',
    status: 'deprecated',
    alternatives: [
      '/api/test-orchestrator',
      '/api/test-content', 
      '/api/test-handoff'
    ]
  });
} 