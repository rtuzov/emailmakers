import { OpenAI } from 'openai';
import { logger } from './logger';
import { getConfig } from './config';

const cfg = getConfig();

export class OpenAIClient {
  private static instance: OpenAIClient;
  private openai: OpenAI;

  private constructor() {
    if (!cfg.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    this.openai = new OpenAI({ apiKey: cfg.openaiApiKey });
  }

  static get(): OpenAIClient {
    if (!OpenAIClient.instance) {
      OpenAIClient.instance = new OpenAIClient();
    }
    return OpenAIClient.instance;
  }

  async chatCompletion(params: OpenAI.Chat.Completions.ChatCompletionCreateParams, attempts = 0): Promise<string> {
    try {
      const resp = await this.openai.chat.completions.create(params);
      // Handle both streaming and non-streaming responses
      if ('choices' in resp) {
        return resp.choices[0].message.content || '';
      } else {
        throw new Error('Streaming responses not supported in this method');
      }
    } catch (error: any) {
      if (attempts >= 3) {
        logger.error('OpenAI request failed', { error: error.message });
        throw error;
      }
      const delay = Math.pow(2, attempts) * 1000 + Math.random() * 500;
      logger.warn(`OpenAI error – retrying in ${delay}ms`, { attempts, error: error.message });
      await new Promise(r => setTimeout(r, delay));
      return this.chatCompletion(params, attempts + 1);
    }
  }

  get raw() {
    return this.openai;
  }
} 