import { NextRequest } from 'next/server';
import { GET } from '@/app/api/templates/route';

// Mock database connection at the module level
jest.mock('@/shared/infrastructure/database/connection', () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue(Promise.resolve([{ count: 0 }]))
      })
    })
  }
}));

function createMockRequest(url: string = 'http://localhost:3000/api/templates') {
  return new NextRequest(url, { method: 'GET' });
}

describe('Debug Templates API', () => {
  test('should debug the error', async () => {
    const request = createMockRequest();
    
    try {
      const response = await GET(request);
      const data = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (response.status !== 200) {
        console.error('Error response:', data);
      }
      
      expect(response.status).toBe(200);
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });
});