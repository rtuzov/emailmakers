// Stub for old agent.ts functionality - moved to useless
export async function runAgent(request: any): Promise<any> {
  throw new Error('Old agent.ts has been replaced. Use the new specialist agents system.');
}

export class EmailGeneratorAgent {
  static async create(): Promise<EmailGeneratorAgent> {
    throw new Error('EmailGeneratorAgent has been replaced. Use the new specialist agents system.');
  }

  async generateEmail(request: any): Promise<any> {
    throw new Error('EmailGeneratorAgent has been replaced. Use the new specialist agents system.');
  }
} 