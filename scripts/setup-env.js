#!/usr/bin/env node

/**
 * Environment Setup Script for Email-Makers Agent
 * This script helps create a .env.local file with the minimum required configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupEnvironment() {
  console.log('🚀 Email-Makers Agent Environment Setup\n');
  console.log('This script will help you create a .env.local file with the required configuration.\n');

  // Check if .env.local already exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await askQuestion('⚠️  .env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('Please provide your API keys (leave blank to skip optional services):\n');

  // Required: OpenAI API Key
  let openaiKey = '';
  while (!openaiKey) {
    openaiKey = await askQuestion('🔑 OpenAI API Key (required): ');
    if (!openaiKey) {
      console.log('❌ OpenAI API key is required for the agent to function.');
    }
  }

  // Optional: Other services
  const anthropicKey = await askQuestion('🔑 Anthropic API Key (optional): ');
  const figmaToken = await askQuestion('🔑 Figma Access Token (optional): ');
  const figmaProjectId = await askQuestion('🔑 Figma Project ID (optional): ');
  const unsplashKey = await askQuestion('🔑 Unsplash Access Key (optional): ');
  const kupibiletKey = await askQuestion('🔑 Kupibilet API Key (optional): ');

  // Generate secure secrets
  const nextAuthSecret = generateSecret(32);
  const jwtSecret = generateSecret(32);
  const encryptionKey = generateSecret(32);

  // Create .env.local content
  const envContent = `# Email-Makers Agent Environment Configuration
# Generated on ${new Date().toISOString()}

# Application Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Required: OpenAI API Key
OPENAI_API_KEY=${openaiKey}

# Optional: Fallback and Enhancement Services
ANTHROPIC_API_KEY=${anthropicKey}
FIGMA_ACCESS_TOKEN=${figmaToken}
FIGMA_PROJECT_ID=${figmaProjectId}
UNSPLASH_ACCESS_KEY=${unsplashKey}
KUPIBILET_API_KEY=${kupibiletKey}

# Security Keys (auto-generated)
NEXTAUTH_SECRET=${nextAuthSecret}
JWT_SECRET=${jwtSecret}
ENCRYPTION_KEY=${encryptionKey}

# Development Settings
DEBUG=true
LOG_LEVEL=info
NEXT_TELEMETRY_DISABLED=1
`;

  // Write to .env.local
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env.local file created successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • OpenAI API Key: ${openaiKey ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   • Anthropic API Key: ${anthropicKey ? '✅ Configured' : '⚪ Optional (skipped)'}`);
    console.log(`   • Figma Integration: ${figmaToken ? '✅ Configured' : '⚪ Optional (skipped)'}`);
    console.log(`   • Unsplash Images: ${unsplashKey ? '✅ Configured' : '⚪ Optional (skipped)'}`);
    console.log(`   • Kupibilet Prices: ${kupibiletKey ? '✅ Configured' : '⚪ Optional (skipped)'}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Test the agent at: http://localhost:3000/api/agent/run');
    console.log('3. Check the API documentation for usage examples');
    
    if (!anthropicKey || !figmaToken || !unsplashKey || !kupibiletKey) {
      console.log('\n💡 Tips:');
      console.log('   • The agent will work with just OpenAI, but additional services enhance quality');
      console.log('   • Figma integration provides brand-consistent assets');
      console.log('   • Unsplash provides fallback images when Figma is unavailable');
      console.log('   • Kupibilet API provides real flight prices');
    }

  } catch (error) {
    console.error('❌ Error creating .env.local file:', error.message);
  }

  rl.close();
}

function generateSecret(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Run the setup
setupEnvironment().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
}); 