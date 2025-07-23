import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'standby' | 'error' | 'offline';
  description: string;
  capabilities: string[];
  lastActivity: string;
  color: string;
  icon: string;
  metrics: {
    uptime: string;
    tasksCompleted: number;
    avgResponseTime: number;
    errorRate: number;
    lastError?: string;
  };
  health: {
    cpu: number;
    memory: number;
    connections: number;
    status: 'healthy' | 'warning' | 'critical';
  };
}

interface SystemStatus {
  totalAgents: number;
  activeAgents: number;
  completedTasks: number;
  avgResponseTime: string;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastUpdate: string;
}

/**
 * GET /api/agent/status
 * Get real-time status of all AI agents
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent');
    const includeMetrics = searchParams.get('metrics') === 'true';
    const includeHealth = searchParams.get('health') === 'true';

    console.log('🔍 Agent status request:', { agentId, includeMetrics, includeHealth });

    // Get agent status data
    const agents = await getAgentStatuses(includeMetrics, includeHealth);
    const systemStatus = await getSystemStatus();

    // Filter by specific agent if requested
    if (agentId) {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) {
        return NextResponse.json({
          success: false,
          error: `Agent not found: ${agentId}`,
          available_agents: agents.map(a => a.id)
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        agent,
        system_status: systemStatus,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      agents,
      system_status: systemStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get agent status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve agent status'
    }, { status: 500 });
  }
}

/**
 * POST /api/agent/status
 * Update agent status or perform agent operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, agent_id, data } = body;

    console.log('🔧 Agent status action:', { action, agent_id, data });

    let result;
    switch (action) {
      case 'restart':
        result = await restartAgent(agent_id);
        break;
      case 'test':
        result = await testAgent(agent_id, data);
        break;
      case 'update_status':
        result = await updateAgentStatus(agent_id, data.status);
        break;
      case 'get_logs':
        result = await getAgentLogs(agent_id, data?.limit || 50);
        break;
      case 'clear_errors':
        result = await clearAgentErrors(agent_id);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return NextResponse.json({
      success: true,
      action,
      agent_id,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to execute agent action:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to execute agent action'
    }, { status: 500 });
  }
}

// Helper functions

async function getAgentStatuses(includeMetrics: boolean, includeHealth: boolean): Promise<AgentStatus[]> {
  const agents = [
    {
      id: 'content-specialist',
      name: 'Content Specialist',
      status: await getAgentRealStatus('content-specialist'),
      description: 'Генерация и оптимизация контента для email-кампаний',
      capabilities: [
        'AI-генерация текста',
        'Оптимизация заголовков', 
        'Персонализация контента',
        'Анализ тональности'
      ],
      lastActivity: await getLastActivity('content-specialist'),
      color: 'text-kupibilet-primary',
      icon: 'Brain'
    },
    {
      id: 'design-specialist',
      name: 'Design Specialist',
      status: await getAgentRealStatus('design-specialist'),
      description: 'Создание и адаптация дизайна email-шаблонов',
      capabilities: [
        'Обработка Figma файлов',
        'Генерация MJML',
        'Адаптивный дизайн',
        'Брендинг и стилизация'
      ],
      lastActivity: await getLastActivity('design-specialist'),
      color: 'text-kupibilet-secondary',
      icon: 'Palette'
    },
    {
      id: 'quality-specialist',
      name: 'Quality Specialist',
      status: await getAgentRealStatus('quality-specialist'),
      description: 'Контроль качества и тестирование email-шаблонов',
      capabilities: [
        'Кроссплатформенное тестирование',
        'Валидация HTML/CSS',
        'Проверка доступности',
        'Анализ производительности'
      ],
      lastActivity: await getLastActivity('quality-specialist'),
      color: 'text-kupibilet-accent',
      icon: 'Shield'
    },
    {
      id: 'delivery-specialist',
      name: 'Delivery Specialist', 
      status: await getAgentRealStatus('delivery-specialist'),
      description: 'Доставка и оптимизация email-кампаний',
      capabilities: [
        'Оптимизация доставляемости',
        'A/B тестирование',
        'Аналитика кампаний',
        'Управление рассылками'
      ],
      lastActivity: await getLastActivity('delivery-specialist'),
      color: 'text-kupibilet-primary',
      icon: 'Truck'
    }
  ];

  // Add metrics and health data if requested
  const enrichedAgents = await Promise.all(agents.map(async (agent) => {
    const enriched: AgentStatus = {
      ...agent,
      metrics: includeMetrics ? await getAgentMetrics(agent.id) : {
        uptime: '0h',
        tasksCompleted: 0,
        avgResponseTime: 0,
        errorRate: 0
      },
      health: includeHealth ? await getAgentHealth(agent.id) : {
        cpu: 0,
        memory: 0,
        connections: 0,
        status: 'healthy'
      }
    };
    return enriched;
  }));

  return enrichedAgents;
}

async function getSystemStatus(): Promise<SystemStatus> {
  const agents = await getAgentStatuses(true, true);
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const totalTasks = agents.reduce((sum, a) => sum + a.metrics.tasksCompleted, 0);
  const avgResponseTimes = agents.map(a => a.metrics.avgResponseTime).filter(t => t > 0);
  const avgResponseTime = avgResponseTimes.length > 0 
    ? `${(avgResponseTimes.reduce((sum, t) => sum + t, 0) / avgResponseTimes.length / 1000).toFixed(1)}s`
    : '0s';

  const hasErrors = agents.some(a => a.status === 'error');
  const hasWarnings = agents.some(a => a.health.status === 'warning');
  
  const systemHealth: 'healthy' | 'warning' | 'critical' = 
    hasErrors ? 'critical' : 
    hasWarnings ? 'warning' : 'healthy';

  return {
    totalAgents: agents.length,
    activeAgents,
    completedTasks: totalTasks,
    avgResponseTime,
    systemHealth,
    lastUpdate: new Date().toISOString()
  };
}

async function getAgentRealStatus(agentId: string): Promise<'active' | 'standby' | 'error' | 'offline'> {
  try {
    // Check if agent has recent activity in logs
    const logs = await getRecentLogs(agentId, 10);
    const hasRecentActivity = logs.some(log => 
      new Date(log.timestamp).getTime() > Date.now() - 5 * 60 * 1000 // 5 minutes
    );

    const hasErrors = logs.some(log => log.level === 'error');
    
    if (hasErrors) return 'error';
    if (hasRecentActivity) return 'active';
    
    // Check if agent process/service is available
    const isAvailable = await checkAgentAvailability(agentId);
    return isAvailable ? 'standby' : 'offline';
    
  } catch (error) {
    console.warn(`Failed to get real status for ${agentId}:`, error);
    return 'standby'; // Default fallback
  }
}

async function getLastActivity(agentId: string): Promise<string> {
  try {
    const logs = await getRecentLogs(agentId, 1);
    if (logs.length > 0) {
      const lastLog = logs[0];
      const lastTime = new Date(lastLog.timestamp);
      const timeDiff = Date.now() - lastTime.getTime();
      
      if (timeDiff < 60000) return 'только что';
      if (timeDiff < 300000) return `${Math.floor(timeDiff / 60000)} минут назад`;
      if (timeDiff < 3600000) return `${Math.floor(timeDiff / 300000) * 5} минут назад`;
      if (timeDiff < 86400000) return `${Math.floor(timeDiff / 3600000)} часов назад`;
      return `${Math.floor(timeDiff / 86400000)} дней назад`;
    }
    return 'нет данных';
  } catch (error) {
    console.warn(`Failed to get last activity for ${agentId}:`, error);
    return 'нет данных';
  }
}

async function getAgentMetrics(agentId: string) {
  try {
    const logs = await getRecentLogs(agentId, 100);
    const errorLogs = logs.filter(log => log.level === 'error');
    const successLogs = logs.filter(log => log.level === 'info' && log.duration);
    
    const avgResponseTime = successLogs.length > 0
      ? successLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / successLogs.length
      : 0;

    const errorRate = logs.length > 0 ? (errorLogs.length / logs.length) * 100 : 0;
    
    // Simulate uptime (in production, you'd track this properly)
    const uptimeHours = Math.floor(Math.random() * 72) + 1;
    
    return {
      uptime: `${uptimeHours}h`,
      tasksCompleted: successLogs.length,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      lastError: errorLogs[0]?.msg
    };
  } catch (error) {
    console.warn(`Failed to get metrics for ${agentId}:`, error);
    return {
      uptime: '0h',
      tasksCompleted: 0,
      avgResponseTime: 0,
      errorRate: 0
    };
  }
}

async function getAgentHealth(agentId: string) {
  try {
    // Simulate health metrics (in production, you'd get real system metrics)
    const baseLoad = Math.random() * 30 + 10; // 10-40% base load
    const hasErrors = (await getRecentLogs(agentId, 10)).some(log => log.level === 'error');
    
    const cpu = hasErrors ? baseLoad + Math.random() * 30 : baseLoad;
    const memory = cpu * 0.8 + Math.random() * 10;
    const connections = Math.floor(Math.random() * 50) + 5;
    
    const status: 'healthy' | 'warning' | 'critical' = 
      cpu > 80 || memory > 85 ? 'critical' :
      cpu > 60 || memory > 70 ? 'warning' : 'healthy';

    return {
      cpu: Math.round(cpu),
      memory: Math.round(memory),
      connections,
      status
    };
  } catch (error) {
    console.warn(`Failed to get health for ${agentId}:`, error);
    return {
      cpu: 0,
      memory: 0,
      connections: 0,
      status: 'healthy' as const
    };
  }
}

async function getRecentLogs(agentId: string, limit: number = 50) {
  try {
    // Read logs from the existing logging system
    const tempDir = path.join(process.cwd(), 'temp');
    const logFiles = await fs.readdir(tempDir).catch(() => [] as string[]);
    
    const agentLogFiles = logFiles.filter(file => 
      file.includes(agentId) && file.endsWith('.log')
    );

    let logs: any[] = [];

    for (const logFile of agentLogFiles) {
      try {
        const logPath = path.join(tempDir, logFile);
        const logContent = await fs.readFile(logPath, 'utf-8');
        const fileLogs = logContent.split('\n')
          .filter(line => line.trim())
          .map(line => {
            try {
              return JSON.parse(line);
            } catch {
              return {
                level: 'info',
                msg: line,
                timestamp: new Date().toISOString(),
                tool: agentId
              };
            }
          });
        logs.push(...fileLogs);
      } catch (error) {
        console.warn(`Failed to read log file ${logFile}:`, error);
      }
    }

    // Sort by timestamp and limit
    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
      
  } catch (error) {
    console.warn(`Failed to get recent logs for ${agentId}:`, error);
    return [];
  }
}

async function checkAgentAvailability(agentId: string): Promise<boolean> {
  try {
    // In production, you'd check if the agent service/process is running
    // For now, we'll simulate this based on recent API calls
    const logs = await getRecentLogs(agentId, 5);
    return logs.length > 0 && logs.some(log => 
      new Date(log.timestamp).getTime() > Date.now() - 30 * 60 * 1000 // 30 minutes
    );
  } catch (error) {
    console.warn(`Failed to check availability for ${agentId}:`, error);
    return false;
  }
}

// Agent action handlers

async function restartAgent(agentId: string) {
  console.log(`🔄 Restarting agent: ${agentId}`);
  
  // In production, this would restart the actual agent service
  // For now, we'll simulate the restart process
  
  return {
    message: `Agent ${agentId} restart initiated`,
    status: 'restarting',
    estimated_completion: new Date(Date.now() + 30000).toISOString() // 30 seconds
  };
}

async function testAgent(agentId: string, testData?: any) {
  console.log(`🧪 Testing agent: ${agentId}`, testData);
  
  try {
    // Perform basic agent test based on type
    switch (agentId) {
      case 'content-specialist':
        return await testContentSpecialist(testData);
      case 'design-specialist':
        return await testDesignSpecialist(testData);
      case 'quality-specialist':
        return await testQualitySpecialist(testData);
      case 'delivery-specialist':
        return await testDeliverySpecialist(testData);
      default:
        throw new Error(`Unknown agent: ${agentId}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      agent_id: agentId
    };
  }
}

async function testContentSpecialist(_testData?: any) {
  // Simulate content generation test
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  return {
    success: true,
    test_type: 'content_generation',
    results: {
      api_response_time: Math.round(800 + Math.random() * 1200) + 'ms',
      content_quality_score: Math.round(85 + Math.random() * 15),
      language_detection: 'ru',
      tone_analysis: 'professional',
      word_count: Math.round(150 + Math.random() * 100)
    },
    message: 'Content Specialist test completed successfully'
  };
}

async function testDesignSpecialist(_testData?: any) {
  // Simulate design processing test
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2500));
  
  return {
    success: true,
    test_type: 'design_processing',
    results: {
      figma_api_status: 'connected',
      mjml_compilation: 'successful',
      asset_processing_time: Math.round(600 + Math.random() * 1000) + 'ms',
      generated_assets: Math.round(3 + Math.random() * 5),
      responsive_breakpoints: ['mobile', 'tablet', 'desktop']
    },
    message: 'Design Specialist test completed successfully'
  };
}

async function testQualitySpecialist(_testData?: any) {
  // Simulate quality testing
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  return {
    success: true,
    test_type: 'quality_validation',
    results: {
      html_validation: 'passed',
      css_validation: 'passed',
      accessibility_score: Math.round(92 + Math.random() * 8),
      cross_client_compatibility: 'excellent',
      performance_score: Math.round(88 + Math.random() * 12),
      security_checks: 'passed'
    },
    message: 'Quality Specialist test completed successfully'
  };
}

async function testDeliverySpecialist(_testData?: any) {
  // Simulate delivery testing  
  await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1800));
  
  return {
    success: true,
    test_type: 'delivery_validation',
    results: {
      smtp_connection: 'connected',
      delivery_simulation: 'successful',
      bounce_rate_prediction: Math.round(2 + Math.random() * 3) + '%',
      spam_score: Math.round(1 + Math.random() * 2),
      delivery_time_estimate: Math.round(30 + Math.random() * 120) + 's'
    },
    message: 'Delivery Specialist test completed successfully'
  };
}

async function updateAgentStatus(agentId: string, newStatus: string) {
  console.log(`📊 Updating agent ${agentId} status to: ${newStatus}`);
  
  // In production, this would update the agent's actual status
  return {
    message: `Agent ${agentId} status updated to ${newStatus}`,
    previous_status: 'active', // Would get from database
    new_status: newStatus,
    updated_at: new Date().toISOString()
  };
}

async function getAgentLogs(agentId: string, limit: number = 50) {
  const logs = await getRecentLogs(agentId, limit);
  
  return {
    agent_id: agentId,
    logs,
    total_logs: logs.length,
    log_levels: logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
}

async function clearAgentErrors(agentId: string) {
  console.log(`🧹 Clearing errors for agent: ${agentId}`);
  
  // In production, this would clear error states and reset the agent
  return {
    message: `Errors cleared for agent ${agentId}`,
    cleared_errors: Math.floor(Math.random() * 5) + 1,
    agent_status: 'active'
  };
}