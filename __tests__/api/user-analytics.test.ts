/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/analytics/users/route';

// Mock the database connection
jest.mock('@/shared/infrastructure/database/connection', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    and: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    eq: jest.fn(),
  },
}));

// Mock database schemas
jest.mock('@/shared/infrastructure/database/schema', () => ({
  users: {
    id: 'id',
    email: 'email',
    created_at: 'created_at',
    email_verified: 'email_verified',
    role: 'role',
  },
  email_templates: {
    id: 'id',
    user_id: 'user_id',
    created_at: 'created_at',
    status: 'status',
  },
  sessions: {
    id: 'id',
    user_id: 'user_id',
    created_at: 'created_at',
  },
  api_keys: {
    id: 'id',
    user_id: 'user_id',
    service: 'service',
  },
  content_briefs: {
    id: 'id',
    user_id: 'user_id',
    created_at: 'created_at',
  },
}));

describe('/api/analytics/users API Tests', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      url: 'http://localhost:3000/api/analytics/users',
    };
  });

  describe('User Analytics API Endpoint', () => {
    it('should return user analytics data successfully', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.analytics).toBeDefined();
      expect(responseData.timestamp).toBeDefined();
    });

    it('should include all required analytics sections', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.analytics).toMatchObject({
        overview: expect.objectContaining({
          totalUsers: expect.any(Number),
          activeUsers: expect.any(Number),
          newUsersToday: expect.any(Number),
          newUsersThisWeek: expect.any(Number),
          newUsersThisMonth: expect.any(Number),
          userGrowthRate: expect.any(Number),
        }),
        activity: expect.objectContaining({
          dailyActiveUsers: expect.any(Number),
          weeklyActiveUsers: expect.any(Number),
          monthlyActiveUsers: expect.any(Number),
          averageSessionDuration: expect.any(Number),
          totalSessions: expect.any(Number),
          averageSessionsPerUser: expect.any(Number),
        }),
        engagement: expect.objectContaining({
          templatesPerUser: expect.any(Number),
          activeCreators: expect.any(Number),
          topUsersBy: expect.objectContaining({
            templates: expect.any(Array),
            activity: expect.any(Array),
          }),
          userRetention: expect.objectContaining({
            day1: expect.any(Number),
            day7: expect.any(Number),
            day30: expect.any(Number),
          }),
        }),
        demographics: expect.objectContaining({
          roleDistribution: expect.any(Array),
          registrationTrends: expect.any(Array),
          verificationStatus: expect.objectContaining({
            verified: expect.any(Number),
            unverified: expect.any(Number),
            verificationRate: expect.any(Number),
          }),
        }),
        usage: expect.objectContaining({
          apiKeysConfigured: expect.any(Number),
          servicesUsed: expect.any(Array),
          contentBriefsCreated: expect.any(Number),
          averageContentBriefsPerUser: expect.any(Number),
        }),
        timeDistribution: expect.any(Array),
      });
    });

    it('should return proper response headers', async () => {
      const response = await GET(mockRequest as NextRequest);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });

    it('should handle user overview metrics correctly', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      const { overview } = responseData.analytics;
      
      // Validate user overview metrics
      expect(overview.totalUsers).toBeGreaterThanOrEqual(0);
      expect(overview.activeUsers).toBeGreaterThanOrEqual(0);
      expect(overview.activeUsers).toBeLessThanOrEqual(overview.totalUsers);
      expect(overview.newUsersToday).toBeGreaterThanOrEqual(0);
      expect(overview.newUsersThisWeek).toBeGreaterThanOrEqual(overview.newUsersToday);
      expect(overview.newUsersThisMonth).toBeGreaterThanOrEqual(overview.newUsersThisWeek);
      expect(typeof overview.userGrowthRate).toBe('number');
    });

    it('should validate activity metrics consistency', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      const { activity } = responseData.analytics;
      
      // Daily should be <= Weekly should be <= Monthly active users
      expect(activity.dailyActiveUsers).toBeLessThanOrEqual(activity.weeklyActiveUsers);
      expect(activity.weeklyActiveUsers).toBeLessThanOrEqual(activity.monthlyActiveUsers);
      
      // Session metrics should be reasonable
      expect(activity.totalSessions).toBeGreaterThanOrEqual(0);
      expect(activity.averageSessionsPerUser).toBeGreaterThanOrEqual(0);
      expect(activity.averageSessionDuration).toBeGreaterThanOrEqual(0);
      expect(activity.averageSessionDuration).toBeLessThan(300); // Less than 5 hours
    });

    it('should validate engagement metrics', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      const { engagement } = responseData.analytics;
      
      // Templates per user should be reasonable
      expect(engagement.templatesPerUser).toBeGreaterThanOrEqual(0);
      expect(engagement.templatesPerUser).toBeLessThan(100); // Reasonable upper bound
      
      // Active creators should be non-negative
      expect(engagement.activeCreators).toBeGreaterThanOrEqual(0);
      
      // Retention rates should be percentages (0-100)
      expect(engagement.userRetention.day1).toBeGreaterThanOrEqual(0);
      expect(engagement.userRetention.day1).toBeLessThanOrEqual(100);
      expect(engagement.userRetention.day7).toBeGreaterThanOrEqual(0);
      expect(engagement.userRetention.day7).toBeLessThanOrEqual(100);
      expect(engagement.userRetention.day30).toBeGreaterThanOrEqual(0);
      expect(engagement.userRetention.day30).toBeLessThanOrEqual(100);
      
      // Retention should generally decrease over time
      expect(engagement.userRetention.day30).toBeLessThanOrEqual(engagement.userRetention.day7);
    });

    it('should validate demographics data structure', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      const { demographics } = responseData.analytics;
      
      // Role distribution should have valid structure
      expect(Array.isArray(demographics.roleDistribution)).toBe(true);
      demographics.roleDistribution.forEach((role: any) => {
        expect(role).toMatchObject({
          role: expect.any(String),
          count: expect.any(Number),
          percentage: expect.any(Number),
        });
        expect(role.count).toBeGreaterThanOrEqual(0);
        expect(role.percentage).toBeGreaterThanOrEqual(0);
        expect(role.percentage).toBeLessThanOrEqual(100);
      });
      
      // Registration trends should have valid structure
      expect(Array.isArray(demographics.registrationTrends)).toBe(true);
      expect(demographics.registrationTrends.length).toBe(12); // 12 months
      demographics.registrationTrends.forEach((trend: any) => {
        expect(trend).toMatchObject({
          period: expect.stringMatching(/^\d{4}-\d{2}$/), // YYYY-MM format
          count: expect.any(Number),
        });
        expect(trend.count).toBeGreaterThanOrEqual(0);
      });
      
      // Verification status should be valid
      expect(demographics.verificationStatus.verified).toBeGreaterThanOrEqual(0);
      expect(demographics.verificationStatus.unverified).toBeGreaterThanOrEqual(0);
      expect(demographics.verificationStatus.verificationRate).toBeGreaterThanOrEqual(0);
      expect(demographics.verificationStatus.verificationRate).toBeLessThanOrEqual(100);
    });

    it('should validate usage statistics', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      const { usage } = responseData.analytics;
      
      // API keys should be non-negative
      expect(usage.apiKeysConfigured).toBeGreaterThanOrEqual(0);
      
      // Services used should have valid structure
      expect(Array.isArray(usage.servicesUsed)).toBe(true);
      usage.servicesUsed.forEach((service: any) => {
        expect(service).toMatchObject({
          service: expect.any(String),
          userCount: expect.any(Number),
        });
        expect(service.userCount).toBeGreaterThanOrEqual(0);
      });
      
      // Content briefs metrics should be reasonable
      expect(usage.contentBriefsCreated).toBeGreaterThanOrEqual(0);
      expect(usage.averageContentBriefsPerUser).toBeGreaterThanOrEqual(0);
      expect(usage.averageContentBriefsPerUser).toBeLessThan(50); // Reasonable upper bound
    });

    it('should validate time distribution data', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      const { timeDistribution } = responseData.analytics;
      
      // Should have 24 hours
      expect(Array.isArray(timeDistribution)).toBe(true);
      expect(timeDistribution.length).toBe(24);
      
      // Each hour should have valid structure
      timeDistribution.forEach((hour: any, index: number) => {
        expect(hour).toMatchObject({
          hour: index, // Should match the index (0-23)
          activeUsers: expect.any(Number),
          templatesCreated: expect.any(Number),
        });
        expect(hour.activeUsers).toBeGreaterThanOrEqual(0);
        expect(hour.templatesCreated).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle top users data correctly', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      const { engagement } = responseData.analytics;
      
      // Top users by templates
      expect(Array.isArray(engagement.topUsersBy.templates)).toBe(true);
      engagement.topUsersBy.templates.forEach((user: any) => {
        expect(user).toMatchObject({
          userId: expect.any(String),
          email: expect.any(String),
          templateCount: expect.any(Number),
          lastActive: expect.any(String),
        });
        expect(user.templateCount).toBeGreaterThan(0);
      });
      
      // Top users by activity
      expect(Array.isArray(engagement.topUsersBy.activity)).toBe(true);
      engagement.topUsersBy.activity.forEach((user: any) => {
        expect(user).toMatchObject({
          userId: expect.any(String),
          email: expect.any(String),
          sessionCount: expect.any(Number),
          lastSession: expect.any(String),
        });
        expect(user.sessionCount).toBeGreaterThan(0);
      });
    });

    it('should handle response timing appropriately', async () => {
      const startTime = Date.now();
      const response = await GET(mockRequest as NextRequest);
      const endTime = Date.now();
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      
      // Response should be reasonably fast (under 3 seconds)
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(3000);
      
      // Should have valid timestamp
      expect(responseData.timestamp).toBeDefined();
      const timestamp = new Date(responseData.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(startTime - 1000);
      expect(timestamp.getTime()).toBeLessThan(endTime + 1000);
    });

    it('should handle errors gracefully and return fallback data', async () => {
      // This test validates that the service provides reasonable fallback data
      // even when database queries might fail
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      
      // Even with mocked database, should return reasonable fallback data
      const analytics = responseData.analytics;
      expect(analytics.overview.totalUsers).toBeGreaterThan(0);
      expect(analytics.activity.dailyActiveUsers).toBeGreaterThanOrEqual(0);
      expect(analytics.engagement.templatesPerUser).toBeGreaterThanOrEqual(0);
      expect(analytics.demographics.roleDistribution.length).toBeGreaterThan(0);
      expect(analytics.usage.apiKeysConfigured).toBeGreaterThanOrEqual(0);
      expect(analytics.timeDistribution.length).toBe(24);
    });
  });

  describe('Data Consistency and Business Logic', () => {
    it('should have consistent user counts across different metrics', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      const analytics = responseData.analytics;
      
      // Active users should not exceed total users
      expect(analytics.overview.activeUsers).toBeLessThanOrEqual(analytics.overview.totalUsers);
      
      // Daily active should not exceed weekly active
      expect(analytics.activity.dailyActiveUsers).toBeLessThanOrEqual(analytics.activity.weeklyActiveUsers);
      
      // Weekly active should not exceed monthly active
      expect(analytics.activity.weeklyActiveUsers).toBeLessThanOrEqual(analytics.activity.monthlyActiveUsers);
      
      // Monthly active should not exceed total users
      expect(analytics.activity.monthlyActiveUsers).toBeLessThanOrEqual(analytics.overview.totalUsers);
    });

    it('should have realistic business metrics', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      const analytics = responseData.analytics;
      
      // Growth rate should be within realistic bounds (-100% to +500%)
      expect(analytics.overview.userGrowthRate).toBeGreaterThanOrEqual(-100);
      expect(analytics.overview.userGrowthRate).toBeLessThanOrEqual(500);
      
      // Session duration should be realistic (1 minute to 8 hours)
      expect(analytics.activity.averageSessionDuration).toBeGreaterThanOrEqual(1);
      expect(analytics.activity.averageSessionDuration).toBeLessThanOrEqual(480);
      
      // Templates per user should be reasonable (0 to 20)
      expect(analytics.engagement.templatesPerUser).toBeGreaterThanOrEqual(0);
      expect(analytics.engagement.templatesPerUser).toBeLessThanOrEqual(20);
      
      // Content briefs per user should be reasonable (0 to 10)
      expect(analytics.usage.averageContentBriefsPerUser).toBeGreaterThanOrEqual(0);
      expect(analytics.usage.averageContentBriefsPerUser).toBeLessThanOrEqual(10);
    });

    it('should have percentage values within valid ranges', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      const analytics = responseData.analytics;
      
      // All retention percentages should be 0-100
      expect(analytics.engagement.userRetention.day1).toBeGreaterThanOrEqual(0);
      expect(analytics.engagement.userRetention.day1).toBeLessThanOrEqual(100);
      expect(analytics.engagement.userRetention.day7).toBeGreaterThanOrEqual(0);
      expect(analytics.engagement.userRetention.day7).toBeLessThanOrEqual(100);
      expect(analytics.engagement.userRetention.day30).toBeGreaterThanOrEqual(0);
      expect(analytics.engagement.userRetention.day30).toBeLessThanOrEqual(100);
      
      // Verification rate should be 0-100
      expect(analytics.demographics.verificationStatus.verificationRate).toBeGreaterThanOrEqual(0);
      expect(analytics.demographics.verificationStatus.verificationRate).toBeLessThanOrEqual(100);
      
      // Role distribution percentages should sum to 100 or be individually valid
      analytics.demographics.roleDistribution.forEach((role: any) => {
        expect(role.percentage).toBeGreaterThanOrEqual(0);
        expect(role.percentage).toBeLessThanOrEqual(100);
      });
    });
  });
});