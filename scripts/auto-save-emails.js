#!/usr/bin/env node
/**
 * Auto-save emails script
 * Автоматически сохраняет сгенерированные письма в папку mails
 */

const fs = require('fs').promises;
const path = require('path');

const MAILS_DIR = path.join(process.cwd(), 'mails');

/**
 * Сохранить письмо в папку mails
 */
async function saveEmailToMails(emailData, topic = 'generated-email') {
  try {
    // Создаем папку mails если её нет
    await fs.mkdir(MAILS_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedTopic = topic
      .toLowerCase()
      .replace(/[^a-z0-9а-я]/gi, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);

    // Сохраняем HTML
    const htmlFilename = `${sanitizedTopic}-${timestamp}.html`;
    const htmlFilepath = path.join(MAILS_DIR, htmlFilename);
    await fs.writeFile(htmlFilepath, emailData.html, 'utf8');

    // Сохраняем метаданные
    const metadataFilename = `${sanitizedTopic}-${timestamp}.json`;
    const metadataFilepath = path.join(MAILS_DIR, metadataFilename);
    const metadata = {
      ...emailData,
      html: undefined, // Не дублируем HTML в JSON
      saved_at: new Date().toISOString(),
      files: {
        html: htmlFilename,
        metadata: metadataFilename
      }
    };
    await fs.writeFile(metadataFilepath, JSON.stringify(metadata, null, 2), 'utf8');

    console.log(`✅ Email saved successfully:`);
    console.log(`   HTML: ${htmlFilename}`);
    console.log(`   Metadata: ${metadataFilename}`);

    return {
      success: true,
      files: {
        html: htmlFilepath,
        metadata: metadataFilepath
      }
    };

  } catch (error) {
    console.error('❌ Failed to save email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Получить список сохраненных писем
 */
async function getSavedEmails() {
  try {
    const files = await fs.readdir(MAILS_DIR);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    return {
      success: true,
      data: {
        html_files: htmlFiles,
        metadata_files: jsonFiles,
        total: htmlFiles.length
      }
    };

  } catch (error) {
    console.error('❌ Failed to list saved emails:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// CLI интерфейс
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'list':
      getSavedEmails().then(result => {
        if (result.success) {
          console.log(`📧 Found ${result.data.total} saved emails`);
          result.data.html_files.forEach(file => console.log(`   ${file}`));
        } else {
          console.error('❌ Error:', result.error);
        }
      });
      break;

    default:
      console.log(`
📧 Email Auto-Save Utility

Usage:
  node scripts/auto-save-emails.js list          # List saved emails

Functions available for require:
  - saveEmailToMails(emailData, topic)
  - getSavedEmails()
      `);
      break;
  }
}

module.exports = {
  saveEmailToMails,
  getSavedEmails
};
