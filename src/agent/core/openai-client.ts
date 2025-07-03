import { OpenAI } from 'openai';
import { Agent, run } from '@openai/agents';
import { logger } from './logger';
import { getConfig } from './config';

const cfg = getConfig();

export class OpenAIClient {
  private static instance: OpenAIClient;
  private openai: OpenAI;
  private defaultAgent: Agent;

  private constructor() {
    if (!cfg.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    this.openai = new OpenAI({ apiKey: cfg.openaiApiKey });
    
    // Создаем агента по умолчанию для обратной совместимости
    this.defaultAgent = new Agent({
      name: 'DefaultAgent',
      instructions: 'You are a helpful assistant that provides accurate and concise responses.',
      model: 'gpt-4o-mini'
    });
  }

  static get(): OpenAIClient {
    if (!OpenAIClient.instance) {
      OpenAIClient.instance = new OpenAIClient();
    }
    return OpenAIClient.instance;
  }

  /**
   * Использует OpenAI Agents SDK для выполнения запросов
   * @param params Параметры для создания агента или промпт
   * @param attempts Количество попыток
   * @returns Результат выполнения агента
   */
  async chatCompletion(params: OpenAI.Chat.Completions.ChatCompletionCreateParams | string, attempts = 0): Promise<string> {
    try {
      let result: any;
      
      if (typeof params === 'string') {
        // Простой промпт - используем агента по умолчанию
        result = await run(this.defaultAgent, params);
      } else {
        // Создаем специализированного агента на основе параметров
        const messages = params.messages;
        const systemMessage = messages.find(m => m.role === 'system')?.content || 'You are a helpful assistant.';
        const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join('\n');
        
        const specializedAgent = new Agent({
          name: 'SpecializedAgent',
          instructions: typeof systemMessage === 'string' ? systemMessage : 'You are a helpful assistant.',
          model: params.model || 'gpt-4o-mini',
          settings: {
            temperature: params.temperature,
            maxTokens: params.max_tokens,
            topP: params.top_p
          }
        });
        
        result = await run(specializedAgent, userMessages);
      }
      
      return result.finalOutput || '';
      
    } catch (error: any) {
      if (attempts >= 3) {
        logger.error('OpenAI Agents SDK request failed', { error: error.message });
        throw error;
      }
      const delay = Math.pow(2, attempts) * 1000 + Math.random() * 500;
      logger.warn(`OpenAI Agents SDK error – retrying in ${delay}ms`, { attempts, error: error.message });
      await new Promise(r => setTimeout(r, delay));
      return this.chatCompletion(params, attempts + 1);
    }
  }

  /**
   * Создает и запускает агента с заданными инструкциями
   * @param instructions Инструкции для агента
   * @param prompt Промпт для выполнения
   * @param model Модель для использования
   * @returns Результат выполнения агента
   */
  async runAgent(instructions: string, prompt: string, model: string = 'gpt-4o-mini'): Promise<string> {
    const agent = new Agent({
      name: 'CustomAgent',
      instructions,
      model
    });
    
    const result = await run(agent, prompt);
    return result.finalOutput || '';
  }

  /**
   * Возвращает агента по умолчанию для использования в других местах
   */
  get defaultAgentInstance(): Agent {
    return this.defaultAgent;
  }

  /**
   * Обратная совместимость - возвращает raw OpenAI клиент
   * @deprecated Используйте методы Agents SDK вместо прямого доступа к OpenAI
   */
  get raw() {
    return this.openai;
  }
} 