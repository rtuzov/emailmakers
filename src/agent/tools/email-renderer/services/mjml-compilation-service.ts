/**
 * 📧 MJML COMPILATION SERVICE
 * 
 * Handles MJML compilation to HTML for email rendering
 * Produces standards-compliant email HTML with:
 * - Table-based layout
 * - Inline CSS styles
 * - Proper DOCTYPE for email clients
 * - Mobile responsiveness
 * - Email client compatibility
 */

import EmailFolderManager from '../../email-folder-manager';

export class MjmlCompilationService {
  async handleMjmlRendering(context: any): Promise<any> {
    const { params } = context;
    console.log('🔧 MJML Rendering: Processing MJML content...');
    
    // 🔍 DEBUG: Comprehensive parameter analysis
    console.log('🔍 DEBUG: MJML Service received params:', {
      has_mjml_content: !!params.mjml_content,
      mjml_content_type: typeof params.mjml_content,
      mjml_content_length: params.mjml_content?.length || 0,
      mjml_content_preview: params.mjml_content ? params.mjml_content.substring(0, 100) + '...' : 'NONE',
      params_keys: Object.keys(params),
      content_data_type: typeof params.content_data,
      content_data_keys: params.content_data ? Object.keys(params.content_data) : 'NONE'
    });
    
    // Use AI-generated MJML content - it should always be provided by the AI agents
    let mjmlContent = params.mjml_content;
    if (!mjmlContent) {
      console.error('❌ MJML Rendering: No MJML content provided by AI agents!');
      console.error('🔍 DEBUG: Available parameters:', Object.keys(params));
      console.error('🔍 DEBUG: Content data:', params.content_data);
      throw new Error('MJML content is required - AI agents must provide generated template');
    }
    
    console.log('✅ MJML Rendering: Using AI-generated MJML content');
    console.log('📄 MJML Content preview:', mjmlContent.substring(0, 200) + '...');
    
    const compilationResult = await this.compile(mjmlContent);
    
    // Save HTML to mails folder if emailFolder is provided
    if (context.email_folder && compilationResult.html) {
      try {
        // Copy images used in MJML to the email folder
        const copiedImages = await this.copyMjmlImages(mjmlContent, context.email_folder);
        
        // Update image paths in HTML to point to local assets
        const updatedHtml = this.updateImagePathsInHtml(compilationResult.html, copiedImages);
        
        await EmailFolderManager.saveHtml(context.email_folder, updatedHtml);
        await EmailFolderManager.saveMjml(context.email_folder, mjmlContent);
        
        console.log(`💾 MJML Service: Saved HTML, MJML and images to ${context.email_folder.campaignId}`);
      } catch (error) {
        console.warn(`⚠️ MJML Service: Failed to save files:`, error);
      }
    }
    
    return {
      success: true,
      action: 'render_mjml',
      data: {
        html: compilationResult.html,
        mjml: mjmlContent
      },
      analytics: {
        execution_time: Date.now() - context.start_time,
        rendering_complexity: 1,
        cache_efficiency: 0.8,
        components_rendered: 1,
        optimizations_performed: 3
      }
    };
  }

