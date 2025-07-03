const { consolidateTags } = require('./consolidate-tags');
const { createAIOptimizedTags } = require('./create-ai-tags-file');

/**
 * Финальный скрипт для полного процесса объединения тегов:
 * 1. Собирает все tag-dictionary.json файлы в consolidated-tags.json
 * 2. Создает оптимизированный файл ai-optimized-tags.json для ИИ
 */

async function consolidateAllTags() {
  console.log('🚀 Запускаю полный процесс объединения тегов...\n');
  
  try {
    // Шаг 1: Объединяем все tag-dictionary.json файлы
    console.log('📋 Шаг 1: Объединение всех tag-dictionary.json файлов...');
    const consolidatedData = await consolidateTags();
    console.log('✅ Шаг 1 завершен\n');
    
    // Шаг 2: Создаем оптимизированный файл для ИИ
    console.log('🤖 Шаг 2: Создание оптимизированного файла для ИИ...');
    const aiOptimizedData = createAIOptimizedTags();
    console.log('✅ Шаг 2 завершен\n');
    
    // Итоговая статистика
    console.log('🎉 Полный процесс объединения тегов завершен!');
    console.log('📊 Итоговая статистика:');
    console.log(`   📁 Обработано папок: ${consolidatedData.metadata.total_folders}`);
    console.log(`   📄 Обработано файлов: ${consolidatedData.metadata.total_files}`);
    console.log(`   🏷️ Уникальных тегов: ${consolidatedData.metadata.total_unique_tags}`);
    console.log(`   🔥 Топ-5 тегов: ${Object.keys(consolidatedData.statistics.most_common_tags_global).slice(0, 5).join(', ')}`);
    
    console.log('\n📄 Созданные файлы:');
    console.log('   📋 consolidated-tags.json - полная структура со всеми данными');
    console.log('   🤖 ai-optimized-tags.json - оптимизированный файл для отправки ИИ');
    
    console.log('\n💡 Рекомендации по использованию:');
    console.log('   • Используйте ai-optimized-tags.json для отправки в нейросеть');
    console.log('   • Файл содержит инструкции для ИИ и рекомендации по поиску');
    console.log('   • Структура тегов сохранена по папкам для точного поиска');
    
    return {
      consolidated: consolidatedData,
      aiOptimized: aiOptimizedData
    };
    
  } catch (error) {
    console.error('❌ Ошибка при выполнении полного процесса:', error);
    throw error;
  }
}

// Запускаем скрипт
if (require.main === module) {
  consolidateAllTags()
    .then(() => {
      console.log('\n✅ Полный процесс выполнен успешно');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Процесс завершен с ошибкой:', error);
      process.exit(1);
    });
}

module.exports = { consolidateAllTags }; 