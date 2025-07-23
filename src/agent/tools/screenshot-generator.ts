/**
 * SCREENSHOT GENERATOR STUB - Заглушка для генерации скриншотов
 */

export class ScreenshotGenerator {
  static async generateScreenshot(url: string, _options?: any): Promise<string> {
    console.log('ScreenshotGenerator (stub): generating screenshot for', url);
    return '/assets/stub/screenshot.png';
  }
  
  static async captureEmail(_html: string, _options?: any): Promise<string> {
    console.log('ScreenshotGenerator (stub): capturing email HTML');
    return '/assets/stub/email-screenshot.png';
  }
}

// Экспорт для совместимости с delivery-manager
export async function generateScreenshots(params: any): Promise<any> {
  console.log('generateScreenshots (stub): generating screenshots with params:', params);
  return {
    success: true,
    data: {
      screenshots: [{
        device: 'desktop',
        path: '/assets/stub/screenshot-desktop.png',
        width: 1200,
        height: 800
      }],
      total_screenshots: 1,
      generation_time: 100
    }
  };
}

export default ScreenshotGenerator; 