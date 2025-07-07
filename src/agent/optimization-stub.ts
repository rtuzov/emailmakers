// Stub for optimization functionality - moved to useless
export function createOptimizationService(config?: any): any {
  return {
    initialize: async () => {},
    shutdown: async () => {},
    optimize: async () => ({ status: 'optimization disabled' }),
    analyze: async () => ({ status: 'analysis disabled' }),
    analyzeSystem: async () => ({
      current_state: {
        system_metrics: {
          system_health_score: 0.8,
          active_agents: 0,
          overall_success_rate: 0.9,
          average_response_time: 100
        }
      },
      trends: [],
      bottlenecks: [],
      error_patterns: [],
      predicted_issues: [],
      overall_health_assessment: 'System optimization disabled',
      optimization_opportunities: []
    }),
    getRecommendations: async () => [],
    getStatus: () => ({ status: 'disabled', initialized: false })
  };
} 