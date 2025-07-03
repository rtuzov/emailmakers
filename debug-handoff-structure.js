// Debug file для записи handoff данных
const fs = require('fs');

// Функция для записи debug данных
function writeDebugData(filename, data) {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`✅ Debug data written to ${filename}`);
  } catch (error) {
    console.error(`❌ Failed to write debug data: ${error.message}`);
  }
}

module.exports = { writeDebugData }; 