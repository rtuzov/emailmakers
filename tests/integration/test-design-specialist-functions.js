/**
 * 🧪 ТЕСТОВЫЙ СКРИПТ: Design Specialist Functions
 * 
 * Проверяет работу MJML rendering, HTML creation и file saving
 * в OpenAI трейсинге и логах
 */

async function testDesignSpecialistMJML() {
  console.log('\n🎨 ТЕСТИРОВАНИЕ DESIGN SPECIALIST - MJML RENDERING');
  console.log('=' .repeat(60));
  
  try {
    const mjmlInput = {
      task_type: 'render_email',
      content_package: {
        content: {
          subject: 'Горящие авиабилеты в Турцию!',
          body: 'Специальные предложения на авиабилеты в Турцию. Успейте забронировать!',
          cta: 'Забронировать сейчас',
          preheader: 'Лучшие цены на билеты'
        },
        metadata: {
          language: 'ru',
          tone: 'urgent',
          word_count: 25
        }
      },
      rendering_requirements: {
        responsive_design: true,
        email_client_optimization: 'all',
        include_dark_mode: true,
        template_type: 'promotional'
      }
    };
    
    console.log('📊 Input данные:', JSON.stringify(mjmlInput, null, 2));
    
    // Вызываем API Design Specialist
    const response = await fetch('http://localhost:3000/api/agent/design-specialist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mjmlInput)
    });
    
    const result = await response.json();
    
    console.log('\n✅ РЕЗУЛЬТАТ MJML RENDERING:');
    console.log('📊 Success:', result.data?.success);
    console.log('📊 HTML Length:', result.data?.design_artifacts?.html_output?.length || 0);
    console.log('📊 MJML Source:', !!result.data?.design_artifacts?.mjml_source);
    console.log('📊 Tools Used:', result.data?.analytics?.operations_performed || 0);
    console.log('📊 Agent Output:', result.data?.agent_output?.slice(0, 200) + '...');
    
    return result;
    
  } catch (error) {
    console.error('❌ MJML Rendering test failed:', error);
    throw error;
  }
}

async function testDesignSpecialistFileSaving() {
  console.log('\n💾 ТЕСТИРОВАНИЕ DESIGN SPECIALIST - FILE SAVING');
  console.log('=' .repeat(60));
  
  try {
    const fileSavingInput = {
      task_type: 'render_email',
      content_package: {
        content: {
          subject: 'Тест сохранения файлов',
          body: 'Проверяем сохранение HTML и MJML файлов в папку кампании',
          cta: 'Открыть файлы'
        }
      },
      campaign_context: {
        campaign_id: `test_campaign_${Date.now()}`,
        performance_session: `test_session_${Date.now()}`
      },
      rendering_requirements: {
        save_html: true,
        save_mjml: true,
        save_assets: true
      }
    };
    
    console.log('📊 Input данные:', JSON.stringify(fileSavingInput, null, 2));
    
    const response = await fetch('http://localhost:3000/api/agent/design-specialist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fileSavingInput)
    });
    
    const result = await response.json();
    
    console.log('\n✅ РЕЗУЛЬТАТ FILE SAVING:');
    console.log('📊 Success:', result.data?.success);
    console.log('📊 Files Saved:', result.data?.design_artifacts?.assets_used?.length || 0);
    console.log('📊 Campaign ID:', result.data?.campaign_context?.campaign_id);
    console.log('📊 Agent Output:', result.data?.agent_output?.slice(0, 200) + '...');
    
    return result;
    
  } catch (error) {
    console.error('❌ File Saving test failed:', error);
    throw error;
  }
}

async function testDesignSpecialistAssetSelection() {
  console.log('\n🖼️ ТЕСТИРОВАНИЕ DESIGN SPECIALIST - ASSET SELECTION');
  console.log('=' .repeat(60));
  
  try {
    const assetInput = {
      task_type: 'find_assets',
      content_package: {
        content: {
          subject: 'Путешествие в Турцию',
          body: 'Красивые пляжи и исторические места'
        }
      },
      asset_requirements: {
        hero_assets: ['турция', 'пляж', 'море'],
        content_assets: ['самолет', 'путешествие'],
        footer_assets: ['логотип', 'контакты']
      }
    };
    
    console.log('📊 Input данные:', JSON.stringify(assetInput, null, 2));
    
    const response = await fetch('http://localhost:3000/api/agent/design-specialist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assetInput)
    });
    
    const result = await response.json();
    
    console.log('\n✅ РЕЗУЛЬТАТ ASSET SELECTION:');
    console.log('📊 Success:', result.data?.success);
    console.log('📊 Assets Found:', result.data?.results?.assets ? 'Yes' : 'No');
    console.log('📊 Agent Output:', result.data?.agent_output?.slice(0, 200) + '...');
    
    return result;
    
  } catch (error) {
    console.error('❌ Asset Selection test failed:', error);
    throw error;
  }
}

async function runAllDesignTests() {
  console.log('🚀 ЗАПУСК ВСЕХ ТЕСТОВ DESIGN SPECIALIST');
  console.log('=' .repeat(80));
  
  try {
    // 1. Тест MJML rendering
    await testDesignSpecialistMJML();
    
    // 2. Тест file saving
    await testDesignSpecialistFileSaving();
    
    // 3. Тест asset selection
    await testDesignSpecialistAssetSelection();
    
    console.log('\n🎉 ВСЕ ТЕСТЫ DESIGN SPECIALIST ЗАВЕРШЕНЫ УСПЕШНО!');
    console.log('📊 Проверьте OpenAI Dashboard для детального трейсинга');
    
  } catch (error) {
    console.error('\n❌ ОШИБКА В ТЕСТАХ DESIGN SPECIALIST:', error);
  }
}

// Запуск тестов
runAllDesignTests().catch(console.error); 