import { Browser, Page, chromium, firefox, webkit } from 'playwright';
import puppeteer from 'puppeteer';
import { Screenshot, ScreenshotStatus, ImageMetadata, StorageInfo } from '../entities/screenshot';
import { EmailClient } from '../entities/email-client';
import { RenderJob } from '../entities/render-job';
import { ClientConfig } from '../value-objects/client-config';
import { StorageService } from '../../../shared/infrastructure/storage/storage-service';
import { MetricsService } from '../../../shared/infrastructure/monitoring/metrics-service';

/**
 * ScreenshotCaptureService - Handles screenshot capture across email clients
 * 
 * This service manages the capture of email screenshots using various
 * automation strategies (Docker, VM, Browser) based on client requirements.
 */

export interface BrowserAutomationDriver {
  navigate(url: string): Promise<void>;
  setViewport(width: number, height: number, devicePixelRatio: number): Promise<void>;
  setDarkMode(enabled: boolean): Promise<void>;
  waitForLoad(timeout: number): Promise<void>;
  takeScreenshot(options: ScreenshotCaptureOptions): Promise<Buffer>;
  cleanup(): Promise<void>;
}

export interface ContainerManager {
  createContainer(image: string, config: ContainerConfig): Promise<string>;
  startContainer(containerId: string): Promise<void>;
  stopContainer(containerId: string): Promise<void>;
  removeContainer(containerId: string): Promise<void>;
  executeCommand(containerId: string, command: string): Promise<string>;
}

export interface VMManager {
  createVM(template: string, config: VMConfig): Promise<string>;
  startVM(vmId: string): Promise<void>;
  stopVM(vmId: string): Promise<void>;
  removeVM(vmId: string): Promise<void>;
  executeCommand(vmId: string, command: string): Promise<string>;
}

export interface StorageProvider {
  upload(buffer: Buffer, key: string, metadata: UploadMetadata): Promise<StorageInfo>;
  generateThumbnail(buffer: Buffer, maxWidth: number, maxHeight: number): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn: number): Promise<string>;
}

export interface ScreenshotCaptureOptions {
  fullPage: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  omitBackground: boolean;
  format: 'png' | 'jpeg' | 'webp';
  quality?: number;
  delay: number;
}

export interface ContainerConfig {
  environment: Record<string, string>;
  volumes: Record<string, string>;
  ports: Record<string, string>;
  memory: string;
  cpu: string;
}

export interface VMConfig {
  memory: string;
  cpu: number;
  disk: string;
  network: string;
}

export interface UploadMetadata {
  contentType: string;
  filename: string;
  jobId: string;
  clientId: string;
  viewport: string;
  darkMode: boolean;
}

export interface CaptureOptions {
  viewports: Array<{ width: number; height: number; name: string }>;
  darkMode?: boolean;
  mobileSimulation?: boolean;
  fullPage?: boolean;
  timeout?: number;
  waitForSelector?: string;
  delay?: number;
}

export interface CaptureResult {
  clientId: string;
  screenshots: Array<{
    viewport: string;
    lightMode?: {
      url: string;
      cdnUrl?: string;
      thumbnails?: Array<{ size: string; url: string }>;
    };
    darkMode?: {
      url: string;
      cdnUrl?: string;
      thumbnails?: Array<{ size: string; url: string }>;
    };
  }>;
  success: boolean;
  error?: string;
  metadata: {
    captureTime: number;
    browserEngine: string;
    userAgent: string;
    timestamp: Date;
  };
}

export interface BrowserInstance {
  browser: Browser;
  type: 'chromium' | 'firefox' | 'webkit';
  version: string;
}

export class ScreenshotCaptureService {
  private browsers: Map<string, BrowserInstance> = new Map();
  private storageService: StorageService;
  private metricsService: MetricsService;

  constructor(
    storageService: StorageService,
    metricsService: MetricsService
  ) {
    this.storageService = storageService;
    this.metricsService = metricsService;
  }

