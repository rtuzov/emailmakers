/**
 * Screenshot Generator Tool
 * 
 * Генерирует скриншоты HTML email для визуального анализа в AI Quality Consultant
 */

import { ToolResult, handleToolError } from './index';

interface ScreenshotParams {
  html_content: string;
  campaign_id?: string;
  viewport_width?: number;
  viewport_height?: number;
  full_page?: boolean;
  devices?: ('desktop' | 'mobile' | 'tablet')[];
}

interface ScreenshotResult {
  screenshots: {
    device: string;
    path: string;
    base64?: string;
    width: number;
    height: number;
  }[];
  total_screenshots: number;
  generation_time: number;
}

/**
 * Генерирует скриншоты HTML email для разных устройств
 */
export async function generateScreenshots(params: ScreenshotParams): Promise<ToolResult> {
  const startTime = Date.now();
  
  try {
    console.log('📸 Screenshot Generator: Starting screenshot generation...');
    
    // Валидация параметров
    if (!params.html_content || params.html_content.trim() === '') {
      throw new Error('HTML content is required for screenshot generation');
    }

    // Получаем полный HTML если он сокращен
    let fullHtml = params.html_content;
    if (params.html_content.includes('...[truncated]') && params.campaign_id) {
      console.log('🔄 Screenshot Generator: HTML is truncated, loading full version from file...');
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const htmlPath = path.join(process.cwd(), 'mails', params.campaign_id, 'email.html');
        fullHtml = await fs.readFile(htmlPath, 'utf8');
        console.log(`✅ Screenshot Generator: Loaded full HTML from file: ${fullHtml.length} characters`);
      } catch (error) {
        throw new Error(`Could not load full HTML from file: ${error.message}`);
      }
    }

    // Настройки устройств - обязательные параметры
    if (!params.devices || params.devices.length === 0) {
      throw new Error('Devices parameter is required and cannot be empty');
    }
    
    const viewports = {
      desktop: { width: 1200, height: 800 },
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 }
    };

    // Проверяем доступность Playwright - обязательно
    let playwright;
    try {
      playwright = await import('playwright');
    } catch (error) {
      throw new Error('Playwright is not available. Install Playwright to generate screenshots: npm install playwright');
    }

    const screenshots: ScreenshotResult['screenshots'] = [];
    
    // Запускаем браузер
    const browser = await playwright.chromium.launch({ headless: true });
    
    try {
      for (const device of params.devices) {
        console.log(`📱 Generating screenshot for ${device}...`);
        
        const context = await browser.newContext({
          viewport: viewports[device],
          deviceScaleFactor: device === 'mobile' ? 2 : 1,
        });
        
        const page = await context.newPage();
        
        // Устанавливаем HTML content
        await page.setContent(fullHtml, {
          waitUntil: 'networkidle'
        });
        
        // Ждем загрузки изображений
        await page.waitForTimeout(2000);
        
        // Генерируем имя файла
        const timestamp = Date.now();
        const filename = `email-${device}-${timestamp}.png`;
        
        if (!params.campaign_id) {
          throw new Error('Campaign ID is required for screenshot generation');
        }
        
        const screenshotPath = `mails/${params.campaign_id}/screenshots/${filename}`;
        
        // Создаем директорию если нужно
        const fs = await import('fs/promises');
        const path = await import('path');
        const fullPath = path.join(process.cwd(), screenshotPath);
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });
        
        // Делаем скриншот
        const screenshotBuffer = await page.screenshot({
          path: fullPath,
          fullPage: params.full_page ?? true,
          type: 'png'
        });
        
        // Получаем размеры скриншота
        const imageSize = await getImageDimensions(screenshotBuffer);
        
        screenshots.push({
          device,
          path: fullPath,
          base64: screenshotBuffer.toString('base64'),
          width: imageSize.width,
          height: imageSize.height
        });
        
        console.log(`✅ Screenshot generated: ${screenshotPath}`);
        
        await context.close();
      }
    } finally {
      await browser.close();
    }
    
    const generationTime = Date.now() - startTime;
    
    const result: ScreenshotResult = {
      screenshots,
      total_screenshots: screenshots.length,
      generation_time: generationTime
    };
    
    console.log(`📸 Screenshot generation completed: ${screenshots.length} screenshots in ${generationTime}ms`);
    
    return {
      success: true,
      data: result,
      // metadata: {
      //   devices_processed: params.devices,
      //   campaign_id: params.campaign_id,
      //   generation_time: generationTime,
      //   timestamp: new Date().toISOString()
      // }
    };
    
  } catch (error) {
    return handleToolError('generate_screenshots', error);
  }
}

/**
 * Получает размеры изображения из буфера
 */
async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  try {
    // Простой парсинг PNG заголовка для получения размеров
    if (buffer.length >= 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
  } catch (error) {
    console.warn('Could not parse image dimensions:', error);
  }
  
  // Возвращаем размеры по умолчанию
  return { width: 600, height: 400 };
}

/**
 * Создает публичный URL для скриншота
 */
export function createScreenshotUrl(campaignId: string, filename: string): string {
  return `http://localhost:3000/api/mock/s3/mails/${campaignId}/screenshots/${filename}`;
} 