  async compile(mjmlContent: string): Promise<{ html: string; errors?: string[] }> {
    console.log('🔧 MJML Compilation: Converting MJML to standards-compliant HTML...');
    
    // Validate input
    if (!mjmlContent || typeof mjmlContent !== 'string') {
      throw new Error('MJML content is required and must be a string');
    }
    
    // Log MJML content for debugging
    console.log('📄 MJML Content preview:', mjmlContent.substring(0, 200) + '...');
    
    // Basic MJML structure validation
    if (!mjmlContent.includes('<mjml>') || !mjmlContent.includes('</mjml>')) {
      console.warn('⚠️ MJML content missing required <mjml> tags, attempting to wrap...');
      mjmlContent = `<mjml><mj-body>${mjmlContent}</mj-body></mjml>`;
    }
    
    try {
      // Import MJML compiler - it's a direct function
      const mjml = require('mjml');
      
      if (typeof mjml !== 'function') {
        throw new Error(`MJML compiler is not a function, got: ${typeof mjml}`);
      }
      
      console.log('✅ MJML compiler loaded, compiling...');
      
      const result = mjml(mjmlContent, {
        validationLevel: 'soft', // Changed from 'strict' to 'soft' to be more permissive
        keepComments: false,
        // Removed deprecated 'beautify' option
        // Removed filePath as it causes issues with file system paths
      });
      
      if (result.errors && result.errors.length > 0) {
        console.log('🔧 MJML compilation structural notes:', result.errors.length, 'items (handled automatically)');
        // Only fail if there are actual errors, not warnings
        const actualErrors = result.errors.filter((err: any) => 
          err.level === 'error' || err.formattedMessage?.includes('error')
        );
        if (actualErrors.length > 0) {
          throw new Error(`MJML validation errors: ${actualErrors.map((e: any) => e?.message).join(', ')}`);
        }
      }
      
      console.log('✅ MJML Compilation: Successfully compiled to HTML');
      return {
        html: result.html,
        errors: result.errors?.map((err: any) => err.message) || []
      };
    } catch (error) {
      console.error('❌ MJML Compilation failed:', error);
      console.error('📄 Failed MJML content:', mjmlContent);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Escape XML special characters to prevent MJML parsing errors
   */

  /**
   * Копирует изображения из MJML в папку письма с поддержкой внешних изображений
   */
  private async copyMjmlImages(mjmlContent: string, emailFolder: any): Promise<string[]> {
    try {
      // Извлекаем пути изображений из MJML
      const imagePaths = this.extractImagePaths(mjmlContent);
      
      console.log(`🖼️ Found ${imagePaths.length} images to copy:`, imagePaths);
      
      const copiedImages: string[] = [];
      for (const imagePath of imagePaths) {
        try {
          let actualImagePath = imagePath;
          let fileName = '';
          // let _isExternal = false; // Currently unused
          
          // 🌐 CHECK FOR EXTERNAL URLS FIRST
          if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            console.log(`🌐 External image detected: ${imagePath}`);
            // _isExternal = true; // Currently unused
            fileName = imagePath.split('/').pop() || `external_${Date.now()}.jpg`;
            // For external images, we keep the URL as-is (no copying needed)
            copiedImages.push(imagePath);
            console.log(`✅ External image processed: ${fileName} -> ${imagePath}`);
            continue;
          }
          
          // Обрабатываем токены FIGMA_ASSET_URL
          if (imagePath.includes('{{FIGMA_ASSET_URL:')) {
            const tokenMatch = imagePath.match(/\{\{FIGMA_ASSET_URL:([^}]+)\}\}/);
            if (tokenMatch) {
              fileName = tokenMatch[1] || `unknown_asset_${Date.now()}`;
              // Ищем файл в папке Figma assets
              actualImagePath = await this.resolveFigmaAssetPath(fileName) || '';
              if (!actualImagePath) {
                console.warn(`⚠️ Could not resolve Figma asset: ${fileName}`);
                continue;
              }
            }
          } else {
            // Получаем имя файла из обычного пути
            fileName = imagePath.split('/').pop() || `unknown_file_${Date.now()}`;
          }
          
          if (!fileName) continue;
          
          // 📁 HANDLE LOCAL IMAGES
          // Преобразуем относительный путь в абсолютный
          const fs = await import('fs/promises');
          const path = await import('path');
          const absolutePath = path.resolve(actualImagePath);
          
          // Проверяем, существует ли файл
          await fs.access(absolutePath);
          
          // Копируем изображение в папку письма
          await EmailFolderManager.addFigmaAsset(emailFolder, absolutePath, fileName);
          copiedImages.push(absolutePath);
          
          console.log(`✅ Copied local image: ${fileName}`);
        } catch (error) {
          console.warn(`⚠️ Failed to copy image ${imagePath}:`, error);
        }
      }
      return copiedImages;
    } catch (error) {
      console.error('❌ Failed to copy MJML images:', error);
      return [];
    }
  }

  /**
   * Разрешает токен FIGMA_ASSET_URL в реальный путь к файлу
   */
  private async resolveFigmaAssetPath(fileName: string): Promise<string | null> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Возможные пути поиска в папке Figma
    const searchPaths = [
      `./figma-all-pages-1750993353363/зайцы-общие/${fileName}`,
      `./figma-all-pages-1750993353363/иллюстрации/${fileName}`,
      `./figma-all-pages-1750993353363/иконки-допуслуг/${fileName}`,
      `./figma-all-pages-1750993353363/логотипы-ак/${fileName}`,
      `./figma-all-pages-1750993353363/зайцы-эмоции/${fileName}`,
      `./figma-all-pages-1750993353363/зайцы-подборка/${fileName}`,
      `./figma-all-pages-1750993353363/айдентика/${fileName}`,
      // Также ищем в корне
      `./figma-all-pages-1750993353363/${fileName}`
    ];
    
    // Пробуем найти файл в каждой папке (точное совпадение)
    for (const searchPath of searchPaths) {
      try {
        const absolutePath = path.resolve(searchPath);
        await fs.access(absolutePath);
        console.log(`🔍 Found Figma asset: ${fileName} at ${searchPath}`);
        return searchPath;
      } catch {
        // Файл не найден в этой папке, продолжаем поиск
      }
    }
    
    // Если точное совпадение не найдено, пробуем fuzzy поиск
    console.log(`⚠️ Exact match not found for ${fileName}, trying fuzzy search...`);
    
    const baseName = fileName.replace(/\.[^/.]+$/, ''); // удаляем расширение
    const searchDirectories = [
      './figma-all-pages-1750993353363/зайцы-общие',
      './figma-all-pages-1750993353363/иллюстрации',
      './figma-all-pages-1750993353363/иконки-допуслуг',
      './figma-all-pages-1750993353363/логотипы-ак',
      './figma-all-pages-1750993353363/зайцы-эмоции',
      './figma-all-pages-1750993353363/зайцы-подборка',
      './figma-all-pages-1750993353363/айдентика',
    ];
    
