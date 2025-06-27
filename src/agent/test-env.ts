#!/usr/bin/env tsx

// Load environment variables manually
import { config } from 'dotenv';
import path from 'path';

// Load .env.local file
config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔍 Environment Variable Test');
console.log('============================');

const envVars = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'FIGMA_ACCESS_TOKEN',
  'KUPIBILET_API_KEY',
  'UNSPLASH_ACCESS_KEY',
  'PERCY_TOKEN',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n🧪 Testing OpenAI API connection...');

if (process.env.OPENAI_API_KEY) {
  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('✅ OpenAI client created successfully');
    
    // Test a simple completion
    openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "Hello" in one word' }],
      max_tokens: 5
    }).then((response: any) => {
      console.log('✅ OpenAI API test successful:', response.choices[0]?.message?.content);
    }).catch((error: any) => {
      console.log('❌ OpenAI API test failed:', error.message);
    });
    
  } catch (error: any) {
    console.log('❌ OpenAI client creation failed:', error.message);
  }
} else {
  console.log('❌ OPENAI_API_KEY not available for testing');
} 