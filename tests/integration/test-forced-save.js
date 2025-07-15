const http = require('http');
const fs = require('fs').promises;
const path = require('path');

// Тест принудительного сохранения файлов
const testData = {
  task_type: "generate_content",
  input: {
    brief: "ПРИНУДИТЕЛЬНОЕ сохранение файлов - финальный тест",
    tone: "решительный",
    target_audience: "разработчики",
    brand_guidelines: {
      style: "четкий и надежный",
      language: "ru",
      content_type: "promotional"
    }
  },
  context: {
    figma_url: "https://www.figma.com/design/gJBHVJSHhOJdVLcXQEELpy/Email-Makers?node-id=4-9&t=uPmvpJMJLXPzfNVK-1",
    user_id: "forced_save_test"
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

console.log('🚨 FORCED SAVE TEST: Принудительное сохранение');
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
    
    try {
      const result = JSON.parse(data);
      console.log('✅ JSON парсинг успешен');
      console.log('🏁 Статус:', result.success ? 'Успешно' : 'Ошибка');
      console.log('🆔 Trace ID:', result.traceId || 'Отсутствует');
      
      if (result.error) {
        console.log('❌ Ошибка:', result.error);
        return;
      }
      
      // Ждем немного для завершения всех операций
      console.log('⏳ Ожидание 5 секунд для завершения операций...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Ищем кампании, созданные за последние 10 минут
      console.log('\n🔍 Поиск недавно созданных кампаний...');
      
      const mailsPath = path.join(process.cwd(), 'mails');
      const folders = await fs.readdir(mailsPath);
      
      const recentCampaigns = [];
      const now = Date.now();
      
      for (const folder of folders) {
        if (folder === 'shared-assets') continue;
        
        try {
          const folderPath = path.join(mailsPath, folder);
          const stat = await fs.stat(folderPath);
          
          // Кампании созданные за последние 10 минут
          if (stat.isDirectory() && (now - stat.birthtime.getTime()) < 600000) {
            recentCampaigns.push({
              name: folder,
              path: folderPath,
              created: stat.birthtime
            });
          }
        } catch {}
      }
      
      if (recentCampaigns.length > 0) {
        recentCampaigns.sort((a, b) => b.created - a.created);
        
        console.log(`📁 Найдено ${recentCampaigns.length} недавних кампаний:`);
        
        let foundFiles = false;
        
        for (let i = 0; i < Math.min(3, recentCampaigns.length); i++) {
          const campaign = recentCampaigns[i];
          console.log(`\n${i + 1}. ${campaign.name}`);
          console.log(`📅 Создана: ${campaign.created.toLocaleString()}`);
          
          const files = await fs.readdir(campaign.path);
          console.log(`📁 Файлы: ${files.join(', ')}`);
          
          const htmlPath = path.join(campaign.path, 'email.html');
          const mjmlPath = path.join(campaign.path, 'email.mjml');
          
          let hasHtml = false, hasMjml = false;
          
          try {
            await fs.access(htmlPath);
            const htmlContent = await fs.readFile(htmlPath, 'utf8');
            console.log(`✅ email.html: ${htmlContent.length} символов`);
            hasHtml = true;
            
            if (htmlContent.length > 500) {
              console.log(`✅ HTML выглядит полноценным`);
            }
          } catch {
            console.log(`❌ email.html отсутствует`);
          }
          
          try {
            await fs.access(mjmlPath);
            const mjmlContent = await fs.readFile(mjmlPath, 'utf8');
            console.log(`✅ email.mjml: ${mjmlContent.length} символов`);
            hasMjml = true;
            
            if (mjmlContent.includes('<mjml>')) {
              console.log(`✅ MJML структура корректна`);
            }
          } catch {
            console.log(`❌ email.mjml отсутствует`);
          }
          
          if (hasHtml && hasMjml) {
            foundFiles = true;
            console.log(`🎉 УСПЕХ в кампании: ${campaign.name}`);
          }
        }
        
        console.log('\n==========================================');
        if (foundFiles) {
          console.log('🎉🎉🎉 ПРИНУДИТЕЛЬНОЕ СОХРАНЕНИЕ СРАБОТАЛО! 🎉🎉🎉');
          console.log('✅ Файлы email.html и email.mjml найдены!');
          console.log('✅ Проблема с сохранением файлов РЕШЕНА!');
        } else {
          console.log('❌❌❌ ПРИНУДИТЕЛЬНОЕ СОХРАНЕНИЕ НЕ СРАБОТАЛО ❌❌❌');
          console.log('❌ Файлы все еще не сохраняются');
          console.log('❌ Необходимо дальнейшее исследование');
        }
        
      } else {
        console.log('❌ Недавние кампании не найдены');
      }
      
    } catch (e) {
      console.log('❌ Ошибка:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Ошибка запроса:', e.message);
});

req.write(postData);
req.end(); 