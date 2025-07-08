const http = require('http');
const fs = require('fs').promises;
const path = require('path');

// Финальный тест для выявления проблемы с сохранением файлов
const testData = {
  task_type: "generate_content",
  input: {
    brief: "Тестовая рассылка для проверки сохранения файлов",
    tone: "дружелюбный",
    target_audience: "тестовая аудитория",
    brand_guidelines: {
      style: "простой и понятный",
      language: "ru",
      content_type: "promotional"
    }
  },
  context: {
    figma_url: "https://www.figma.com/design/gJBHVJSHhOJdVLcXQEELpy/Email-Makers?node-id=4-9&t=uPmvpJMJLXPzfNVK-1",
    user_id: "debug_user"
  }
};

const postData = JSON.stringify(testData);
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/agent/run-improved',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔍 Final Debug Test: Проверка сохранения файлов');
console.log('📝 Brief:', testData.input.brief);
console.log('📅 Время:', new Date().toLocaleString());
console.log('==========================================');

const startTime = Date.now();

// Функция для проверки файлов в папке
async function checkFilesInFolder(folderPath) {
  try {
    const files = await fs.readdir(folderPath);
    console.log(`📁 Файлы в ${folderPath}:`, files);
    
    const htmlPath = path.join(folderPath, 'email.html');
    const mjmlPath = path.join(folderPath, 'email.mjml');
    
    try {
      await fs.access(htmlPath);
      console.log(`✅ email.html найден в ${folderPath}`);
      
      const htmlContent = await fs.readFile(htmlPath, 'utf8');
      console.log(`📄 Размер HTML: ${htmlContent.length} символов`);
      console.log(`📄 Начало HTML: ${htmlContent.substring(0, 100)}...`);
    } catch {
      console.log(`❌ email.html ОТСУТСТВУЕТ в ${folderPath}`);
    }
    
    try {
      await fs.access(mjmlPath);
      console.log(`✅ email.mjml найден в ${folderPath}`);
      
      const mjmlContent = await fs.readFile(mjmlPath, 'utf8');
      console.log(`📄 Размер MJML: ${mjmlContent.length} символов`);
      console.log(`📄 Начало MJML: ${mjmlContent.substring(0, 100)}...`);
    } catch {
      console.log(`❌ email.mjml ОТСУТСТВУЕТ в ${folderPath}`);
    }
    
    return { hasHtml: files.includes('email.html'), hasMjml: files.includes('email.mjml') };
  } catch (error) {
    console.log(`❌ Ошибка проверки папки ${folderPath}:`, error.message);
    return { hasHtml: false, hasMjml: false };
  }
}

// Функция для поиска новых кампаний
async function findNewCampaigns() {
  try {
    const mailsPath = path.join(process.cwd(), 'mails');
    const folders = await fs.readdir(mailsPath);
    
    const stats = await Promise.all(
      folders.map(async (folder) => {
        if (folder === 'shared-assets') return null;
        
        const folderPath = path.join(mailsPath, folder);
        const stat = await fs.stat(folderPath);
        
        return {
          name: folder,
          path: folderPath,
          created: stat.birthtime,
          modified: stat.mtime
        };
      })
    );
    
    return stats.filter(Boolean).sort((a, b) => b.created - a.created);
  } catch (error) {
    console.log(`❌ Ошибка поиска кампаний:`, error.message);
    return [];
  }
}

const req = http.request(options, (res) => {
  console.log(`📊 Статус: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', async () => {
    const endTime = Date.now();
    console.log('==========================================');
    console.log(`📦 Ответ получен за ${endTime - startTime}ms`);
    console.log(`📊 Размер ответа: ${data.length} байт`);
    
    try {
      const result = JSON.parse(data);
      console.log('✅ JSON парсинг успешен');
      console.log('🏁 Статус:', result.success ? 'Успешно' : 'Ошибка');
      console.log('🆔 Trace ID:', result.traceId || 'Отсутствует');
      
      if (result.error) {
        console.log('❌ Ошибка:', result.error);
        return;
      }
      
      // Ищем новые кампании
      console.log('\n🔍 Поиск новых кампаний...');
      const campaigns = await findNewCampaigns();
      
      if (campaigns.length > 0) {
        console.log(`📁 Найдено ${campaigns.length} кампаний:`);
        
        // Проверяем последние 3 кампании
        for (let i = 0; i < Math.min(3, campaigns.length); i++) {
          const campaign = campaigns[i];
          console.log(`\n${i + 1}. ${campaign.name} (создана: ${campaign.created.toLocaleString()})`);
          
          const fileCheck = await checkFilesInFolder(campaign.path);
          
          if (fileCheck.hasHtml && fileCheck.hasMjml) {
            console.log(`✅ Кампания ${campaign.name} - файлы НАЙДЕНЫ`);
          } else {
            console.log(`❌ Кампания ${campaign.name} - файлы ОТСУТСТВУЮТ`);
          }
        }
      } else {
        console.log('❌ Кампании не найдены');
      }
      
    } catch (e) {
      console.log('❌ Ошибка парсинга JSON:', e.message);
      console.log('📄 Первые 500 символов:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Ошибка запроса:', e.message);
});

req.write(postData);
req.end(); 