/**
 * 🔍 OPENAI OBSERVABILITY
 * 
 * Модуль для мониторинга использования OpenAI API и токенов
 */

export interface OpenAIMetrics {
  model_usage: {
    cost_estimate: number;
    total_tokens: number;
    completion_tokens?: number;
    prompt_tokens?: number;
  };
  api_calls: {
    total_requests: number;
    failed_requests: number;
    average_response_time: number;
  };
}

class OpenAIObservability {
  private metrics: OpenAIMetrics = {
    model_usage: {
      cost_estimate: 0,
      total_tokens: 0
    },
    api_calls: {
      total_requests: 0,
      failed_requests: 0,
      average_response_time: 0
    }
  };

  getMetrics(): OpenAIMetrics {
    // В будущем здесь будет подключение к реальному мониторингу OpenAI API
    console.warn('⚠️ OpenAIObservability: Using placeholder metrics - implement real API monitoring');
    return this.metrics;
  }

  recordAPICall(tokens: number, cost: number, responseTime: number, success: boolean): void {
    this.metrics.model_usage.total_tokens += tokens;
    this.metrics.model_usage.cost_estimate += cost;
    this.metrics.api_calls.total_requests++;
    
    if (!success) {
      this.metrics.api_calls.failed_requests++;
    }

    console.log(`📊 OpenAI API call recorded: ${tokens} tokens, $${cost}, ${responseTime}ms, success: ${success}`);
  }
}

export const openaiObservability = new OpenAIObservability();