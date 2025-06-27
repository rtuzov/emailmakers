import { z } from 'zod';

/**
 * Value Objects for Render Testing Domain - Client Configuration
 * 
 * These value objects represent immutable data structures for client
 * configuration, viewport settings, and testing parameters.
 */

// Viewport value object
export const ViewportSchema = z.object({
  width: z.number().min(320).max(1920),
  height: z.number().min(568).max(1080),
  devicePixelRatio: z.number().min(1).max(3),
  name: z.string().min(1),
  description: z.string().optional()
});

export type ViewportData = z.infer<typeof ViewportSchema>;

export class Viewport {
  private constructor(private readonly data: ViewportData) {}

  static create(data: ViewportData): Viewport {
    const validated = ViewportSchema.parse(data);
    return new Viewport(validated);
  }

  get width(): number { return this.data.width; }
  get height(): number { return this.data.height; }
  get devicePixelRatio(): number { return this.data.devicePixelRatio; }
  get name(): string { return this.data.name; }
  get description(): string | undefined { return this.data.description; }

  /**
   * Get viewport area in pixels
   */
  getArea(): number {
    return this.data.width * this.data.height;
  }

  /**
   * Get aspect ratio
   */
  getAspectRatio(): number {
    return this.data.width / this.data.height;
  }

  /**
   * Check if viewport is mobile size
   */
  isMobile(): boolean {
    return this.data.width <= 480;
  }

  /**
   * Check if viewport is tablet size
   */
  isTablet(): boolean {
    return this.data.width > 480 && this.data.width <= 1024;
  }

  /**
   * Check if viewport is desktop size
   */
  isDesktop(): boolean {
    return this.data.width > 1024;
  }

  /**
   * Get display string
   */
  toString(): string {
    const dprText = this.data.devicePixelRatio > 1 ? ` @${this.data.devicePixelRatio}x` : '';
    return `${this.data.name} (${this.data.width}×${this.data.height}${dprText})`;
  }

  /**
   * Check equality with another viewport
   */
  equals(other: Viewport): boolean {
    return this.data.width === other.data.width &&
           this.data.height === other.data.height &&
           this.data.devicePixelRatio === other.data.devicePixelRatio &&
           this.data.name === other.data.name;
  }

  /**
   * Export data
   */
  toData(): ViewportData {
    return { ...this.data };
  }
}

// Client capabilities value object
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
  customProperties: z.boolean(),
  maxEmailWidth: z.number().positive().optional(),
  maxEmailHeight: z.number().positive().optional(),
  imageFormats: z.array(z.enum(['jpeg', 'png', 'gif', 'webp', 'svg'])),
  videoSupport: z.boolean(),
  accessibilityFeatures: z.boolean()
});

export type ClientCapabilitiesData = z.infer<typeof ClientCapabilitiesSchema>;

export class ClientCapabilities {
  private constructor(private readonly data: ClientCapabilitiesData) {}

  static create(data: ClientCapabilitiesData): ClientCapabilities {
    const validated = ClientCapabilitiesSchema.parse(data);
    return new ClientCapabilities(validated);
  }

  // Getters for all capabilities
  get darkMode(): boolean { return this.data.darkMode; }
  get responsiveDesign(): boolean { return this.data.responsiveDesign; }
  get css3Support(): boolean { return this.data.css3Support; }
  get webFonts(): boolean { return this.data.webFonts; }
  get backgroundImages(): boolean { return this.data.backgroundImages; }
  get mediaQueries(): boolean { return this.data.mediaQueries; }
  get flexbox(): boolean { return this.data.flexbox; }
  get grid(): boolean { return this.data.grid; }
  get animations(): boolean { return this.data.animations; }
  get interactiveElements(): boolean { return this.data.interactiveElements; }
  get customProperties(): boolean { return this.data.customProperties; }
  get maxEmailWidth(): number | undefined { return this.data.maxEmailWidth; }
  get maxEmailHeight(): number | undefined { return this.data.maxEmailHeight; }
  get imageFormats(): string[] { return this.data.imageFormats; }
  get videoSupport(): boolean { return this.data.videoSupport; }
  get accessibilityFeatures(): boolean { return this.data.accessibilityFeatures; }

  /**
   * Check if client supports a specific capability
   */
  supports(capability: keyof ClientCapabilitiesData): boolean {
    const value = this.data[capability];
    return typeof value === 'boolean' ? value : false;
  }

  /**
   * Check if client supports modern CSS features
   */
  supportsModernCSS(): boolean {
    return this.data.css3Support && 
           this.data.flexbox && 
           this.data.mediaQueries;
  }

