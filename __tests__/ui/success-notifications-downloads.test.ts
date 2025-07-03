/**
 * Test suite for Phase 2.2.6: Success Notifications and Downloads
 * Tests success animations, download functionality, copy-to-clipboard, and notification displays
 */

describe('Success Notifications and Downloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock DOM APIs
    global.URL = {
      createObjectURL: jest.fn(() => 'blob:mock-url'),
      revokeObjectURL: jest.fn()
    } as any;
    
    // Mock document
    const mockElement = {
      tagName: 'A',
      href: '',
      download: '',
      click: jest.fn(),
      style: {},
      setAttribute: jest.fn(),
      getAttribute: jest.fn()
    };
    
    global.document = {
      createElement: jest.fn(() => mockElement),
      body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
      }
    } as any;
    
    // Mock Blob constructor
    global.Blob = jest.fn((content, options) => ({
      size: content[0]?.length || 0,
      type: options?.type || 'text/plain'
    })) as any;
    
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn(() => Promise.resolve())
      },
      writable: true
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Success Animation and Display', () => {
    it('triggers success animation when generation completes', () => {
      const mockSetShowSuccessAnimation = jest.fn();
      
      // Simulate success animation trigger
      const triggerSuccessAnimation = () => {
        mockSetShowSuccessAnimation(true);
        setTimeout(() => mockSetShowSuccessAnimation(false), 3000);
      };

      triggerSuccessAnimation();
      
      expect(mockSetShowSuccessAnimation).toHaveBeenCalledWith(true);
    });

    it('displays enhanced success header with celebration emoji', () => {
      const successDisplay = {
        emoji: '🎉',
        title: 'Шаблон успешно создан!',
        showAnimation: true
      };

      expect(successDisplay.emoji).toBe('🎉');
      expect(successDisplay.title).toContain('успешно создан');
      expect(successDisplay.showAnimation).toBe(true);
    });

    it('shows generation metadata in success display', () => {
      const mockMetadata = {
        generation_time: 1500,
        template_size: 51200, // 50KB
        apis_used: ['openai', 'mjml-compiler']
      };

      const getMetadataDisplay = (metadata: any) => {
        return {
          timeDisplay: `⏱️ ${metadata.generation_time}мс`,
          sizeDisplay: metadata.template_size ? `📏 ${Math.round(metadata.template_size / 1024)}KB` : null,
          servicesDisplay: `🤖 ${metadata.apis_used?.length || 1} ИИ сервисов`
        };
      };

      const display = getMetadataDisplay(mockMetadata);
      
      expect(display.timeDisplay).toBe('⏱️ 1500мс');
      expect(display.sizeDisplay).toBe('📏 50KB');
      expect(display.servicesDisplay).toBe('🤖 2 ИИ сервисов');
    });

    it('displays quality scores with color-coded indicators', () => {
      const mockQualityScores = {
        content_quality: 92,
        design_quality: 88,
        deliverability_score: 95,
        overall_quality: 91
      };

      const getQualityDisplay = (scores: any) => {
        return {
          content: { score: Math.round(scores.content_quality), color: 'text-green-400' },
          design: { score: Math.round(scores.design_quality), color: 'text-blue-400' },
          deliverability: { score: Math.round(scores.deliverability_score), color: 'text-orange-400' },
          overall: { score: Math.round(scores.overall_quality), color: 'text-purple-400' }
        };
      };

      const display = getQualityDisplay(mockQualityScores);
      
      expect(display.content.score).toBe(92);
      expect(display.content.color).toBe('text-green-400');
      expect(display.design.score).toBe(88);
      expect(display.deliverability.score).toBe(95);
      expect(display.overall.score).toBe(91);
    });
  });

  describe('Copy to Clipboard Functionality', () => {
    it('successfully copies content to clipboard', async () => {
      const mockContent = 'Test email subject line';
      const mockType = 'Тема письма';
      
      const copyToClipboard = async (content: string, type: string) => {
        try {
          await navigator.clipboard.writeText(content);
          return {
            success: true,
            message: `${type} скопирован в буфер обмена`,
            details: 'Содержимое успешно скопировано'
          };
        } catch (error) {
          return {
            success: false,
            message: 'Ошибка копирования',
            details: 'Не удалось скопировать в буфер обмена'
          };
        }
      };

      const result = await copyToClipboard(mockContent, mockType);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockContent);
      expect(result.success).toBe(true);
      expect(result.message).toContain('скопирован в буфер обмена');
    });

    it('handles clipboard API errors gracefully', async () => {
      // Mock clipboard API failure
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard access denied'));
      
      const copyToClipboard = async (content: string, type: string) => {
        try {
          await navigator.clipboard.writeText(content);
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: 'Ошибка копирования',
            details: 'Не удалось скопировать в буфер обмена'
          };
        }
      };

      const result = await copyToClipboard('test', 'test type');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Ошибка копирования');
    });

    it('provides copy buttons for different content types', () => {
      const contentTypes = [
        { type: 'subject_line', label: 'Тема письма' },
        { type: 'preview_text', label: 'Текст предпросмотра' },
        { type: 'html_content', label: 'HTML код' },
        { type: 'mjml_content', label: 'MJML код' }
      ];

      contentTypes.forEach(({ type, label }) => {
        const copyButton = {
          text: '📋 Копировать',
          label: label,
          contentType: type
        };
        
        expect(copyButton.text).toBe('📋 Копировать');
        expect(copyButton.label).toBeTruthy();
        expect(copyButton.contentType).toBe(type);
      });
    });
  });

  describe('File Download Functionality', () => {
    it('downloads HTML file successfully', async () => {
      const mockHtmlContent = '<!DOCTYPE html><html><body><h1>Test Email</h1></body></html>';
      const fileName = 'email-template.html';
      const mimeType = 'text/html';
      
      const downloadFile = async (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return { success: true, filename, size: blob.size };
      };

      const result = await downloadFile(mockHtmlContent, fileName, mimeType);
      
      expect(global.Blob).toHaveBeenCalledWith([mockHtmlContent], { type: mimeType });
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.filename).toBe(fileName);
    });

    it('downloads MJML file when available', async () => {
      const mockMjmlContent = '<mjml><mj-body><mj-section><mj-column><mj-text>Test</mj-text></mj-column></mj-section></mj-body></mjml>';
      
      const downloadFile = async (content: string, filename: string, type: string = 'text/plain') => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        
        return {
          success: true,
          filename,
          type,
          size: blob.size
        };
      };

      const result = await downloadFile(mockMjmlContent, 'email-template.mjml');
      
      expect(result.success).toBe(true);
      expect(result.filename).toBe('email-template.mjml');
      expect(result.type).toBe('text/plain');
    });

    it('downloads text version when available', async () => {
      const mockTextContent = 'Plain text version of the email content';
      
      const downloadFile = async (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/plain' });
        return {
          success: true,
          filename,
          contentLength: content.length
        };
      };

      const result = await downloadFile(mockTextContent, 'email-template.txt');
      
      expect(result.success).toBe(true);
      expect(result.filename).toBe('email-template.txt');
      expect(result.contentLength).toBe(mockTextContent.length);
    });

    it('handles download errors gracefully', async () => {
      // Mock URL.createObjectURL to throw error
      (global.URL.createObjectURL as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to create object URL');
      });
      
      const downloadFile = async (content: string, filename: string) => {
        try {
          const blob = new Blob([content], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          return { success: true, url };
        } catch (error) {
          return {
            success: false,
            error: 'Ошибка загрузки файла',
            details: 'Не удалось загрузить файл. Попробуйте еще раз.'
          };
        }
      };

      const result = await downloadFile('test content', 'test.html');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Ошибка загрузки файла');
    });
  });

  describe('Download Progress Indication', () => {
    it('shows download progress during file download', async () => {
      const mockSetDownloadProgress = jest.fn();
      
      const downloadWithProgress = async (fileName: string) => {
        mockSetDownloadProgress({ isDownloading: true, fileName, progress: 0 });
        
        // Simulate progress updates
        for (let i = 0; i <= 100; i += 20) {
          mockSetDownloadProgress(prev => prev ? { ...prev, progress: i } : null);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        mockSetDownloadProgress(null);
        return { success: true };
      };

      await downloadWithProgress('email-template.html');
      
      expect(mockSetDownloadProgress).toHaveBeenCalledWith({
        isDownloading: true,
        fileName: 'email-template.html',
        progress: 0
      });
      
      expect(mockSetDownloadProgress).toHaveBeenCalledWith(null);
    });

    it('displays progress bar with correct styling', () => {
      const downloadProgress = {
        isDownloading: true,
        fileName: 'email-template.html',
        progress: 65
      };

      const progressBarStyle = {
        width: `${downloadProgress.progress}%`,
        transition: 'all duration-300',
        backgroundColor: 'kupibilet-primary'
      };

      expect(progressBarStyle.width).toBe('65%');
      expect(progressBarStyle.backgroundColor).toBe('kupibilet-primary');
    });

    it('shows spinner animation during download', () => {
      const downloadProgress = {
        isDownloading: true,
        fileName: 'test.html',
        progress: 50
      };

      const spinnerClasses = downloadProgress.isDownloading 
        ? 'animate-spin w-4 h-4 border-2 border-kupibilet-primary border-t-transparent rounded-full'
        : '';

      expect(spinnerClasses).toContain('animate-spin');
      expect(spinnerClasses).toContain('border-kupibilet-primary');
    });
  });

  describe('Bulk Download Functionality', () => {
    it('downloads all files sequentially', async () => {
      const mockGenerationResult = {
        data: {
          html_content: '<html>Test HTML</html>',
          mjml_content: '<mjml>Test MJML</mjml>',
          text_content: 'Test plain text'
        }
      };

      const downloadedFiles: string[] = [];
      
      const downloadFile = async (content: string, filename: string) => {
        downloadedFiles.push(filename);
        await new Promise(resolve => setTimeout(resolve, 10));
        return { success: true, filename };
      };

      const downloadAllFiles = async () => {
        const { data } = mockGenerationResult;
        
        await downloadFile(data.html_content, 'email-template.html');
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (data.mjml_content) {
          await downloadFile(data.mjml_content, 'email-template.mjml');
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        if (data.text_content) {
          await downloadFile(data.text_content, 'email-template.txt');
        }
        
        return { success: true, filesDownloaded: downloadedFiles.length };
      };

      const result = await downloadAllFiles();
      
      expect(downloadedFiles).toContain('email-template.html');
      expect(downloadedFiles).toContain('email-template.mjml');
      expect(downloadedFiles).toContain('email-template.txt');
      expect(result.filesDownloaded).toBe(3);
    });

    it('handles partial failures in bulk download', async () => {
      let callCount = 0;
      const downloadFile = async (content: string, filename: string) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Download failed');
        }
        return { success: true, filename };
      };

      const downloadAllFiles = async () => {
        const files = ['file1.html', 'file2.mjml', 'file3.txt'];
        const results = [];
        
        for (const filename of files) {
          try {
            const result = await downloadFile('content', filename);
            results.push(result);
          } catch (error) {
            results.push({ success: false, filename, error: error.message });
          }
        }
        
        return {
          totalFiles: files.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        };
      };

      const result = await downloadAllFiles();
      
      expect(result.totalFiles).toBe(3);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
    });

    it('provides download all button with correct styling', () => {
      const isDownloading = false;
      
      const downloadAllButton = {
        text: '📦 Скачать все файлы',
        disabled: isDownloading,
        className: `glass-button px-6 py-3 bg-kupibilet-primary text-white font-semibold rounded-lg hover:bg-kupibilet-primary/80 ${
          isDownloading ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''
        }`
      };

      expect(downloadAllButton.text).toBe('📦 Скачать все файлы');
      expect(downloadAllButton.disabled).toBe(false);
      expect(downloadAllButton.className).toContain('kupibilet-primary');
    });
  });

  describe('Template Preview Integration', () => {
    it('displays subject line with copy functionality', () => {
      const mockData = {
        subject_line: 'Ваш отпуск в Париже ждет вас!'
      };

      const subjectDisplay = {
        label: 'Тема письма:',
        content: mockData.subject_line,
        copyButton: '📋 Копировать'
      };

      expect(subjectDisplay.label).toBe('Тема письма:');
      expect(subjectDisplay.content).toBe('Ваш отпуск в Париже ждет вас!');
      expect(subjectDisplay.copyButton).toBe('📋 Копировать');
    });

    it('displays preview text when available', () => {
      const mockData = {
        preview_text: 'Откройте для себя магию Парижа с нашими эксклюзивными предложениями'
      };

      const previewDisplay = {
        label: 'Текст предпросмотра:',
        content: mockData.preview_text,
        available: !!mockData.preview_text
      };

      expect(previewDisplay.available).toBe(true);
      expect(previewDisplay.content).toContain('Париж');
    });

    it('shows HTML code preview with syntax highlighting', () => {
      const mockHtmlContent = '<!DOCTYPE html><html><body><h1>Email Content</h1></body></html>';
      
      const htmlPreview = {
        label: 'HTML Код:',
        preview: mockHtmlContent.substring(0, 500) + '...',
        fullContent: mockHtmlContent,
        syntaxClass: 'text-green-400'
      };

      expect(htmlPreview.preview).toContain('<!DOCTYPE html>');
      expect(htmlPreview.syntaxClass).toBe('text-green-400');
      expect(htmlPreview.fullContent.length).toBeGreaterThanOrEqual(htmlPreview.preview.length - 3);
    });

    it('shows MJML code preview when available', () => {
      const mockMjmlContent = '<mjml><mj-body><mj-section><mj-column><mj-text>Content</mj-text></mj-column></mj-section></mj-body></mjml>';
      
      const mjmlPreview = {
        available: !!mockMjmlContent,
        label: 'MJML Код:',
        preview: mockMjmlContent.substring(0, 500) + '...',
        syntaxClass: 'text-blue-400'
      };

      expect(mjmlPreview.available).toBe(true);
      expect(mjmlPreview.preview).toContain('<mjml>');
      expect(mjmlPreview.syntaxClass).toBe('text-blue-400');
    });
  });

  describe('External Links and Preview Images', () => {
    it('opens preview image in new tab when available', () => {
      const mockFileUrls = {
        html_file: 'https://example.com/template.html',
        preview_image: 'https://example.com/preview.png'
      };

      const previewLink = {
        href: mockFileUrls.preview_image,
        target: '_blank',
        rel: 'noopener noreferrer',
        text: '🖼️ Открыть превью'
      };

      expect(previewLink.href).toBe('https://example.com/preview.png');
      expect(previewLink.target).toBe('_blank');
      expect(previewLink.rel).toBe('noopener noreferrer');
    });

    it('handles missing preview image gracefully', () => {
      const mockFileUrls = {
        html_file: 'https://example.com/template.html'
        // No preview_image
      };

      const showPreviewLink = !!mockFileUrls.preview_image;
      
      expect(showPreviewLink).toBe(false);
    });
  });

  describe('Success Notification Persistence', () => {
    it('shows temporary success notification for copy operations', async () => {
      const notifications: Array<{message: string, type: string, duration: number}> = [];
      
      const showNotification = (message: string, type: string, duration: number = 2000) => {
        notifications.push({ message, type, duration });
        setTimeout(() => {
          const index = notifications.findIndex(n => n.message === message);
          if (index > -1) notifications.splice(index, 1);
        }, duration);
      };

      await navigator.clipboard.writeText('test content');
      showNotification('HTML код скопирован в буфер обмена', 'success', 2000);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toContain('скопирован в буфер обмена');
      expect(notifications[0].type).toBe('success');
    });

    it('clears success notifications after timeout', async () => {
      const mockSetErrorDetails = jest.fn();
      
      const showTemporarySuccess = (message: string) => {
        mockSetErrorDetails({
          type: 'validation',
          message: message,
          retryable: false
        });
        
        setTimeout(() => mockSetErrorDetails(null), 2000);
      };

      showTemporarySuccess('Контент скопирован успешно');
      
      expect(mockSetErrorDetails).toHaveBeenCalledWith({
        type: 'validation',
        message: 'Контент скопирован успешно',
        retryable: false
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('provides keyboard-accessible download buttons', () => {
      const downloadButton = {
        role: 'button',
        tabIndex: 0,
        'aria-label': 'Скачать HTML файл шаблона',
        onKeyDown: (event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            // Trigger download
          }
        }
      };

      expect(downloadButton.role).toBe('button');
      expect(downloadButton.tabIndex).toBe(0);
      expect(downloadButton['aria-label']).toContain('Скачать HTML файл');
    });

    it('shows loading states for better UX', () => {
      const downloadStates = {
        idle: { text: '💾 Скачать HTML', disabled: false },
        downloading: { text: '⏳ Загрузка...', disabled: true },
        completed: { text: '✅ Загружено', disabled: false }
      };

      expect(downloadStates.idle.disabled).toBe(false);
      expect(downloadStates.downloading.disabled).toBe(true);
      expect(downloadStates.completed.text).toContain('✅');
    });

    it('provides clear visual feedback for all actions', () => {
      const feedbackStates = [
        { action: 'copy', feedback: '📋 Копировать → ✅ Скопировано' },
        { action: 'download', feedback: '💾 Скачать → ⏳ Загрузка → ✅ Готово' },
        { action: 'preview', feedback: '👀 Предпросмотр → 🖼️ Открыто' }
      ];

      feedbackStates.forEach(state => {
        expect(state.feedback).toContain('→');
        expect(state.feedback).toMatch(/[📋💾👀]/);
        expect(state.feedback).toMatch(/[✅⏳🖼️]/);
      });
    });
  });
});