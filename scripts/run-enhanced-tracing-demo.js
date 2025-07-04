#!/usr/bin/env node

/**
 * 🔍 ENHANCED TRACING DEMO RUNNER
 * 
 * Запуск демонстрации расширенной системы трассировки
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 ========== ENHANCED TRACING DEMO RUNNER ==========');
console.log('📋 Preparing to run enhanced tracing demonstration');
console.log('==================================================\n');

try {
  // 🔧 Установка переменных окружения для debug режима
  process.env.DEBUG = 'openai-agents*';
  process.env.NODE_ENV = 'development';
  
  console.log('🔧 Environment setup:');
  console.log(`   DEBUG: ${process.env.DEBUG}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log('');

  // 📁 Путь к демо-скрипту
  const demoPath = path.join(__dirname, '..', 'examples', 'enhanced-tracing-demo.ts');
  
  console.log('🚀 Running enhanced tracing demo...');
  console.log(`📁 Demo script: ${demoPath}`);
  console.log('');

  // 🏃‍♂️ Запуск демонстрации с ts-node
  const command = `npx ts-node ${demoPath}`;
  
  console.log(`⚡ Executing: ${command}`);
  console.log('================================================\n');

  // Выполняем команду с наследованием stdio для видимости всех логов
  execSync(command, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      FORCE_COLOR: '1' // Включаем цветной вывод
    }
  });

  console.log('\n================================================');
  console.log('✅ Enhanced tracing demo completed successfully!');
  console.log('📊 Check the logs above for full function visibility');
  console.log('💾 Trace files saved in ./logs/ directory');
  console.log('================================================');

} catch (error) {
  console.error('\n❌ Enhanced tracing demo failed:');
  console.error('================================================');
  
  if (error.status) {
    console.error(`💥 Exit code: ${error.status}`);
  }
  
  if (error.message) {
    console.error(`📝 Error: ${error.message}`);
  }
  
  console.error('================================================');
  
  // Показываем инструкции по устранению неполадок
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Ensure all dependencies are installed: npm install');
  console.log('2. Check TypeScript compilation: npx tsc --noEmit');
  console.log('3. Verify OpenAI API key is set in environment');
  console.log('4. Check that all required files exist');
  
  process.exit(1);
} 