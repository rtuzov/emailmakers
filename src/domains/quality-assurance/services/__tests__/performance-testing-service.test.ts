import { PerformanceTestingService } from '../performance-testing-service';

describe('PerformanceTestingService', () => {
  let service: PerformanceTestingService;

  beforeEach(() => {
    service = new PerformanceTestingService();
  });

  describe('analyzePerformance', () => {
    it('should analyze a simple valid email template', async () => {
      const html = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Email</title>
          </head>
          <body>
            <table width="600" style="margin: 0 auto;">
              <tr>
                <td style="padding: 20px; font-family: Arial, sans-serif; font-size: 16px; color: #333;">
                  <h1 style="color: #2c3e50;">Hello World</h1>
                  <p>This is a test email template.</p>
                  <img src="image.jpg" width="300" height="200" alt="Test image" style="max-width: 100%; height: auto;">
                  <a href="https://example.com" style="color: #3498db; padding: 10px;">Visit our website</a>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      const result = await service.analyzePerformance(html);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.grade).toMatch(/^[A-F]$/);
      expect(result.fileSize.withinEmailLimits).toBe(true);
      expect(result.domComplexity).toBeGreaterThanOrEqual(0);
      expect(result.cssComplexity).toBeGreaterThanOrEqual(0);
      expect(result.imageOptimization).toBeGreaterThanOrEqual(0);
      expect(result.mobileOptimization).toBeGreaterThanOrEqual(0);
      expect(result.cacheability).toBeGreaterThanOrEqual(0);
      expect(result.optimizations).toBeInstanceOf(Array);
    });

    it('should detect file size issues', async () => {
      // Create a large HTML template that exceeds email limits
      const largeContent = 'x'.repeat(50000); // 50KB of content
      const html = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
        <html>
          <body>
            <div style="font-size: 14px;">${largeContent}</div>
          </body>
        </html>
      `;

      const result = await service.analyzePerformance(html);

      expect(result.fileSize.totalSize).toBeGreaterThan(50000);
      // Should have some optimization suggestions for large file
      expect(result.optimizations.length).toBeGreaterThan(0);
    });

    it('should analyze DOM complexity correctly', async () => {
      const complexHtml = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
        <html>
          <body>
            <table>
              <tr><td><table><tr><td><table><tr><td><table><tr><td>
                <div><div><div><div><div><div><div><div>
                  Very nested content
                </div></div></div></div></div></div></div></div>
              </td></tr></table></td></tr></table></td></tr></table></td></tr>
            </table>
          </body>
        </html>
      `;

      const result = await service.analyzePerformance(complexHtml);

      expect(result.domComplexity).toBeGreaterThanOrEqual(0.3); // Should detect high complexity
      // Should have some optimization suggestions for complex DOM
      expect(result.optimizations.length).toBeGreaterThan(0);
    });

    it('should detect CSS complexity issues', async () => {
      const cssHeavyHtml = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
        <html>
          <head>
            <style>
              .header { background: red; padding: 20px; margin: 10px; }
              .content { font-size: 16px; line-height: 1.5; color: #333; }
              .footer { background: blue; text-align: center; }
              @media (max-width: 600px) { .header { padding: 10px; } }
            </style>
          </head>
          <body>
            <div style="position: absolute; transform: rotate(45deg); box-shadow: 2px 2px 5px rgba(0,0,0,0.3);">
              Unsupported CSS properties
            </div>
          </body>
        </html>
              `;

      const result = await service.analyzePerformance(cssHeavyHtml);

      expect(result.cssComplexity).toBeGreaterThan(0.2); // Should detect complexity
      expect(result.optimizations.some(opt => 
        opt.category === 'css' && opt.description.includes('CSS')
      )).toBe(true);
    });

    it('should analyze image optimization', async () => {
      const imageHtml = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
        <html>
          <body>
            <img src="image1.jpg" width="300" height="200" alt="Good image">
            <img src="image2.png">
            <img src="image3.gif" width="100" height="100">
            <img src="large-image.bmp" width="800" height="600" alt="Large image">
          </body>
        </html>
              `;

      const result = await service.analyzePerformance(imageHtml);

      expect(result.imageOptimization).toBeLessThan(1); // Should detect optimization opportunities
      expect(result.optimizations.some(opt => 
        opt.category === 'images'
      )).toBe(true);
    });

    it('should evaluate mobile optimization', async () => {
      const nonMobileHtml = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
        <html>
          <body>
            <table width="800">
              <tr>
                <td style="font-size: 10px;">
                  Very small text that's hard to read on mobile
                </td>
              </tr>
            </table>
            <a href="#" style="font-size: 8px; padding: 2px;">Tiny link</a>
          </body>
        </html>
              `;

      const result = await service.analyzePerformance(nonMobileHtml);

      expect(result.mobileOptimization).toBeLessThan(0.8); // Should detect mobile issues
      expect(result.optimizations.some(opt => 
        opt.description.includes('mobile')
      )).toBe(true);
    });

    it('should calculate accurate loading metrics', async () => {
      const html = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
        <html>
          <body>
            <table>
              <tr><td>Content 1</td></tr>
              <tr><td>Content 2</td></tr>
            </table>
            <img src="image1.jpg" width="200" height="150" alt="Image 1">
            <img src="image2.jpg" width="300" height="200" alt="Image 2">
          </body>
        </html>
      `;

      const result = await service.analyzePerformance(html);

      expect(result.loadingMetrics.estimatedLoadTime).toBeGreaterThan(0);
      expect(result.loadingMetrics.criticalRenderingPath).toBeGreaterThan(0);
      expect(result.loadingMetrics.domReadyTime).toBeGreaterThan(0);
      expect(result.loadingMetrics.imageLoadTime).toBeGreaterThan(0);
      expect(result.loadingMetrics.totalElements).toBeGreaterThan(0);
      expect(result.loadingMetrics.criticalElements).toBeGreaterThan(0);
    });

    it('should analyze cacheability correctly', async () => {
      const externalResourcesHtml = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
        <html>
          <head>
            <link rel="stylesheet" href="external.css">
            <script src="external.js"></script>
          </head>
          <body>
            <div>Content with external resources</div>
          </body>
        </html>
              `;

      const result = await service.analyzePerformance(externalResourcesHtml);

      expect(result.cacheability).toBeLessThan(0.8); // Should penalize external resources
    });

    it('should provide appropriate performance grade', async () => {
      const excellentHtml = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Excellent Email</title>
          </head>
          <body>
            <table width="600" style="margin: 0 auto;">
              <tr>
                <td style="padding: 20px; font-family: Arial, sans-serif; font-size: 16px; color: #333;">
                  <h1 style="color: #2c3e50; font-size: 24px;">Perfect Email</h1>
                  <p style="line-height: 1.6;">Well-optimized content.</p>
                  <img src="optimized.jpg" width="300" height="200" alt="Optimized image" style="max-width: 100%; height: auto;">
                </td>
              </tr>
            </table>
          </body>
        </html>
              `;

      const result = await service.analyzePerformance(excellentHtml);

      expect(result.grade).toMatch(/^[A-C]$/); // Should get a good grade
      expect(result.score).toBeGreaterThan(0.6);
    });

    it('should generate prioritized optimization suggestions', async () => {
      const problematicHtml = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
        <html>
          <head>
            <style>
              .problematic { position: absolute; transform: scale(1.5); }
            </style>
          </head>
          <body>
            <div class="problematic">
              <img src="huge-image.jpg">
              <div style="font-size: 8px;">Tiny text</div>
            </div>
                    </body>
        </html>
        `;

      const result = await service.analyzePerformance(problematicHtml);

      expect(result.optimizations.length).toBeGreaterThan(0);
      
      // Check that optimizations are properly prioritized
      const priorities = result.optimizations.map(opt => opt.priority);
      const criticalIndex = priorities.indexOf('critical');
      const lowIndex = priorities.indexOf('low');
      
      if (criticalIndex !== -1 && lowIndex !== -1) {
        expect(criticalIndex).toBeLessThan(lowIndex);
      }
    });

    it('should handle malformed HTML gracefully', async () => {
      const malformedHtml = `
        <html>
          <body>
            <table>
              <tr>
                <td>Unclosed tag
            <img src="image.jpg">
          </body>
      `;

      const result = await service.analyzePerformance(malformedHtml);

      // Should not throw and should provide some analysis
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.grade).toMatch(/^[A-F]$/);
    });

    it('should handle empty HTML', async () => {
      const emptyHtml = '';

      const result = await service.analyzePerformance(emptyHtml);

      expect(result).toBeDefined();
      expect(result.score).toBe(0);
      expect(result.grade).toBe('F');
      expect(result.fileSize.totalSize).toBe(0);
    });

    it('should calculate file size breakdown correctly', async () => {
      const html = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
        <html>
          <head>
            <style>
              .header { background: red; padding: 20px; }
              .content { font-size: 16px; color: #333; }
            </style>
          </head>
          <body>
            <div style="margin: 10px; padding: 15px;">
              <h1>Title</h1>
              <p>Content paragraph with some text.</p>
              <img src="image.jpg" width="200" height="150" alt="Image">
            </div>
          </body>
        </html>
      `;

      const result = await service.analyzePerformance(html);

      expect(result.fileSize.breakdown.html.percentage).toBeGreaterThan(0);
      expect(result.fileSize.breakdown.css.percentage).toBeGreaterThan(0);
      expect(result.fileSize.breakdown.images.percentage).toBeGreaterThan(0);
      
      // Total percentages should add up reasonably (allowing for rounding)
      const totalPercentage = 
        result.fileSize.breakdown.html.percentage +
        result.fileSize.breakdown.css.percentage +
        result.fileSize.breakdown.images.percentage +
        result.fileSize.breakdown.other.percentage;
      
      expect(totalPercentage).toBeGreaterThan(95);
      expect(totalPercentage).toBeLessThanOrEqual(105); // Allow some rounding error
    });

    it('should detect responsive design features', async () => {
      const responsiveHtml = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @media only screen and (max-width: 600px) {
                .responsive { width: 100% !important; }
              }
            </style>
          </head>
          <body>
            <table width="600" class="responsive">
              <tr>
                <td style="font-size: 16px; padding: 20px;">
                  <img src="image.jpg" width="300" height="200" alt="Image" style="max-width: 100%; height: auto;">
                  <a href="#" style="padding: 12px; font-size: 16px;">Touch-friendly link</a>
                </td>
              </tr>
                        </table>
          </body>
        </html>
        `;

      const result = await service.analyzePerformance(responsiveHtml);

      expect(result.mobileOptimization).toBeGreaterThan(0.8); // Should score well for mobile
    });

    it('should provide specific optimization recommendations', async () => {
      const html = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
        <html>
          <head>
            <style>
              .external { background: url('external-image.jpg'); }
            </style>
          </head>
          <body>
            <div style="position: relative; z-index: 10;">
              <img src="large-image.jpg">
            </div>
          </body>
        </html>
      `;

      const result = await service.analyzePerformance(html);

      expect(result.optimizations.length).toBeGreaterThan(0);
      
      // Should have specific categories of optimizations
      const categories = result.optimizations.map(opt => opt.category);
      expect(categories.some(cat => ['html', 'css', 'images', 'structure', 'caching'].includes(cat))).toBe(true);
      
      // Each optimization should have required fields
      result.optimizations.forEach(opt => {
        expect(opt.description).toBeDefined();
        expect(opt.impact).toBeDefined();
        expect(opt.implementation).toBeDefined();
        expect(opt.estimatedSavings).toBeDefined();
        expect(opt.difficulty).toMatch(/^(easy|medium|hard)$/);
        expect(opt.priority).toMatch(/^(critical|high|medium|low)$/);
      });
    });
  });
}); 