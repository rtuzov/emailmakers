import { z } from 'zod';

/**
 * EmailClient Entity - Represents email client configurations and capabilities
 * 
 * This entity defines the characteristics and capabilities of different email clients
 * for render testing, including supported features, rendering engines, and test configurations.
 */

// Email client types
export const ClientType = {
  WEB: 'web',
  DESKTOP: 'desktop',
  MOBILE: 'mobile'
} as const;

export type ClientTypeType = typeof ClientType[keyof typeof ClientType];

// Rendering engines
export const RenderingEngine = {
  WEBKIT: 'webkit',
  BLINK: 'blink',
  GECKO: 'gecko',
  TRIDENT: 'trident',
  WORD: 'word', // Outlook uses Word rendering engine
  NATIVE: 'native' // Native mobile email clients
} as const;

export type RenderingEngineType = typeof RenderingEngine[keyof typeof RenderingEngine];

// Platform types
export const Platform = {
  WINDOWS: 'windows',
  MACOS: 'macos',
  LINUX: 'linux',
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web'
} as const;

export type PlatformType = typeof Platform[keyof typeof Platform];

// Client capabilities schema
export const ClientCapabilitiesSchema = z.object({
  darkMode: z.boolean(),
  responsiveDesign: z.boolean(),
  css3Support: z.boolean(),
  webFonts: z.boolean(),
  backgroundImages: z.boolean(),
  mediaQueries: z.boolean(),
  flexbox: z.boolean(),
  grid: z.boolean(),
  animations: z.boolean(),
  interactiveElements: z.boolean(),
  customProperties: z.boolean(), // CSS custom properties (variables)
  maxEmailWidth: z.number().positive().optional(),
  maxEmailHeight: z.number().positive().optional(),
  imageFormats: z.array(z.enum(['jpeg', 'png', 'gif', 'webp', 'svg'])),
  videoSupport: z.boolean(),
  accessibilityFeatures: z.boolean()
});

export type ClientCapabilities = z.infer<typeof ClientCapabilitiesSchema>;

// Viewport configuration for testing
export const ViewportConfigSchema = z.object({
  width: z.number().min(320).max(1920),
  height: z.number().min(568).max(1080),
  devicePixelRatio: z.number().min(1).max(3),
  name: z.string(),
  isDefault: z.boolean().default(false)
});

export type ViewportConfig = z.infer<typeof ViewportConfigSchema>;

// Test configuration for specific client
export const ClientTestConfigSchema = z.object({
  enabled: z.boolean().default(true),
  priority: z.number().min(1).max(10).default(5),
  timeout: z.number().positive().default(30000), // milliseconds
  retries: z.number().min(0).max(3).default(1),
  screenshotDelay: z.number().min(0).default(2000), // milliseconds
  loadWaitTime: z.number().min(0).default(5000), // milliseconds
  customUserAgent: z.string().optional(),
  customHeaders: z.record(z.string()).optional(),
  darkModeTest: z.boolean().default(true),
  viewports: z.array(ViewportConfigSchema).min(1)
});

export type ClientTestConfig = z.infer<typeof ClientTestConfigSchema>;

// Main EmailClient entity schema
export const EmailClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  vendor: z.string(),
  version: z.string().optional(),
  type: z.enum([ClientType.WEB, ClientType.DESKTOP, ClientType.MOBILE]),
  platform: z.enum([
    Platform.WINDOWS,
    Platform.MACOS,
    Platform.LINUX,
    Platform.IOS,
    Platform.ANDROID,
    Platform.WEB
  ]),
  renderingEngine: z.enum([
    RenderingEngine.WEBKIT,
    RenderingEngine.BLINK,
    RenderingEngine.GECKO,
    RenderingEngine.TRIDENT,
    RenderingEngine.WORD,
    RenderingEngine.NATIVE
  ]),
  marketShare: z.number().min(0).max(100).optional(), // percentage
  capabilities: ClientCapabilitiesSchema,
  testConfig: ClientTestConfigSchema,
  automationConfig: z.object({
    workerType: z.enum(['docker', 'vm', 'browser']),
    containerImage: z.string().optional(),
    vmTemplate: z.string().optional(),
    browserConfig: z.object({
      browser: z.enum(['chrome', 'firefox', 'safari', 'edge']).optional(),
      headless: z.boolean().default(true),
      args: z.array(z.string()).optional()
    }).optional(),
    setupCommands: z.array(z.string()).optional(),
    teardownCommands: z.array(z.string()).optional()
  }),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type EmailClientData = z.infer<typeof EmailClientSchema>;