  /**
   * Check if client supports responsive design
   */
  supportsResponsive(): boolean {
    return this.data.responsiveDesign && this.data.mediaQueries;
  }

  /**
   * Check if client supports advanced layout
   */
  supportsAdvancedLayout(): boolean {
    return this.data.flexbox || this.data.grid;
  }

  /**
   * Check if client supports image format
   */
  supportsImageFormat(format: string): boolean {
    return this.data.imageFormats.includes(format as any);
  }

  /**
   * Get compatibility score (0-100)
   */
  getCompatibilityScore(): number {
    const features = [
      this.data.css3Support,
      this.data.responsiveDesign,
      this.data.mediaQueries,
      this.data.webFonts,
      this.data.backgroundImages,
      this.data.flexbox,
      this.data.darkMode,
      this.data.accessibilityFeatures,
      this.data.customProperties,
      this.data.grid,
      this.data.animations
    ];

    const supportedFeatures = features.filter(Boolean).length;
    return Math.round((supportedFeatures / features.length) * 100);
  }

  /**
   * Get supported feature count
   */
  getSupportedFeatureCount(): number {
    return Object.values(this.data).filter(value => value === true).length;
  }

  /**
   * Get limitations as text
   */
  getLimitations(): string[] {
    const limitations: string[] = [];

    if (!this.data.css3Support) limitations.push('Limited CSS3 support');
    if (!this.data.responsiveDesign) limitations.push('No responsive design support');
    if (!this.data.webFonts) limitations.push('No web fonts support');
    if (!this.data.flexbox) limitations.push('No Flexbox support');
    if (!this.data.grid) limitations.push('No CSS Grid support');
    if (!this.data.darkMode) limitations.push('No dark mode support');
    if (!this.data.mediaQueries) limitations.push('No media queries support');
    if (!this.data.customProperties) limitations.push('No CSS custom properties');

    return limitations;
  }

  /**
   * Export data
   */
  toData(): ClientCapabilitiesData {
    return { ...this.data };
  }

  /**
   * Check equality with another capabilities object
   */
  equals(other: ClientCapabilities): boolean {
    return JSON.stringify(this.data) === JSON.stringify(other.data);
  }
}

// Test configuration value object
export const TestConfigSchema = z.object({
  enabled: z.boolean(),
  priority: z.number().min(1).max(10),
  timeout: z.number().positive(),
  retries: z.number().min(0).max(5),
  screenshotDelay: z.number().min(0),
  loadWaitTime: z.number().min(0),
  customUserAgent: z.string().optional(),
  customHeaders: z.record(z.string()).optional(),
  darkModeTest: z.boolean(),
  viewports: z.array(ViewportSchema).min(1)
});

export type TestConfigData = z.infer<typeof TestConfigSchema>;

export class TestConfig {
  private constructor(private readonly data: TestConfigData) {}

  static create(data: TestConfigData): TestConfig {
    const validated = TestConfigSchema.parse(data);
    return new TestConfig(validated);
  }

  get enabled(): boolean { return this.data.enabled; }
  get priority(): number { return this.data.priority; }
  get timeout(): number { return this.data.timeout; }
  get retries(): number { return this.data.retries; }
  get screenshotDelay(): number { return this.data.screenshotDelay; }
  get loadWaitTime(): number { return this.data.loadWaitTime; }
  get customUserAgent(): string | undefined { return this.data.customUserAgent; }
  get customHeaders(): Record<string, string> | undefined { return this.data.customHeaders; }
  get darkModeTest(): boolean { return this.data.darkModeTest; }
  get viewports(): ViewportData[] { return this.data.viewports; }

  /**
   * Get total estimated test time
   */
  getEstimatedTestTime(): number {
    const baseTime = this.data.timeout;
    const viewportCount = this.data.viewports.length;
    const darkModeMultiplier = this.data.darkModeTest ? 2 : 1;
    
    return (baseTime * viewportCount * darkModeMultiplier) + 
           this.data.loadWaitTime + 
           this.data.screenshotDelay;
  }

  /**
   * Get total number of test scenarios
   */
  getTotalScenarios(): number {
    const viewportCount = this.data.viewports.length;
    const darkModeMultiplier = this.data.darkModeTest ? 2 : 1;
    return viewportCount * darkModeMultiplier;
  }

  /**
   * Check if configuration is high priority
   */
  isHighPriority(): boolean {
    return this.data.priority >= 8;
  }

  /**
   * Check if configuration supports responsive testing
   */
  supportsResponsiveTesting(): boolean {
    return this.data.viewports.length > 1;
  }

