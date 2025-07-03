import { NextRequest } from 'next/server';
import { GET } from '@/app/api/templates/route';

// Create a proper mock chain
const createMockQueryBuilder = () => {
  const mockBuilder = {
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
  };

  // Chain all methods to return themselves
  mockBuilder.select.mockReturnValue(mockBuilder);
  mockBuilder.from.mockReturnValue(mockBuilder);
  mockBuilder.where.mockReturnValue(mockBuilder);
  mockBuilder.orderBy.mockReturnValue(mockBuilder);
  mockBuilder.limit.mockReturnValue(mockBuilder);
  
  // The last method (offset) returns a promise
  mockBuilder.offset.mockReturnValue(Promise.resolve([]));

  return mockBuilder;
};

// Mock database connection at the module level
jest.mock('@/shared/infrastructure/database/connection', () => ({
  db: {
    select: jest.fn(() => createMockQueryBuilder())
  }
}));

function createMockRequest(url: string = 'http://localhost:3000/api/templates') {
  return new NextRequest(url, { method: 'GET' });
}

describe('Debug Templates API (Fixed)', () => {
  test('should work with proper mocking', async () => {
    const request = createMockRequest();
    
    try {
      const response = await GET(request);
      const data = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(data));
      
      if (response.status !== 200) {
        console.error('Error response:', data);
      }
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });
});