/**
 * EmailClient Domain Entity
 * 
 * Represents an email client with its capabilities, configuration, and automation setup.
 * Provides business logic for client management and test configuration.
 */
export class EmailClient {
  private constructor(private data: EmailClientData) {
    this.validateInvariants();
  }

  /**
   * Factory method to create a new EmailClient
   */
  static create(params: {
    id: string;
    name: string;
    displayName: string;
    vendor: string;
    type: ClientTypeType;
    platform: PlatformType;
    renderingEngine: RenderingEngineType;
    capabilities: ClientCapabilities;
    testConfig: ClientTestConfig;
    automationConfig: EmailClientData['automationConfig'];
    version?: string;
    marketShare?: number;
    tags?: string[];
    notes?: string;
  }): EmailClient {
    const now = new Date();

    const clientData: EmailClientData = {
      id: params.id,
      name: params.name,
      displayName: params.displayName,
      vendor: params.vendor,
      version: params.version,
      type: params.type,
      platform: params.platform,
      renderingEngine: params.renderingEngine,
      marketShare: params.marketShare,
      capabilities: params.capabilities,
      testConfig: params.testConfig,
      automationConfig: params.automationConfig,
      isActive: true,
      tags: params.tags || [],
      notes: params.notes,
      createdAt: now,
      updatedAt: now
    };

    return new EmailClient(clientData);
  }

  /**
   * Factory method to reconstruct EmailClient from persistence
   */
  static fromData(data: EmailClientData): EmailClient {
    return new EmailClient(data);
  }

  /**
   * Domain invariants validation
   */
  private validateInvariants(): void {
    if (this.data.type === ClientType.WEB && this.data.platform !== Platform.WEB) {
      throw new Error('Web clients must have web platform');
    }

    if (this.data.type === ClientType.MOBILE && 
        ![Platform.IOS, Platform.ANDROID].includes(this.data.platform as any)) {
      throw new Error('Mobile clients must have iOS or Android platform');
    }

    if (this.data.testConfig.viewports.length === 0) {
      throw new Error('At least one viewport must be configured');
    }

    if (this.data.marketShare !== undefined && 
        (this.data.marketShare < 0 || this.data.marketShare > 100)) {
      throw new Error('Market share must be between 0 and 100');
    }
  }