  /**
   * Get viewport by name
   */
  getViewport(name: string): ViewportData | undefined {
    return this.data.viewports.find(v => v.name === name);
  }

  /**
   * Get mobile viewports
   */
  getMobileViewports(): ViewportData[] {
    return this.data.viewports.filter(v => v.width <= 480);
  }

  /**
   * Get tablet viewports
   */
  getTabletViewports(): ViewportData[] {
    return this.data.viewports.filter(v => v.width > 480 && v.width <= 1024);
  }

  /**
   * Get desktop viewports
   */
  getDesktopViewports(): ViewportData[] {
    return this.data.viewports.filter(v => v.width > 1024);
  }

  /**
   * Export data
   */
  toData(): TestConfigData {
    return { ...this.data };
  }

  /**
   * Create updated configuration
   */
  withUpdates(updates: Partial<TestConfigData>): TestConfig {
    return TestConfig.create({ ...this.data, ...updates });
  }

  /**
   * Enable/disable testing
   */
  setEnabled(enabled: boolean): TestConfig {
    return this.withUpdates({ enabled });
  }

  /**
   * Update priority
   */
  setPriority(priority: number): TestConfig {
    return this.withUpdates({ priority });
  }

  /**
   * Add viewport
   */
  addViewport(viewport: ViewportData): TestConfig {
    return this.withUpdates({ 
      viewports: [...this.data.viewports, viewport] 
    });
  }

  /**
   * Remove viewport by name
   */
  removeViewport(name: string): TestConfig {
    return this.withUpdates({ 
      viewports: this.data.viewports.filter(v => v.name !== name) 
    });
  }
}

// Automation configuration value object
export const AutomationConfigSchema = z.object({
  workerType: z.enum(['docker', 'vm', 'browser']),
  containerImage: z.string().optional(),
  vmTemplate: z.string().optional(),
  browserConfig: z.object({
    browser: z.enum(['chrome', 'firefox', 'safari', 'edge']).optional(),
    headless: z.boolean(),
    args: z.array(z.string()).optional()
  }).optional(),
  setupCommands: z.array(z.string()).optional(),
  teardownCommands: z.array(z.string()).optional(),
  environment: z.record(z.string()).optional(),
  resourceLimits: z.object({
    memory: z.string().optional(), // e.g., "2Gi"
    cpu: z.string().optional(),    // e.g., "1000m"
    timeout: z.number().optional()  // seconds
  }).optional()
});

export type AutomationConfigData = z.infer<typeof AutomationConfigSchema>;

export class AutomationConfig {
  private constructor(private readonly data: AutomationConfigData) {}

  static create(data: AutomationConfigData): AutomationConfig {
    const validated = AutomationConfigSchema.parse(data);
    return new AutomationConfig(validated);
  }

  get workerType(): 'docker' | 'vm' | 'browser' { return this.data.workerType; }
  get containerImage(): string | undefined { return this.data.containerImage; }
  get vmTemplate(): string | undefined { return this.data.vmTemplate; }
  get browserConfig(): AutomationConfigData['browserConfig'] { return this.data.browserConfig; }
  get setupCommands(): string[] | undefined { return this.data.setupCommands; }
  get teardownCommands(): string[] | undefined { return this.data.teardownCommands; }
  get environment(): Record<string, string> | undefined { return this.data.environment; }
  get resourceLimits(): AutomationConfigData['resourceLimits'] { return this.data.resourceLimits; }

  /**
   * Check if configuration uses containers
   */
  usesContainers(): boolean {
    return this.data.workerType === 'docker';
  }

  /**
   * Check if configuration uses VMs
   */
  usesVMs(): boolean {
    return this.data.workerType === 'vm';
  }

  /**
   * Check if configuration uses browser automation
   */
  usesBrowser(): boolean {
    return this.data.workerType === 'browser';
  }

  /**
   * Check if configuration is headless
   */
  isHeadless(): boolean {
    return this.data.browserConfig?.headless ?? true;
  }

  /**
   * Get browser type
   */
  getBrowser(): string | undefined {
    return this.data.browserConfig?.browser;
  }

  /**
   * Get browser arguments
   */
  getBrowserArgs(): string[] {
    return this.data.browserConfig?.args ?? [];
  }

  /**
   * Check if configuration has resource limits
   */
  hasResourceLimits(): boolean {
    return this.data.resourceLimits !== undefined;
  }

  /**
   * Get setup command count
   */
  getSetupCommandCount(): number {
    return this.data.setupCommands?.length ?? 0;
  }

