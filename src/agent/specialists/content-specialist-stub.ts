// Stub for content specialist - moved to useless
export interface ContentSpecialistInput {
  task_type: string;
  brief?: string;
  [key: string]: any;
}

export class ContentSpecialistAgent {
  async processRequest(input: ContentSpecialistInput): Promise<any> {
    throw new Error('ContentSpecialistAgent has been replaced. Use the new specialist agents system.');
  }

  async executeTask(input: ContentSpecialistInput): Promise<any> {
    throw new Error('ContentSpecialistAgent has been replaced. Use the new specialist agents system.');
  }
} 