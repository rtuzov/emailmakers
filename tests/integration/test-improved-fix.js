const http = require('http');
const fs = require('fs').promises;
const path = require('path');

// Тест исправленной системы сохранения файлов
const testData = {
  task_type: "generate_content",
  input: {
    brief: "Проверка ИСПРАВЛЕННОЙ системы сохранения файлов",
    tone: "уверенный",
    target_audience: "тестировщики",
    brand_guidelines: {
      style: "технический и точный",
      language: "ru",
      content_type: "promotional"
    }
  },
  context: {
    figma_url: "https://www.figma.com/design/gJBHVJSHhOJdVLcXQEELpy/Email-Makers?node-id=4-9&t=uPmvpJMJLXPzfNVK-1",
    user_id: "fix_test_user"
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

console.log('🔧 Test Fixed System: Проверка исправлений');
console.log('📝 Brief:', testData.input.brief);
console.log('📅 Время:', new Date().toLocaleString());
console.log('==========================================');

const startTime = Date.now();

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
      
      // Ищем самую новую кампанию
      console.log('\n🔍 Поиск самой новой кампании...');
      
      const mailsPath = path.join(process.cwd(), 'mails');
      const folders = await fs.readdir(mailsPath);
      
      const campaignFolders = [];
      for (const folder of folders) {
        if (folder === 'shared-assets') continue;
        
        try {
          const folderPath = path.join(mailsPath, folder);
          const stat = await fs.stat(folderPath);
          if (stat.isDirectory()) {
            campaignFolders.push({
              name: folder,
              path: folderPath,
              created: stat.birthtime
            });
          }
        } catch {}
      }
      
      if (campaignFolders.length > 0) {
        campaignFolders.sort((a, b) => b.created - a.created);
        const newestCampaign = campaignFolders[0];
        
        console.log(`📁 Самая новая кампания: ${newestCampaign.name}`);
        console.log(`📅 Создана: ${newestCampaign.created.toLocaleString()}`);
        
        // Проверяем файлы в самой новой кампании
        const files = await fs.readdir(newestCampaign.path);
        console.log(`📁 Файлы в кампании:`, files);
        
        const htmlPath = path.join(newestCampaign.path, 'email.html');
        const mjmlPath = path.join(newestCampaign.path, 'email.mjml');
        
        let success = true;
        
        try {
          await fs.access(htmlPath);
          const htmlContent = await fs.readFile(htmlPath, 'utf8');
          console.log(`✅ EMAIL.HTML НАЙДЕН!`);
          console.log(`📄 Размер: ${htmlContent.length} символов`);
          
          if (htmlContent.length > 1000) {
            console.log(`✅ HTML содержит полноценный контент (>${htmlContent.length} символов)`);
          } else {
            console.log(`⚠️ HTML содержимое кажется слишком коротким (${htmlContent.length} символов)`);
          }
        } catch {
          console.log(`❌ EMAIL.HTML ОТСУТСТВУЕТ`);
          success = false;
        }
        
        try {
          await fs.access(mjmlPath);
          const mjmlContent = await fs.readFile(mjmlPath, 'utf8');
          console.log(`✅ EMAIL.MJML НАЙДЕН!`);
          console.log(`📄 Размер: ${mjmlContent.length} символов`);
          
          if (mjmlContent.includes('<mjml>') && mjmlContent.includes('</mjml>')) {
            console.log(`✅ MJML имеет корректную структуру`);
          } else {
            console.log(`⚠️ MJML структура кажется некорректной`);
          }
        } catch {
          console.log(`❌ EMAIL.MJML ОТСУТСТВУЕТ`);
          success = false;
        }
        
        console.log('\n==========================================');
        if (success) {
          console.log('🎉 УСПЕХ! ИСПРАВЛЕНИЕ СРАБОТАЛО!');
          console.log('✅ Файлы email.html и email.mjml найдены');
          console.log('✅ Система сохранения файлов работает');
        } else {
          console.log('❌ НЕУДАЧА - файлы все еще не сохраняются');
          console.log('❌ Требуется дополнительная отладка');
        }
        
      } else {
        console.log('❌ Кампании не найдены');
      }
      
    } catch (e) {
      console.log('❌ Ошибка парсинга JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Ошибка запроса:', e.message);
});

req.write(postData);
req.end(); 