  /**
   * Get teardown command count
   */
  getTeardownCommandCount(): number {
    return this.data.teardownCommands?.length ?? 0;
  }

  /**
   * Export data
   */
  toData(): AutomationConfigData {
    return { ...this.data };
  }

  /**
   * Create updated configuration
   */
  withUpdates(updates: Partial<AutomationConfigData>): AutomationConfig {
    return AutomationConfig.create({ ...this.data, ...updates });
  }

  /**
   * Set worker type
   */
  setWorkerType(workerType: 'docker' | 'vm' | 'browser'): AutomationConfig {
    return this.withUpdates({ workerType });
  }

  /**
   * Set container image
   */
  setContainerImage(image: string): AutomationConfig {
    return this.withUpdates({ containerImage: image });
  }

  /**
   * Set VM template
   */
  setVMTemplate(template: string): AutomationConfig {
    return this.withUpdates({ vmTemplate: template });
  }

  /**
   * Add setup command
   */
  addSetupCommand(command: string): AutomationConfig {
    const commands = this.data.setupCommands ?? [];
    return this.withUpdates({ setupCommands: [...commands, command] });
  }

  /**
   * Add teardown command
   */
  addTeardownCommand(command: string): AutomationConfig {
    const commands = this.data.teardownCommands ?? [];
    return this.withUpdates({ teardownCommands: [...commands, command] });
  }
}

// Predefined viewport configurations
export class ViewportPresets {
  static readonly MOBILE_PORTRAIT = Viewport.create({
    width: 375,
    height: 667,
    devicePixelRatio: 2,
    name: 'mobile-portrait',
    description: 'iPhone 8 Portrait'
  });

  static readonly MOBILE_LANDSCAPE = Viewport.create({
    width: 667,
    height: 375,
    devicePixelRatio: 2,
    name: 'mobile-landscape',
    description: 'iPhone 8 Landscape'
  });

  static readonly TABLET_PORTRAIT = Viewport.create({
    width: 768,
    height: 1024,
    devicePixelRatio: 2,
    name: 'tablet-portrait',
    description: 'iPad Portrait'
  });

  static readonly TABLET_LANDSCAPE = Viewport.create({
    width: 1024,
    height: 768,
    devicePixelRatio: 2,
    name: 'tablet-landscape',
    description: 'iPad Landscape'
  });

  static readonly DESKTOP_SMALL = Viewport.create({
    width: 1024,
    height: 768,
    devicePixelRatio: 1,
    name: 'desktop-small',
    description: 'Small Desktop'
  });

  static readonly DESKTOP_MEDIUM = Viewport.create({
    width: 1366,
    height: 768,
    devicePixelRatio: 1,
    name: 'desktop-medium',
    description: 'Medium Desktop'
  });

  static readonly DESKTOP_LARGE = Viewport.create({
    width: 1920,
    height: 1080,
    devicePixelRatio: 1,
    name: 'desktop-large',
    description: 'Large Desktop'
  });

  static readonly EMAIL_STANDARD = Viewport.create({
    width: 600,
    height: 800,
    devicePixelRatio: 1,
    name: 'email-standard',
    description: 'Standard Email Width'
  });

  /**
   * Get all preset viewports
   */
  static getAll(): Viewport[] {
    return [
      this.MOBILE_PORTRAIT,
      this.MOBILE_LANDSCAPE,
      this.TABLET_PORTRAIT,
      this.TABLET_LANDSCAPE,
      this.DESKTOP_SMALL,
      this.DESKTOP_MEDIUM,
      this.DESKTOP_LARGE,
      this.EMAIL_STANDARD
    ];
  }

  /**
   * Get mobile viewports
   */
  static getMobile(): Viewport[] {
    return [this.MOBILE_PORTRAIT, this.MOBILE_LANDSCAPE];
  }

  /**
   * Get tablet viewports
   */
  static getTablet(): Viewport[] {
    return [this.TABLET_PORTRAIT, this.TABLET_LANDSCAPE];
  }

  /**
   * Get desktop viewports
   */
  static getDesktop(): Viewport[] {
    return [this.DESKTOP_SMALL, this.DESKTOP_MEDIUM, this.DESKTOP_LARGE];
  }

  /**
   * Get responsive testing set
   */
  static getResponsiveSet(): Viewport[] {
    return [
      this.MOBILE_PORTRAIT,
      this.TABLET_PORTRAIT,
      this.DESKTOP_MEDIUM
    ];
  }

  /**
   * Get email testing set
   */
  static getEmailSet(): Viewport[] {
    return [
      this.EMAIL_STANDARD,
      this.MOBILE_PORTRAIT
    ];
  }
} 