  // Getters
  get id(): string { return this.data.id; }
  get name(): string { return this.data.name; }
  get displayName(): string { return this.data.displayName; }
  get vendor(): string { return this.data.vendor; }
  get version(): string | undefined { return this.data.version; }
  get type(): ClientTypeType { return this.data.type; }
  get platform(): PlatformType { return this.data.platform; }
  get renderingEngine(): RenderingEngineType { return this.data.renderingEngine; }
  get marketShare(): number | undefined { return this.data.marketShare; }
  get capabilities(): ClientCapabilities { return this.data.capabilities; }
  get testConfig(): ClientTestConfig { return this.data.testConfig; }
  get automationConfig(): EmailClientData['automationConfig'] { return this.data.automationConfig; }
  get isActive(): boolean { return this.data.isActive; }
  get tags(): string[] { return this.data.tags; }
  get notes(): string | undefined { return this.data.notes; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  /**
   * Business logic methods
   */

  /**
   * Check if client supports a specific feature
   */
  supportsFeature(feature: keyof ClientCapabilities): boolean {
    return this.data.capabilities[feature] as boolean;
  }

  /**
   * Check if client supports dark mode testing
   */
  supportsDarkMode(): boolean {
    return this.data.capabilities.darkMode && this.data.testConfig.darkModeTest;
  }

  /**
   * Get default viewport for this client
   */
  getDefaultViewport(): ViewportConfig {
    const defaultViewport = this.data.testConfig.viewports.find(v => v.isDefault);
    return defaultViewport || this.data.testConfig.viewports[0];
  }

  /**
   * Get all viewports for testing
   */
  getViewports(): ViewportConfig[] {
    return this.data.testConfig.viewports;
  }

  /**
   * Check if client is suitable for responsive design testing
   */
  isResponsiveCapable(): boolean {
    return this.data.capabilities.responsiveDesign && 
           this.data.capabilities.mediaQueries &&
           this.data.testConfig.viewports.length > 1;
  }

  /**
   * Get automation worker type
   */
  getWorkerType(): 'docker' | 'vm' | 'browser' {
    return this.data.automationConfig.workerType;
  }

  /**
   * Check if client requires VM for testing
   */
  requiresVM(): boolean {
    return this.data.automationConfig.workerType === 'vm';
  }

  /**
   * Check if client can use containerized testing
   */
  canUseContainer(): boolean {
    return this.data.automationConfig.workerType === 'docker';
  }

  /**
   * Get estimated test duration based on configuration
   */
  getEstimatedTestDuration(): number {
    const baseTime = this.data.testConfig.timeout;
    const viewportCount = this.data.testConfig.viewports.length;
    const darkModeMultiplier = this.supportsDarkMode() ? 2 : 1;
    
    return (baseTime * viewportCount * darkModeMultiplier) + 
           this.data.testConfig.loadWaitTime + 
           this.data.testConfig.screenshotDelay;
  }

  /**
   * Check if client is high priority for testing
   */
  isHighPriority(): boolean {
    return this.data.testConfig.priority >= 8 || 
           (this.data.marketShare !== undefined && this.data.marketShare >= 20);
  }

  /**
   * Get client compatibility score based on capabilities
   */
  getCompatibilityScore(): number {
    const capabilities = this.data.capabilities;
    const features = [
      capabilities.css3Support,
      capabilities.responsiveDesign,
      capabilities.mediaQueries,
      capabilities.webFonts,
      capabilities.backgroundImages,
      capabilities.flexbox,
      capabilities.darkMode,
      capabilities.accessibilityFeatures
    ];

    const supportedFeatures = features.filter(Boolean).length;
    return Math.round((supportedFeatures / features.length) * 100);
  }

  /**
   * Activate client for testing
   */
  activate(): void {
    this.data.isActive = true;
    this.data.updatedAt = new Date();
  }

  /**
   * Deactivate client from testing
   */
  deactivate(): void {
    this.data.isActive = false;
    this.data.updatedAt = new Date();
  }

  /**
   * Update test configuration
   */
  updateTestConfig(config: Partial<ClientTestConfig>): EmailClient {
    const updatedConfig = { ...this.data.testConfig, ...config };
    
    const updatedData = {
      ...this.data,
      testConfig: updatedConfig,
      updatedAt: new Date()
    };

    return new EmailClient(updatedData);
  }

  /**
   * Update capabilities
   */
  updateCapabilities(capabilities: Partial<ClientCapabilities>): EmailClient {
    const updatedCapabilities = { ...this.data.capabilities, ...capabilities };
    
    const updatedData = {
      ...this.data,
      capabilities: updatedCapabilities,
      updatedAt: new Date()
    };

    return new EmailClient(updatedData);
  }

  /**
   * Add tag to client
   */
  addTag(tag: string): EmailClient {
    if (this.data.tags.includes(tag)) {
      return this;
    }

    const updatedData = {
      ...this.data,
      tags: [...this.data.tags, tag],
      updatedAt: new Date()
    };

    return new EmailClient(updatedData);
  }

  /**
   * Remove tag from client
   */
  removeTag(tag: string): EmailClient {
    const updatedData = {
      ...this.data,
      tags: this.data.tags.filter(t => t !== tag),
      updatedAt: new Date()
    };

    return new EmailClient(updatedData);
  }

  /**
   * Check if client has specific tag
   */
  hasTag(tag: string): boolean {
    return this.data.tags.includes(tag);
  }

  /**
   * Get client summary for display
   */
  getSummary(): {
    id: string;
    displayName: string;
    type: string;
    platform: string;
    compatibilityScore: number;
    isActive: boolean;
    supportsDarkMode: boolean;
    estimatedDuration: number;
  } {
    return {
      id: this.data.id,
      displayName: this.data.displayName,
      type: this.data.type,
      platform: this.data.platform,
      compatibilityScore: this.getCompatibilityScore(),
      isActive: this.data.isActive,
      supportsDarkMode: this.supportsDarkMode(),
      estimatedDuration: this.getEstimatedTestDuration()
    };
  }

  /**
   * Export entity data for persistence
   */
  toData(): EmailClientData {
    return { ...this.data };
  }

  /**
   * Create a copy with updated data
   */
  update(updates: Partial<Omit<EmailClientData, 'id' | 'createdAt'>>): EmailClient {
    const updatedData = {
      ...this.data,
      ...updates,
      updatedAt: new Date()
    };

    return new EmailClient(updatedData);
  }
}

/**
 * Predefined email client configurations
 */
export class EmailClientFactory {
  /**
   * Create Gmail web client configuration
   */
  static createGmail(): EmailClient {
    return EmailClient.create({
      id: 'gmail-web',
      name: 'gmail',
      displayName: 'Gmail (Web)',
      vendor: 'Google',
      type: ClientType.WEB,
      platform: Platform.WEB,
      renderingEngine: RenderingEngine.BLINK,
      marketShare: 35,
      capabilities: {
        darkMode: true,
        responsiveDesign: true,
        css3Support: true,
        webFonts: true,
        backgroundImages: true,
        mediaQueries: true,
        flexbox: true,
        grid: false,
        animations: true,
        interactiveElements: true,
        customProperties: false,
        maxEmailWidth: 600,
        imageFormats: ['jpeg', 'png', 'gif', 'webp'],
        videoSupport: false,
        accessibilityFeatures: true
      },
      testConfig: {
        enabled: true,
        priority: 9,
        timeout: 30000,
        retries: 2,
        screenshotDelay: 2000,
        loadWaitTime: 3000,
        darkModeTest: true,
        viewports: [
          { width: 600, height: 800, devicePixelRatio: 1, name: 'desktop', isDefault: true },
          { width: 375, height: 667, devicePixelRatio: 2, name: 'mobile', isDefault: false }
        ]
      },
      automationConfig: {
        workerType: 'docker',
        containerImage: 'render-testing/gmail-chrome:latest',
        browserConfig: {
          browser: 'chrome',
          headless: true,
          args: ['--no-sandbox', '--disable-dev-shm-usage']
        }
      },
      tags: ['popular', 'web', 'google', 'responsive']
    });
  }

