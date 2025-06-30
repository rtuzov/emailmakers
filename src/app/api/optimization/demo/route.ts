/**
 * 🎯 OPTIMIZATION DEMO API - API endpoint для демонстрации системы оптимизации
 * 
 * Предоставляет REST API для запуска демонстрации и получения результатов
 * работы системы автоматической оптимизации.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  demonstrateOptimizationSystem, 
  simulateRealWorldOptimization,
  demonstrateSystemIntegration 
} from '../../../../agent/optimization/optimization-demo';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const demoType = searchParams.get('type') || 'basic';

  try {
    console.log(`🚀 Starting optimization demo: ${demoType}`);

    let results: any = {};
    let logs: string[] = [];

    // Перехватываем console.log для сбора логов
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(message);
      originalLog(...args);
    };

    try {
      switch (demoType) {
        case 'basic':
          await demonstrateOptimizationSystem();
          results = {
            type: 'basic',
            description: 'Complete optimization system demonstration',
            features: [
              'System analysis and health assessment',
              'Recommendation generation with safety evaluation',
              'Safe optimization application',
              'Rollback capability demonstration',
              'Dynamic threshold generation',
              'Comprehensive reporting'
            ]
          };
          break;

        case 'simulation':
          await simulateRealWorldOptimization();
          results = {
            type: 'simulation',
            description: 'Real-world optimization simulation',
            features: [
              'Continuous monitoring and optimization',
              'Event-driven optimization triggers',
              'Automated decision making',
              'Performance tracking'
            ]
          };
          break;

        case 'integration':
          await demonstrateSystemIntegration();
          results = {
            type: 'integration',
            description: 'System integration demonstration',
            features: [
              'ValidationMonitor integration',
              'MetricsService integration',
              'PerformanceMonitor integration',
              'Event-driven architecture',
              'Safety mechanisms'
            ]
          };
          break;

        default:
          throw new Error(`Unknown demo type: ${demoType}`);
      }

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        demo: results,
        logs: logs,
        summary: {
          total_log_entries: logs.length,
          demo_duration: 'Variable based on demo type',
          status: 'completed_successfully'
        }
      });

    } finally {
      // Восстанавливаем оригинальный console.log
      console.log = originalLog;
    }

  } catch (error) {
    console.error('❌ Demo execution failed:', error);

    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'demo_execution_error'
      },
      logs: logs || [],
      summary: {
        total_log_entries: (logs || []).length,
        demo_duration: 'interrupted',
        status: 'failed'
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case 'custom_demo':
        return await runCustomDemo(config);
      
      case 'analyze_system':
        return await performSystemAnalysis();
      
      case 'get_recommendations':
        return await getOptimizationRecommendations();
      
      default:
        return NextResponse.json({
          success: false,
          error: {
            message: `Unknown action: ${action}`,
            available_actions: ['custom_demo', 'analyze_system', 'get_recommendations']
          }
        }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Request processing failed',
        type: 'request_error'
      }
    }, { status: 400 });
  }
}

async function runCustomDemo(config: any) {
  const { createOptimizationService } = await import('../../../../agent/optimization');
  
  try {
    const service = createOptimizationService(config);
    
    await service.initialize();
    
    const analysis = await service.analyzeSystem();
    const recommendations = await service.getRecommendations();
    const status = service.getStatus();
    
    await service.shutdown();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        system_analysis: {
          health_score: analysis.current_state.system_metrics.system_health_score,
          trends_count: analysis.trends.length,
          bottlenecks_count: analysis.bottlenecks.length,
          assessment: analysis.overall_health_assessment
        },
        recommendations: {
          total_count: recommendations.length,
          by_priority: recommendations.reduce((acc, rec) => {
            acc[rec.priority] = (acc[rec.priority] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          safe_to_apply: recommendations.filter(r => 
            !r.requires_human_approval && 
            ['low', 'medium'].includes(r.safety_assessment.risk_level)
          ).length
        },
        service_status: status
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Custom demo failed',
        type: 'custom_demo_error'
      }
    }, { status: 500 });
  }
}

async function performSystemAnalysis() {
  const { createOptimizationService } = await import('../../../../agent/optimization');
  
  try {
    const service = createOptimizationService({ enabled: true });
    
    await service.initialize();
    const analysis = await service.analyzeSystem();
    await service.shutdown();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      analysis: {
        current_state: {
          health_score: analysis.current_state.system_metrics.system_health_score,
          active_agents: analysis.current_state.system_metrics.active_agents,
          success_rate: analysis.current_state.system_metrics.overall_success_rate,
          average_response_time: analysis.current_state.system_metrics.average_response_time
        },
        insights: {
          trends_detected: analysis.trends.length,
          bottlenecks_found: analysis.bottlenecks.length,
          error_patterns: analysis.error_patterns.length,
          predicted_issues: analysis.predicted_issues.length
        },
        assessment: analysis.overall_health_assessment,
        opportunities: analysis.optimization_opportunities
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'System analysis failed',
        type: 'analysis_error'
      }
    }, { status: 500 });
  }
}

async function getOptimizationRecommendations() {
  const { createOptimizationService } = await import('../../../../agent/optimization');
  
  try {
    const service = createOptimizationService({ enabled: true });
    
    await service.initialize();
    const recommendations = await service.getRecommendations();
    await service.shutdown();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      recommendations: {
        total_count: recommendations.length,
        items: recommendations.map(rec => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          type: rec.type,
          priority: rec.priority,
          expected_impact: {
            performance_improvement: rec.expected_impact.performance_improvement_percent,
            success_rate_improvement: rec.expected_impact.success_rate_improvement_percent,
            response_time_reduction: rec.expected_impact.response_time_reduction_ms
          },
          safety: {
            risk_level: rec.safety_assessment.risk_level,
            requires_approval: rec.requires_human_approval,
            potential_impacts: rec.safety_assessment.potential_negative_impacts
          },
          estimated_duration: rec.estimated_duration
        })),
        summary: {
          by_priority: recommendations.reduce((acc, rec) => {
            acc[rec.priority] = (acc[rec.priority] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          by_risk_level: recommendations.reduce((acc, rec) => {
            acc[rec.safety_assessment.risk_level] = (acc[rec.safety_assessment.risk_level] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          safe_to_auto_apply: recommendations.filter(r => 
            !r.requires_human_approval && 
            ['low', 'medium'].includes(r.safety_assessment.risk_level)
          ).length
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get recommendations',
        type: 'recommendations_error'
      }
    }, { status: 500 });
  }
}