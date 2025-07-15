/**
 * Test new tag-based approach for asset selection
 */

import { selectFigmaAssetsWithAI } from '../src/agent/tools/asset-preparation/ai-analysis';

const mockContentContext = {
  generated_content: {
    subject: "🌟 Специальное предложение на авиабилеты в Гватемалу этой осенью!",
    body: "Откройте для себя красоты Гватемалы в самое лучшее время года! Теплая осенняя погода, яркие краски природы и незабываемые приключения ждут вас.",
    cta_buttons: [{ text: "Забронировать сейчас", url: "#" }]
  },
  campaign_type: "promotional",
  target_audience: "travel_enthusiasts",
  language: "ru"
};

const mockAiAnalysis = {
  destinations: [{ name: "Гватемала", season: "осень" }],
  image_requirements: [
    { type: "hero", purpose: "main travel visual", emotional_tone: "adventure" }
  ]
};

const mockFigmaTags = {
  folders: {
    "иллюстрации": {
      description: "Декоративные и концептуальные изображения",
      tags: ["путешествия", "авиация", "приключение", "природа", "пейзаж"],
      files_count: 136
    },
    "зайцы-общие": {
      description: "Основные персонажи и общие концепции", 
      tags: ["путешествие", "отдых", "веселый", "дружелюбный"],
      files_count: 122
    },
    "айдентика": {
      description: "Брендинг и корпоративная айдентика",
      tags: ["авиабилеты", "авиация", "бренд", "логотип"],
      files_count: 22
    }
  },
  most_common_tags: {
    "путешествия": 7,
    "авиация": 4,
    "акция": 6,
    "приключение": 3
  }
};

async function testNewApproach() {
  console.log('🧪 Testing new tag-based approach...');
  
  try {
    const result = await selectFigmaAssetsWithAI(
      mockAiAnalysis,
      mockFigmaTags, 
      mockContentContext
    );
    
    console.log('✅ Success! AI selected:');
    console.log('Tags:', result[0].tags);
    console.log('Folders:', result[0].folders);
    console.log('Reasoning:', result[0].reasoning);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Uncomment to run test:
// testNewApproach(); 