  /**
   * Create Outlook web client configuration
   */
  static createOutlookWeb(): EmailClient {
    return EmailClient.create({
      id: 'outlook-web',
      name: 'outlook-web',
      displayName: 'Outlook.com (Web)',
      vendor: 'Microsoft',
      type: ClientType.WEB,
      platform: Platform.WEB,
      renderingEngine: RenderingEngine.BLINK,
      marketShare: 15,
      capabilities: {
        darkMode: true,
        responsiveDesign: true,
        css3Support: true,
        webFonts: true,
        backgroundImages: true,
        mediaQueries: true,
        flexbox: true,
        grid: false,
        animations: true,
        interactiveElements: true,
        customProperties: false,
        maxEmailWidth: 600,
        imageFormats: ['jpeg', 'png', 'gif'],
        videoSupport: false,
        accessibilityFeatures: true
      },
      testConfig: {
        enabled: true,
        priority: 8,
        timeout: 35000,
        retries: 2,
        screenshotDelay: 2500,
        loadWaitTime: 4000,
        darkModeTest: true,
        viewports: [
          { width: 600, height: 800, devicePixelRatio: 1, name: 'desktop', isDefault: true },
          { width: 375, height: 667, devicePixelRatio: 2, name: 'mobile', isDefault: false }
        ]
      },
      automationConfig: {
        workerType: 'docker',
        containerImage: 'render-testing/outlook-web-chrome:latest',
        browserConfig: {
          browser: 'chrome',
          headless: true,
          args: ['--no-sandbox', '--disable-dev-shm-usage']
        }
      },
      tags: ['popular', 'web', 'microsoft', 'responsive']
    });
  }

