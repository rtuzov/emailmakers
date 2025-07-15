/**
 * Test complete pipeline with final AI selection
 */

import { finalFileSelectionWithAI } from '../src/agent/tools/asset-preparation/ai-analysis';

const mockContentContext = {
  generated_content: {
    subject: "🌟 Специальное предложение на авиабилеты в Гватемалу этой осенью!",
    body: "Откройте для себя красоты Гватемалы в самое лучшее время года! Теплая осенняя погода, яркие краски природы и незабываемые приключения ждут вас. Забронируйте билеты со скидкой до 30%!",
    cta_buttons: [{ text: "Забронировать сейчас", url: "#" }]
  },
  campaign_type: "promotional",
  target_audience: "travel_enthusiasts",
  language: "ru"
};

const mockFoundFiles = [
  {
    filename: "авиабилет-путешествие.png",
    folder: "иллюстрации",
    score: 3,
    matchedTags: ["путешествия", "авиация", "билеты"],
    size: 28198
  },
  {
    filename: "иллюстрация-зеленого-зайца-с-покупками-символизирующая-шоппинг-и-акции.png", 
    folder: "зайцы-общие",
    score: 2,
    matchedTags: ["акции", "покупки"],
    size: 127151
  },
  {
    filename: "логотип-аэрофлота-ведущей-российской-авиакомпании.png",
    folder: "логотипы-ак", 
    score: 2,
    matchedTags: ["авиация", "логотип"],
    size: 15249
  },
  {
    filename: "предложение-о-бонусах-и-акциях-для-клиентов.png",
    folder: "иконки-допуслуг",
    score: 1,
    matchedTags: ["акции"],
    size: 4585
  },
  {
    filename: "предложение-о-кэшбэке-с-возможностью-вернуть-процент-от-покупок.png",
    folder: "иконки-допуслуг", 
    score: 1,
    matchedTags: ["покупки"],
    size: 6018
  }
];

async function testFinalSelection() {
  console.log('🧪 Testing final AI selection from found files...');
  console.log(`📁 Available files: ${mockFoundFiles.length}`);
  
  mockFoundFiles.forEach(file => {
    console.log(`   ${file.filename} (score: ${file.score}, size: ${Math.round(file.size/1024)}KB)`);
  });
  
  try {
    const finalSelection = await finalFileSelectionWithAI(
      mockFoundFiles,
      {},
      mockContentContext,
      2 // Максимум 2 файла
    );
    
    console.log('\n✅ Final AI Selection:');
    finalSelection.forEach((file, index) => {
      console.log(`${index + 1}. 📁 ${file.filename}`);
      console.log(`   📝 ${file.reasoning}`);
      console.log(`   📂 Folder: ${file.folder}\n`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Uncomment to run test:
// testFinalSelection(); 