  /**
   * Capture screenshots for a render job
   */
  async captureJobScreenshots(job: RenderJob, clients: EmailClient[]): Promise<Screenshot[]> {
    const screenshots: Screenshot[] = [];

    for (const client of clients) {
      try {
        const clientScreenshots = await this.captureClientScreenshots(job, client);
        screenshots.push(...clientScreenshots);
      } catch (error) {
        console.error(`Failed to capture screenshots for client ${client.id}:`, error);
        
        // Create failed screenshots for tracking
        const failedScreenshots = this.createFailedScreenshots(
          job, 
          client, 
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
        screenshots.push(...failedScreenshots);
      }
    }

    return screenshots;
  }

  /**
   * Capture screenshots for a specific email client
   */
  async captureClientScreenshots(job: RenderJob, client: EmailClient): Promise<Screenshot[]> {
    const screenshots: Screenshot[] = [];
    
    // Create screenshot entities for each viewport and theme combination
    const screenshotEntities = this.createScreenshotEntities(job, client);
    
    // Choose capture strategy based on client automation config
    switch (client.getWorkerType()) {
      case 'docker':
        return await this.captureWithContainer(screenshotEntities, client, job.htmlContent);
      
      case 'vm':
        return await this.captureWithVM(screenshotEntities, client, job.htmlContent);
      
      case 'browser':
        return await this.captureWithBrowser(screenshotEntities, client, job.htmlContent);
      
      default:
        throw new Error(`Unsupported worker type: ${client.getWorkerType()}`);
    }
  }

  /**
   * Capture screenshots using Docker container
   */
  private async captureWithContainer(
    screenshots: Screenshot[], 
    client: EmailClient, 
    htmlContent: string
  ): Promise<Screenshot[]> {
    const containerImage = client.automationConfig.containerImage;
    if (!containerImage) {
      throw new Error('Container image not specified for client');
    }

    const containerId = await this.containerManager.createContainer(containerImage, {
      environment: {
        HTML_CONTENT: htmlContent,
        CLIENT_CONFIG: JSON.stringify(client.toData())
      },
      volumes: {},
      ports: {},
      memory: '2Gi',
      cpu: '1000m'
    });

    try {
      await this.containerManager.startContainer(containerId);

      // Execute setup commands
      for (const command of client.automationConfig.setupCommands || []) {
        await this.containerManager.executeCommand(containerId, command);
      }

      // Capture each screenshot
      for (const screenshot of screenshots) {
        try {
          screenshot.startCapture();
          
          const result = await this.captureScreenshotInContainer(
            containerId,
            screenshot,
            htmlContent
          );

          await this.processAndStoreScreenshot(screenshot, result);
        } catch (error) {
          screenshot.fail(`Container capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Execute teardown commands
      for (const command of client.automationConfig.teardownCommands || []) {
        await this.containerManager.executeCommand(containerId, command);
      }

    } finally {
      await this.containerManager.stopContainer(containerId);
      await this.containerManager.removeContainer(containerId);
    }

    return screenshots;
  }

  /**
   * Capture screenshots using VM
   */
  private async captureWithVM(
    screenshots: Screenshot[], 
    client: EmailClient, 
    htmlContent: string
  ): Promise<Screenshot[]> {
    const vmTemplate = client.automationConfig.vmTemplate;
    if (!vmTemplate) {
      throw new Error('VM template not specified for client');
    }

    const vmId = await this.vmManager.createVM(vmTemplate, {
      memory: '4Gi',
      cpu: 2,
      disk: '20Gi',
      network: 'default'
    });

    try {
      await this.vmManager.startVM(vmId);

      // Wait for VM to boot
      await this.sleep(30000);

      // Execute setup commands
      for (const command of client.automationConfig.setupCommands || []) {
        await this.vmManager.executeCommand(vmId, command);
      }

      // Capture each screenshot
      for (const screenshot of screenshots) {
        try {
          screenshot.startCapture();
          
          const result = await this.captureScreenshotInVM(
            vmId,
            screenshot,
            htmlContent
          );

          await this.processAndStoreScreenshot(screenshot, result);
        } catch (error) {
          screenshot.fail(`VM capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Execute teardown commands
      for (const command of client.automationConfig.teardownCommands || []) {
        await this.vmManager.executeCommand(vmId, command);
      }

    } finally {
      await this.vmManager.stopVM(vmId);
      await this.vmManager.removeVM(vmId);
    }

    return screenshots;
  }

  /**
   * Capture screenshots using browser automation
   */
  private async captureWithBrowser(
    screenshots: Screenshot[], 
    client: EmailClient, 
    htmlContent: string
  ): Promise<Screenshot[]> {
    try {
      // Create temporary HTML file for rendering
      const emailUrl = await this.createTemporaryEmailPreview(htmlContent);

      await this.browserDriver.navigate(emailUrl);
      await this.browserDriver.waitForLoad(client.testConfig.loadWaitTime);

      // Capture each screenshot
      for (const screenshot of screenshots) {
        try {
          screenshot.startCapture();

          // Configure viewport
          await this.browserDriver.setViewport(
            screenshot.viewport.width,
            screenshot.viewport.height,
            screenshot.viewport.devicePixelRatio
          );

          // Configure dark mode
          await this.browserDriver.setDarkMode(screenshot.darkMode);

          // Wait for screenshot delay
          if (screenshot.captureConfig.delay > 0) {
            await this.sleep(screenshot.captureConfig.delay);
          }

          // Capture screenshot
          const imageBuffer = await this.browserDriver.takeScreenshot({
            fullPage: screenshot.captureConfig.fullPage,
            clip: screenshot.captureConfig.clip,
            omitBackground: screenshot.captureConfig.omitBackground,
            format: screenshot.captureConfig.encoding === 'base64' ? 'png' : 'png',
            delay: 0
          });

          const result: CaptureResult = {
            screenshot,
            imageBuffer,
            metadata: await this.analyzeImageBuffer(imageBuffer)
          };

          await this.processAndStoreScreenshot(screenshot, result);

        } catch (error) {
          screenshot.fail(`Browser capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

    } finally {
      await this.browserDriver.cleanup();
    }

    return screenshots;
  }

  /**
   * Create screenshot entities for a client
   */
  private createScreenshotEntities(job: RenderJob, client: EmailClient): Screenshot[] {
    const screenshots: Screenshot[] = [];
    
    for (const viewport of client.getViewports()) {
      // Light mode screenshot
      screenshots.push(Screenshot.create({
        jobId: job.id,
        clientId: client.id,
        clientName: client.displayName,
        viewport,
        darkMode: false,
        maxRetries: client.testConfig.retries
      }));

      // Dark mode screenshot (if supported)
      if (client.supportsDarkMode()) {
        screenshots.push(Screenshot.create({
          jobId: job.id,
          clientId: client.id,
          clientName: client.displayName,
          viewport,
          darkMode: true,
          maxRetries: client.testConfig.retries
        }));
      }
    }

    return screenshots;
  }

  /**
   * Create failed screenshot entities
   */
  private createFailedScreenshots(job: RenderJob, client: EmailClient, errorMessage: string): Screenshot[] {
    const screenshots = this.createScreenshotEntities(job, client);
    
    for (const screenshot of screenshots) {
      screenshot.fail(errorMessage);
    }

    return screenshots;
  }

  /**
   * Process and store screenshot
   */
  private async processAndStoreScreenshot(screenshot: Screenshot, result: CaptureResult): Promise<void> {
    try {
      screenshot.startProcessing();
      screenshot.markCaptured(result.metadata);

      // Generate thumbnail
      const thumbnailBuffer = await this.storageProvider.generateThumbnail(
        result.imageBuffer, 
        300, 
        200
      );

      // Upload original image
      const storageInfo = await this.storageProvider.upload(result.imageBuffer, 
        `screenshots/${screenshot.jobId}/${screenshot.id}.png`,
        {
          contentType: 'image/png',
          filename: `${screenshot.clientName}-${screenshot.getViewportDescription()}-${screenshot.getThemeDescription()}.png`,
          jobId: screenshot.jobId,
          clientId: screenshot.clientId,
          viewport: screenshot.viewport.name,
          darkMode: screenshot.darkMode
        }
      );

      // Upload thumbnail
      const thumbnailInfo = await this.storageProvider.upload(thumbnailBuffer,
        `screenshots/${screenshot.jobId}/${screenshot.id}-thumb.png`,
        {
          contentType: 'image/png',
          filename: `${screenshot.clientName}-${screenshot.getViewportDescription()}-${screenshot.getThemeDescription()}-thumb.png`,
          jobId: screenshot.jobId,
          clientId: screenshot.clientId,
          viewport: screenshot.viewport.name,
          darkMode: screenshot.darkMode
        }
      );

      // Update storage info with thumbnail URL
      const finalStorageInfo: StorageInfo = {
        ...storageInfo,
        thumbnailUrl: thumbnailInfo.url
      };

      screenshot.markReady(finalStorageInfo);

    } catch (error) {
      screenshot.fail(`Storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Capture screenshot in container
   */
  private async captureScreenshotInContainer(
    containerId: string,
    screenshot: Screenshot,
    htmlContent: string
  ): Promise<CaptureResult> {
    // Execute capture command in container
    const captureCommand = this.buildContainerCaptureCommand(screenshot, htmlContent);
    const result = await this.containerManager.executeCommand(containerId, captureCommand);
    
    // Parse result and extract image data
    const imageData = JSON.parse(result);
    const imageBuffer = Buffer.from(imageData.image, 'base64');
    const metadata = await this.analyzeImageBuffer(imageBuffer);

    return {
      screenshot,
      imageBuffer,
      metadata
    };
  }

  /**
   * Capture screenshot in VM
   */
  private async captureScreenshotInVM(
    vmId: string,
    screenshot: Screenshot,
    htmlContent: string
  ): Promise<CaptureResult> {
    // Execute capture command in VM
    const captureCommand = this.buildVMCaptureCommand(screenshot, htmlContent);
    const result = await this.vmManager.executeCommand(vmId, captureCommand);
    
    // Parse result and extract image data
    const imageData = JSON.parse(result);
    const imageBuffer = Buffer.from(imageData.image, 'base64');
    const metadata = await this.analyzeImageBuffer(imageBuffer);

    return {
      screenshot,
      imageBuffer,
      metadata
    };
  }

  /**
   * Analyze image buffer to extract metadata
   */
  private async analyzeImageBuffer(buffer: Buffer): Promise<ImageMetadata> {
    // Use image analysis library (sharp, jimp, etc.)
    // This is a simplified implementation
    return {
      width: 600, // Would be extracted from actual image
      height: 800,
      format: 'png',
      fileSize: buffer.length,
      hasAlpha: true
    };
  }

  /**
   * Create temporary email preview URL
   */
  private async createTemporaryEmailPreview(htmlContent: string): Promise<string> {
    // Implementation would create a temporary preview URL
    // This could be a local server or temporary file
    return `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`;
  }

  /**
   * Build container capture command
   */
  private buildContainerCaptureCommand(screenshot: Screenshot, htmlContent: string): string {
    return `capture-email --viewport ${screenshot.viewport.width}x${screenshot.viewport.height} --dark-mode ${screenshot.darkMode} --format png`;
  }

  /**
   * Build VM capture command
   */
  private buildVMCaptureCommand(screenshot: Screenshot, htmlContent: string): string {
    return `capture-email.exe --viewport ${screenshot.viewport.width}x${screenshot.viewport.height} --dark-mode ${screenshot.darkMode} --format png`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async captureScreenshots(
    jobId: string,
    emailHtml: string,
    clients: EmailClient[],
    options: CaptureOptions
  ): Promise<CaptureResult[]> {
    const results: CaptureResult[] = [];

    for (const client of clients) {
      const startTime = Date.now();
      
      try {
        const result = await this.captureForClient(
          jobId,
          emailHtml,
          client,
          options
        );
        
        results.push(result);
        
        const duration = Date.now() - startTime;
        this.metricsService.recordScreenshotCapture(
          client.id,
          'all-viewports',
          result.success,
          duration
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        results.push({
          clientId: client.id,
          screenshots: [],
          success: false,
          error: errorMessage,
          metadata: {
            captureTime: duration,
            browserEngine: client.renderingEngine || 'chromium',
            userAgent: client.automationConfig.browserConfig?.args?.join(' ') || 'default',
            timestamp: new Date(),
          },
        });

        this.metricsService.recordScreenshotCapture(
          client.id,
          'all-viewports',
          false,
          duration
        );
      }
    }

    return results;
  }

  private async captureForClient(
    jobId: string,
    emailHtml: string,
    client: EmailClient,
    options: CaptureOptions
  ): Promise<CaptureResult> {
    const browserInstance = await this.getBrowserInstance({
      browserEngine: client.renderingEngine === 'blink' ? 'chromium' : client.renderingEngine,
      headless: true
    });
    const screenshots = [];

    for (const viewport of options.viewports) {
      const page = await browserInstance.browser.newPage();
      
      try {
        // Configure viewport
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        // Set user agent if specified
        const userAgent = client.automationConfig.browserConfig?.args?.find(arg => arg.includes('user-agent'));
        if (userAgent) {
          await page.setExtraHTTPHeaders({ 'User-Agent': userAgent.split('=')[1] || 'default' });
        }

        // Configure mobile simulation if needed
        if (options.mobileSimulation && viewport.width <= 768) {
          await page.emulateMedia({ media: 'screen' });
          await page.addStyleTag({
            content: `
              @media (max-width: 768px) {
                body { font-size: 14px !important; }
                table { width: 100% !important; }
                td { display: block !important; width: 100% !important; }
              }
            `
          });
        }

        // Light mode capture
        await page.emulateMedia({ colorScheme: 'light' });
        const lightScreenshot = await this.captureEmailInClient(
          page,
          emailHtml,
          client,
          options
        );

        let lightModeResult;
        if (lightScreenshot) {
          const uploadResult = await this.storageService.uploadScreenshot(
            jobId,
            client.id,
            viewport.name,
            lightScreenshot,
            'light'
          );
          
          lightModeResult = {
            url: uploadResult.url,
            cdnUrl: uploadResult.cdnUrl,
            thumbnails: uploadResult.thumbnails?.map(t => ({
              size: `${t.size.width}x${t.size.height}`,
              url: t.url,
            })),
          };
        }

        // Dark mode capture (if enabled)
        let darkModeResult;
        if (options.darkMode) {
          await page.emulateMedia({ colorScheme: 'dark' });
          const darkScreenshot = await this.captureEmailInClient(
            page,
            emailHtml,
            client,
            options
          );

          if (darkScreenshot) {
            const uploadResult = await this.storageService.uploadScreenshot(
              jobId,
              client.id,
              viewport.name,
              darkScreenshot,
              'dark'
            );
            
            darkModeResult = {
              url: uploadResult.url,
              cdnUrl: uploadResult.cdnUrl,
              thumbnails: uploadResult.thumbnails?.map(t => ({
                size: `${t.size.width}x${t.size.height}`,
                url: t.url,
              })),
            };
          }
        }

        screenshots.push({
          viewport: viewport.name,
          lightMode: lightModeResult,
          darkMode: darkModeResult,
        });

      } finally {
        await page.close();
      }
    }

    return {
      clientId: client.id,
      screenshots,
      success: true,
      metadata: {
        captureTime: Date.now(),
        browserEngine: browserInstance.type,
        userAgent: client.automationConfig.browserConfig?.args?.find(arg => arg.includes('user-agent'))?.split('=')[1] || 'default',
        timestamp: new Date(),
      },
    };
  }

  private async captureEmailInClient(
    page: Page,
    emailHtml: string,
    client: EmailClient,
    options: CaptureOptions
  ): Promise<Buffer | null> {
    try {
      // Create a complete HTML document for email rendering
      const fullHtml = this.wrapEmailHtml(emailHtml, client);
      
      // Navigate to the email content
      await page.setContent(fullHtml, {
        waitUntil: 'networkidle',
        timeout: options.timeout || 30000,
      });

      // Wait for specific selector if provided
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: options.timeout || 30000,
        });
      }

      // Additional delay if specified
      if (options.delay) {
        await page.waitForTimeout(options.delay);
      }

      // Apply client-specific CSS modifications
      // Add any custom CSS if needed
      await page.addStyleTag({
        content: `
          body { font-family: system-ui, -apple-system, sans-serif; }
        `,
      });

      // Take screenshot
      const screenshot = await page.screenshot({
        fullPage: options.fullPage !== false,
        type: 'png',
        animations: 'disabled',
      });

      return screenshot;
    } catch (error) {
      console.error(`Error capturing screenshot for ${client.id}:`, error);
      return null;
    }
  }

  private wrapEmailHtml(emailHtml: string, client: EmailClient): string {
    // Create a wrapper that simulates the email client environment
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Preview - ${client.name}</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background-color: #f5f5f5;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-radius: 0px;
            overflow: hidden;
          }
          
          /* Client-specific CSS resets */
          ${this.getClientSpecificCSS(client)}
          
          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #1a1a1a;
            }
            .email-container {
              background-color: #2d2d2d;
              color: #ffffff;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          ${emailHtml}
        </div>
      </body>
      </html>
    `;
  }

  private getClientSpecificCSS(client: EmailClient): string {
    const cssRules: string[] = [];

    switch (client.id) {
      case 'gmail-web':
        cssRules.push(`
          /* Gmail Web specific styles */
          table { border-collapse: collapse !important; }
          .gmail-specific { display: block !important; }
        `);
        break;
      
      case 'outlook-web':
        cssRules.push(`
          /* Outlook Web specific styles */
          table { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
          img { -ms-interpolation-mode: bicubic !important; }
        `);
        break;
      
      case 'apple-mail':
        cssRules.push(`
          /* Apple Mail specific styles */
          .apple-mail-fix { -webkit-text-size-adjust: 100% !important; }
        `);
        break;
      
      default:
        // Generic email client styles
        cssRules.push(`
          table { border-collapse: collapse !important; }
          img { max-width: 100% !important; height: auto !important; }
        `);
    }

    return cssRules.join('\n');
  }

  private async getBrowserInstance(config: ClientConfig): Promise<BrowserInstance> {
    const browserType = config.browserEngine || 'chromium';
    const cacheKey = `${browserType}-${config.headless !== false ? 'headless' : 'headed'}`;

    if (this.browsers.has(cacheKey)) {
      return this.browsers.get(cacheKey)!;
    }

    let browser: Browser;
    let version: string;

    const launchOptions = {
      headless: config.headless !== false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        ...(config.browserArgs || []),
      ],
    };

    switch (browserType) {
      case 'firefox':
        browser = await firefox.launch(launchOptions);
        version = browser.version();
        break;
      
      case 'webkit':
        browser = await webkit.launch(launchOptions);
        version = browser.version();
        break;
      
      case 'chromium':
      default:
        browser = await chromium.launch(launchOptions);
        version = browser.version();
        break;
    }

    const instance: BrowserInstance = {
      browser,
      type: browserType as 'chromium' | 'firefox' | 'webkit',
      version,
    };

    this.browsers.set(cacheKey, instance);
    return instance;
  }

  async compareScreenshots(
    baseline: Buffer,
    current: Buffer,
    threshold: number = 0.1
  ): Promise<{
    match: boolean;
    difference: number;
    diffImage?: Buffer;
  }> {
    // This would integrate with a visual comparison library like pixelmatch
    // For now, returning a placeholder implementation
    return {
      match: true,
      difference: 0,
    };
  }

  async cleanup(): Promise<void> {
    const promises = Array.from(this.browsers.values()).map(instance => 
      instance.browser.close()
    );
    
    await Promise.all(promises);
    this.browsers.clear();
  }

  async healthCheck(): Promise<{
    browsers: Array<{
      type: string;
      version: string;
      running: boolean;
    }>;
    totalBrowsers: number;
  }> {
    const browsers = [];
    
    for (const [key, instance] of this.browsers) {
      browsers.push({
        type: instance.type,
        version: instance.version,
        running: instance.browser.isConnected(),
      });
    }

    return {
      browsers,
      totalBrowsers: this.browsers.size,
    };
  }
} 