  /**
   * Create Outlook desktop client configuration
   */
  static createOutlookDesktop(): EmailClient {
    return EmailClient.create({
      id: 'outlook-2019',
      name: 'outlook-2019',
      displayName: 'Outlook 2019 (Desktop)',
      vendor: 'Microsoft',
      version: '2019',
      type: ClientType.DESKTOP,
      platform: Platform.WINDOWS,
      renderingEngine: RenderingEngine.WORD,
      marketShare: 25,
      capabilities: {
        darkMode: false,
        responsiveDesign: false,
        css3Support: false,
        webFonts: false,
        backgroundImages: true,
        mediaQueries: false,
        flexbox: false,
        grid: false,
        animations: false,
        interactiveElements: false,
        customProperties: false,
        maxEmailWidth: 600,
        imageFormats: ['jpeg', 'png', 'gif'],
        videoSupport: false,
        accessibilityFeatures: false
      },
      testConfig: {
        enabled: true,
        priority: 9,
        timeout: 45000,
        retries: 3,
        screenshotDelay: 3000,
        loadWaitTime: 5000,
        darkModeTest: false,
        viewports: [
          { width: 600, height: 800, devicePixelRatio: 1, name: 'desktop', isDefault: true }
        ]
      },
      automationConfig: {
        workerType: 'vm',
        vmTemplate: 'windows-outlook-2019',
        setupCommands: [
          'powershell -Command "Start-Process outlook"',
          'timeout /t 10'
        ],
        teardownCommands: [
          'taskkill /f /im outlook.exe'
        ]
      },
      tags: ['popular', 'desktop', 'microsoft', 'legacy']
    });
  }

  /**
   * Create Yandex Mail client configuration
   */
  static createYandexMail(): EmailClient {
    return EmailClient.create({
      id: 'yandex-mail',
      name: 'yandex-mail',
      displayName: 'Яндекс.Почта (Web)',
      vendor: 'Yandex',
      type: ClientType.WEB,
      platform: Platform.WEB,
      renderingEngine: RenderingEngine.BLINK,
      marketShare: 8,
      capabilities: {
        darkMode: true,
        responsiveDesign: true,
        css3Support: true,
        webFonts: true,
        backgroundImages: true,
        mediaQueries: true,
        flexbox: false, // Limited support
        grid: false,
        animations: true,
        interactiveElements: true,
        customProperties: false,
        maxEmailWidth: 600,
        imageFormats: ['jpeg', 'png', 'gif'],
        videoSupport: false,
        accessibilityFeatures: true
      },
      testConfig: {
        enabled: true,
        priority: 8,
        timeout: 35000,
        retries: 2,
        screenshotDelay: 2500,
        loadWaitTime: 4000,
        darkModeTest: true,
        viewports: [
          { width: 600, height: 800, devicePixelRatio: 1, name: 'desktop', isDefault: true },
          { width: 375, height: 667, devicePixelRatio: 2, name: 'mobile', isDefault: false }
        ]
      },
      automationConfig: {
        workerType: 'docker',
        containerImage: 'render-testing/yandex-mail-chrome:latest',
        browserConfig: {
          browser: 'chrome',
          headless: true,
          args: ['--no-sandbox', '--disable-dev-shm-usage']
        }
      },
      tags: ['popular', 'web', 'yandex', 'russian', 'responsive']
    });
  }