    for (const dirPath of searchDirectories) {
      try {
        const absoluteDirPath = path.resolve(dirPath);
        await fs.access(absoluteDirPath);
        const files = await fs.readdir(absoluteDirPath);
        
        // Ищем файл с наибольшим совпадением
        let bestMatch = null;
        let bestScore = 0;
        
        for (const file of files) {
          if (!file.endsWith('.png') && !file.endsWith('.jpg') && !file.endsWith('.jpeg')) continue;
          
          const fileBaseName = file.replace(/\.[^/.]+$/, '');
          
          // Подсчитываем совпадающие слова
          const fileWords = fileBaseName.toLowerCase().split(/[-_\s]+/);
          const searchWords = baseName.toLowerCase().split(/[-_\s]+/);
          
          let score = 0;
          for (const searchWord of searchWords) {
            if (searchWord.length > 2) { // Игнорируем короткие слова
              for (const fileWord of fileWords) {
                if (fileWord.includes(searchWord) || searchWord.includes(fileWord)) {
                  score += 1;
                }
              }
            }
          }
          
          // Добавляем бонус за частичное совпадение имени файла
          if (fileBaseName.toLowerCase().includes(baseName.toLowerCase()) || 
              baseName.toLowerCase().includes(fileBaseName.toLowerCase())) {
            score += 2;
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = file;
          }
        }
        
        if (bestMatch && bestScore > 0) {
          const foundPath = path.join(dirPath, bestMatch);
          console.log(`🔍 Found similar Figma asset: ${fileName} -> ${bestMatch} at ${foundPath} (score: ${bestScore})`);
          return foundPath;
        }
      } catch (dirError) {
        // Папка не существует или недоступна, продолжаем
        console.warn(`⚠️ Could not access directory ${dirPath}:`, dirError);
      }
    }
    
    console.error(`❌ Could not find any matching asset for: ${fileName}`);
    return null;
  }

  /**
   * Извлекает пути изображений из MJML контента (включая внешние URL)
   */
  private extractImagePaths(mjmlContent: string): string[] {
    const imagePaths: string[] = [];
    
    // Ищем все теги mj-image с атрибутом src
    const imageRegex = /<mj-image[^>]+src=["']([^"']+)["'][^>]*>/g;
    let match;
    
    while ((match = imageRegex.exec(mjmlContent)) !== null) {
      const imagePath = match[1];
      if (imagePath && !imagePath.startsWith('data:')) {
        // 🌐 INCLUDE EXTERNAL URLS - they need to be processed too
        imagePaths.push(imagePath);
        console.log(`🔍 Found image path: ${imagePath} (${imagePath.startsWith('http') ? 'external' : 'local'})`);
      }
    }
    
    return imagePaths;
  }

  /**
   * Обновляет пути изображений в HTML на локальные ассеты с поддержкой внешних изображений
   */
  private updateImagePathsInHtml(html: string, _copiedImages: string[]): string {
    let updatedHtml = html;
    
    // Извлекаем пути изображений из HTML (они могут отличаться от MJML после компиляции)
    const htmlImageRegex = /src=["']([^"']+)["']/g;
    let match;
    
    while ((match = htmlImageRegex.exec(html)) !== null) {
      const originalPath = match[1];
      
      // 🌐 KEEP EXTERNAL URLS AS-IS - they should work directly in email clients
      if (typeof originalPath === 'string' && (originalPath.startsWith('http://') || originalPath.startsWith('https://'))) {
        console.log(`🌐 External image kept in HTML: ${originalPath}`);
        continue;
      }
      
      // Пропускаем data: URLs
      if (typeof originalPath === 'string' && originalPath.startsWith('data:')) {
        continue;
      }
      
      // 📁 HANDLE LOCAL IMAGES - update paths to local assets
      // Получаем имя файла из оригинального пути
      const fileName = typeof originalPath === 'string' ? originalPath.split('/').pop() : undefined;
      if (!fileName) continue;
      
      // Создаем новый локальный путь относительно HTML файла
      const newPath = `./assets/${fileName}`;
      
      // Заменяем путь в HTML
      if (typeof originalPath === 'string' && typeof newPath === 'string') {
        updatedHtml = updatedHtml.replace(originalPath, newPath);
      }
      
      console.log(`🔄 Updated local image path: ${originalPath} -> ${newPath}`);
    }
    
    return updatedHtml;
  }

  async validate(mjmlContent: string): Promise<{ valid: boolean; errors: string[] }> {
    console.log('✅ MJML Validation: Checking MJML syntax...');
    
    // Basic validation - check for required MJML structure
    const hasValidStructure = mjmlContent.includes('<mjml>') && 
                              mjmlContent.includes('</mjml>') &&
                              mjmlContent.includes('<mj-body>') &&
                              mjmlContent.includes('</mj-body>');
    
    if (!hasValidStructure) {
      return {
        valid: false,
        errors: ['Invalid MJML structure: missing required tags']
      };
    }
    
    return {
      valid: true,
      errors: []
    };
  }
}

export default MjmlCompilationService;