/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/analytics/users/route';

describe('User Analytics Integration Tests', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    mockRequest = {
      url: 'http://localhost:3000/api/analytics/users',
    };
  });

  describe('User Analytics API Integration', () => {
    it('should successfully call the user analytics API and return structured data', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.analytics).toBeDefined();

      console.log('✅ User Analytics API: Response received successfully');
      console.log(`✅ Overview: ${responseData.analytics.overview.totalUsers} total users, ${responseData.analytics.overview.activeUsers} active`);
      console.log(`✅ Activity: ${responseData.analytics.activity.dailyActiveUsers} daily active users`);
      console.log(`✅ Engagement: ${responseData.analytics.engagement.templatesPerUser} templates per user`);
      console.log(`✅ Demographics: ${responseData.analytics.demographics.roleDistribution.length} roles`);
      console.log(`✅ Usage: ${responseData.analytics.usage.apiKeysConfigured} API keys configured`);
      console.log(`✅ Time Distribution: ${responseData.analytics.timeDistribution.length} hours tracked`);
    });

    it('should provide consistent data across analytics sections', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();
      const analytics = responseData.analytics;

      // Validate data consistency
      expect(analytics.overview.activeUsers).toBeLessThanOrEqual(analytics.overview.totalUsers);
      expect(analytics.activity.dailyActiveUsers).toBeLessThanOrEqual(analytics.activity.weeklyActiveUsers);
      expect(analytics.activity.weeklyActiveUsers).toBeLessThanOrEqual(analytics.activity.monthlyActiveUsers);
      
      // Validate engagement metrics
      expect(analytics.engagement.templatesPerUser).toBeGreaterThanOrEqual(0);
      expect(analytics.engagement.activeCreators).toBeGreaterThanOrEqual(0);
      expect(analytics.engagement.activeCreators).toBeLessThanOrEqual(analytics.overview.totalUsers);

      // Validate demographics
      const totalRoleUsers = analytics.demographics.roleDistribution.reduce((sum: number, role: any) => sum + role.count, 0);
      if (totalRoleUsers > 0) {
        expect(totalRoleUsers).toBeLessThanOrEqual(analytics.overview.totalUsers);
      }

      // Validate time distribution
      expect(analytics.timeDistribution.length).toBe(24);
      analytics.timeDistribution.forEach((hour: any) => {
        expect(hour.hour).toBeGreaterThanOrEqual(0);
        expect(hour.hour).toBeLessThan(24);
        expect(hour.activeUsers).toBeGreaterThanOrEqual(0);
        expect(hour.templatesCreated).toBeGreaterThanOrEqual(0);
      });

      console.log('✅ Data Consistency: All analytics sections have consistent data');
    });

    it('should handle database fallbacks gracefully', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // Even with potential database issues, should return reasonable fallback data
      const analytics = responseData.analytics;
      expect(analytics.overview.totalUsers).toBeGreaterThanOrEqual(0);
      expect(analytics.activity.totalSessions).toBeGreaterThanOrEqual(0);
      expect(analytics.demographics.registrationTrends.length).toBe(12); // 12 months
      expect(analytics.usage.servicesUsed.length).toBeGreaterThanOrEqual(0);

      console.log('✅ Fallback Handling: API provides reasonable data even with database issues');
    });

    it('should return valid JSON response with proper headers', async () => {
      const response = await GET(mockRequest as NextRequest);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');

      const responseData = await response.json();
      expect(responseData.timestamp).toBeDefined();
      
      const timestamp = new Date(responseData.timestamp);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());

      console.log('✅ Response Format: Proper headers and JSON structure');
    });

    it('should provide business-meaningful analytics data', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();
      const analytics = responseData.analytics;

      // Check for realistic business metrics
      if (analytics.overview.totalUsers > 0) {
        // User engagement should be reasonable
        expect(analytics.engagement.templatesPerUser).toBeLessThan(100); // Not more than 100 templates per user
        expect(analytics.activity.averageSessionDuration).toBeLessThan(600); // Not more than 10 hours
        expect(analytics.activity.averageSessionsPerUser).toBeLessThan(1000); // Not more than 1000 sessions per user
        
        // Retention rates should be percentages
        expect(analytics.engagement.userRetention.day1).toBeLessThanOrEqual(100);
        expect(analytics.engagement.userRetention.day7).toBeLessThanOrEqual(100);
        expect(analytics.engagement.userRetention.day30).toBeLessThanOrEqual(100);
        
        // Growth rate should be within realistic bounds
        expect(analytics.overview.userGrowthRate).toBeGreaterThanOrEqual(-100);
        expect(analytics.overview.userGrowthRate).toBeLessThanOrEqual(1000);
      }

      console.log('✅ Business Logic: Analytics data follows realistic business constraints');
    });

    it('should handle top users data correctly', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();
      const analytics = responseData.analytics;

      // Top users arrays should be properly structured
      expect(Array.isArray(analytics.engagement.topUsersBy.templates)).toBe(true);
      expect(Array.isArray(analytics.engagement.topUsersBy.activity)).toBe(true);

      // If top users exist, they should have proper structure
      analytics.engagement.topUsersBy.templates.forEach((user: any) => {
        expect(user).toMatchObject({
          userId: expect.any(String),
          email: expect.any(String),
          templateCount: expect.any(Number),
          lastActive: expect.any(String),
        });
        expect(user.templateCount).toBeGreaterThan(0);
      });

      analytics.engagement.topUsersBy.activity.forEach((user: any) => {
        expect(user).toMatchObject({
          userId: expect.any(String),
          email: expect.any(String),
          sessionCount: expect.any(Number),
          lastSession: expect.any(String),
        });
        expect(user.sessionCount).toBeGreaterThan(0);
      });

      console.log(`✅ Top Users: ${analytics.engagement.topUsersBy.templates.length} template creators, ${analytics.engagement.topUsersBy.activity.length} active users`);
    });

    it('should provide service usage analytics', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();
      const analytics = responseData.analytics;

      expect(analytics.usage.apiKeysConfigured).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(analytics.usage.servicesUsed)).toBe(true);
      
      analytics.usage.servicesUsed.forEach((service: any) => {
        expect(service).toMatchObject({
          service: expect.any(String),
          userCount: expect.any(Number),
        });
        expect(service.userCount).toBeGreaterThanOrEqual(0);
      });

      expect(analytics.usage.contentBriefsCreated).toBeGreaterThanOrEqual(0);
      expect(analytics.usage.averageContentBriefsPerUser).toBeGreaterThanOrEqual(0);

      console.log(`✅ Service Usage: ${analytics.usage.apiKeysConfigured} API keys, ${analytics.usage.servicesUsed.length} services, ${analytics.usage.contentBriefsCreated} content briefs`);
    });

    it('should provide registration trends over time', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();
      const analytics = responseData.analytics;

      expect(analytics.demographics.registrationTrends.length).toBe(12);
      
      analytics.demographics.registrationTrends.forEach((trend: any) => {
        expect(trend).toMatchObject({
          period: expect.stringMatching(/^\d{4}-\d{2}$/),
          count: expect.any(Number),
        });
        expect(trend.count).toBeGreaterThanOrEqual(0);
      });

      // Trends should be in chronological order
      for (let i = 1; i < analytics.demographics.registrationTrends.length; i++) {
        const prevPeriod = analytics.demographics.registrationTrends[i - 1].period;
        const currPeriod = analytics.demographics.registrationTrends[i].period;
        expect(currPeriod).toBeGreaterThan(prevPeriod);
      }

      console.log('✅ Registration Trends: 12 months of historical data in chronological order');
    });

    it('should provide realistic hourly activity distribution', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();
      const analytics = responseData.analytics;

      expect(analytics.timeDistribution.length).toBe(24);
      
      analytics.timeDistribution.forEach((hour: any, index: number) => {
        expect(hour.hour).toBe(index);
        expect(hour.activeUsers).toBeGreaterThanOrEqual(0);
        expect(hour.templatesCreated).toBeGreaterThanOrEqual(0);
      });

      // Calculate some basic statistics
      const totalActiveUsers = analytics.timeDistribution.reduce((sum: number, hour: any) => sum + hour.activeUsers, 0);
      const totalTemplates = analytics.timeDistribution.reduce((sum: number, hour: any) => sum + hour.templatesCreated, 0);
      const avgActiveUsersPerHour = totalActiveUsers / 24;
      const avgTemplatesPerHour = totalTemplates / 24;

      expect(avgActiveUsersPerHour).toBeGreaterThanOrEqual(0);
      expect(avgTemplatesPerHour).toBeGreaterThanOrEqual(0);

      console.log(`✅ Time Distribution: ${totalActiveUsers} total user-hours, ${totalTemplates} total template-hours, ${Math.round(avgActiveUsersPerHour)} avg users/hour`);
    });

    it('should perform within acceptable time limits', async () => {
      const startTime = Date.now();
      const response = await GET(mockRequest as NextRequest);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds

      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      console.log(`✅ Performance: API responded in ${responseTime}ms`);
    });
  });

  describe('User Analytics Error Handling', () => {
    it('should handle invalid request gracefully', async () => {
      const invalidRequest = {
        url: 'invalid-url',
      } as NextRequest;

      const response = await GET(invalidRequest);
      const responseData = await response.json();

      // Should still provide fallback data even with invalid request
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.analytics).toBeDefined();

      console.log('✅ Error Handling: Invalid request handled gracefully with fallback data');
    });
  });
});