  /**
   * Create Mail.ru client configuration
   */
  static createMailRu(): EmailClient {
    return EmailClient.create({
      id: 'mail-ru',
      name: 'mail-ru',
      displayName: 'Mail.ru (Web)',
      vendor: 'Mail.Ru Group',
      type: ClientType.WEB,
      platform: Platform.WEB,
      renderingEngine: RenderingEngine.BLINK,
      marketShare: 5,
      capabilities: {
        darkMode: true,
        responsiveDesign: true,
        css3Support: true,
        webFonts: true,
        backgroundImages: true,
        mediaQueries: true,
        flexbox: false, // Limited support
        grid: false,
        animations: true,
        interactiveElements: true,
        customProperties: false,
        maxEmailWidth: 600,
        imageFormats: ['jpeg', 'png', 'gif'],
        videoSupport: false,
        accessibilityFeatures: true
      },
      testConfig: {
        enabled: true,
        priority: 7,
        timeout: 35000,
        retries: 2,
        screenshotDelay: 2500,
        loadWaitTime: 4000,
        darkModeTest: true,
        viewports: [
          { width: 600, height: 800, devicePixelRatio: 1, name: 'desktop', isDefault: true },
          { width: 375, height: 667, devicePixelRatio: 2, name: 'mobile', isDefault: false }
        ]
      },
      automationConfig: {
        workerType: 'docker',
        containerImage: 'render-testing/mail-ru-chrome:latest',
        browserConfig: {
          browser: 'chrome',
          headless: true,
          args: ['--no-sandbox', '--disable-dev-shm-usage']
        }
      },
      tags: ['web', 'mail-ru', 'russian', 'responsive']
    });
  }

  /**
   * Create Apple Mail client configuration
   */
  static createAppleMail(): EmailClient {
    return EmailClient.create({
      id: 'apple-mail',
      name: 'apple-mail',
      displayName: 'Apple Mail (macOS)',
      vendor: 'Apple',
      type: ClientType.DESKTOP,
      platform: Platform.MACOS,
      renderingEngine: RenderingEngine.WEBKIT,
      marketShare: 10,
      capabilities: {
        darkMode: true,
        responsiveDesign: true,
        css3Support: true,
        webFonts: true,
        backgroundImages: true,
        mediaQueries: true,
        flexbox: true,
        grid: true,
        animations: true,
        interactiveElements: true,
        customProperties: true,
        maxEmailWidth: 600,
        imageFormats: ['jpeg', 'png', 'gif', 'webp', 'svg'],
        videoSupport: true,
        accessibilityFeatures: true
      },
      testConfig: {
        enabled: true,
        priority: 7,
        timeout: 40000,
        retries: 2,
        screenshotDelay: 2000,
        loadWaitTime: 4000,
        darkModeTest: true,
        viewports: [
          { width: 600, height: 800, devicePixelRatio: 2, name: 'desktop', isDefault: true }
        ]
      },
      automationConfig: {
        workerType: 'vm',
        vmTemplate: 'macos-mail',
        setupCommands: [
          'open -a Mail',
          'sleep 5'
        ],
        teardownCommands: [
          'osascript -e "quit app \\"Mail\\""'
        ]
      },
      tags: ['desktop', 'apple', 'webkit', 'modern']
    });
  }
} 