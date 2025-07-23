const http = require('http');

// Тест для отладки проблемы с emailFolder
const testData = {
  task_type: "generate_content",
  input: {
    brief: "Новогодняя распродажа с подарками для семей с детьми",
    tone: "радостный и праздничный",
    target_audience: "семьи с детьми",
    brand_guidelines: {
      style: "игривый и семейный подход",
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

console.log('🔍 Debug Test: Отправка запроса на /api/agent/run-improved');
console.log('📝 Тема:', testData.input.brief);
console.log('🎯 Аудитория:', testData.input.target_audience);
console.log('📅 Время:', new Date().toLocaleString());
console.log('=' * 60);

const req = http.request(options, (res) => {
  console.log(`📊 Статус: ${res.statusCode}`);
  console.log(`📋 Заголовки:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
    // Логируем частичные данные для отладки
    if (chunk.includes('emailFolder') || chunk.includes('email_folder')) {
      console.log('🔍 EmailFolder данные найдены:', chunk.toString().substring(0, 200) + '...');
    }
  });
  
  res.on('end', () => {
    console.log('=' * 60);
    console.log('📦 Полный ответ получен, размер:', data.length);
    
    try {
      const result = JSON.parse(data);
      console.log('✅ JSON парсинг успешен');
      console.log('🏁 Статус:', result.status);
      console.log('📁 Результат:', result.result ? 'Есть' : 'Нет');
      
      if (result.result) {
        console.log('📊 Размер результата:', JSON.stringify(result.result).length);
        
        // Ищем упоминания emailFolder в результате
        const resultStr = JSON.stringify(result.result);
        if (resultStr.includes('emailFolder') || resultStr.includes('email_folder')) {
          console.log('🔍 EmailFolder упоминается в результате');
        }
      }
      
      if (result.error) {
        console.log('❌ Ошибка:', result.error);
      }
      
      if (result.traceId) {
        console.log('🆔 Trace ID:', result.traceId);
      }
      
    } catch (e) {
      console.log('❌ Ошибка парсинга JSON:', e.message);
      console.log('📄 Первые 500 символов ответа:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Ошибка запроса:', e.message);
});

req.write(postData);
req.end(); 