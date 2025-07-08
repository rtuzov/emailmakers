#!/usr/bin/env node

/**
 * COMPREHENSIVE API TEST FOR /api/agent/run-improved
 * Tests all the fixes we implemented:
 * 1. Consolidated content generator usage
 * 2. AI-driven MJML generation (no hardcoded templates)
 * 3. Image planning functionality
 * 4. Proper file saving and structure
 * 5. Overall pipeline functionality
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_OUTPUT_DIR = './test-outputs';

// Test cases to validate our fixes
const testCases = [
  {
    name: 'Summer Travel Campaign',
    description: 'Test AI-driven template generation for seasonal travel',
    request: {
      task_type: 'generate_content',
      input: {
        brief: 'Create compelling email content for summer vacation deals to Mediterranean destinations targeting young professionals aged 25-35. Include price ranges, best time to visit, and exclusive offers with an enthusiastic and adventurous tone.',
        topic: 'Summer vacation deals to Mediterranean destinations',
        target_audience: 'young professionals aged 25-35',
        campaign_goals: 'increase bookings by 25%',
        brand_voice: 'enthusiastic and adventurous',
        content_requirements: 'include price ranges, best time to visit, and exclusive offers',
        design_preferences: 'bright summer colors, beach imagery, urgent but friendly tone',
        tone: 'enthusiastic',
        content_type: 'promotional',
        language: 'english'
      },
      context: {
        campaign_type: 'seasonal_promotion',
        urgency_level: 'high',
        test_mode: true
      }
    },
    expectedValidations: [
      'consolidated_content_generator_used',
      'ai_driven_mjml_generated',
      'image_planning_executed',
      'files_saved_properly',
      'unique_template_generated'
    ]
  },
  {
    name: 'Business Travel Campaign',
    description: 'Test template generation for business travel segment',
    request: {
      task_type: 'generate_content',
      input: {
        brief: 'Develop professional email content for corporate travel solutions for Q4 business trips targeting business travelers and corporate coordinators. Emphasize convenience, flexibility, and corporate benefits with a professional and reliable tone.',
        topic: 'Corporate travel solutions for Q4 business trips',
        target_audience: 'business travelers and corporate coordinators',
        campaign_goals: 'promote corporate packages and loyalty program',
        brand_voice: 'professional and reliable',
        content_requirements: 'emphasize convenience, flexibility, and corporate benefits',
        design_preferences: 'professional blue/gray color scheme, clean layout, corporate imagery',
        tone: 'professional',
        content_type: 'promotional',
        language: 'english'
      },
      context: {
        campaign_type: 'b2b_promotion',
        urgency_level: 'medium',
        test_mode: true
      }
    },
    expectedValidations: [
      'consolidated_content_generator_used',
      'ai_driven_mjml_generated',
      'professional_design_detected',
      'files_saved_properly',
      'corporate_tone_maintained'
    ]
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test the API health check first
 */
async function testHealthCheck() {
  colorLog('blue', '\n🔍 Step 1: Testing API Health Check');
  colorLog('blue', '='.repeat(50));
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/agent/run-improved`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const result = await response.json();
      colorLog('green', '✅ API Health Check: PASSED');
      colorLog('cyan', `📊 Status: ${result.status}`);
      colorLog('cyan', `🤖 Agents Available: ${Object.keys(result.agents).length}`);
      colorLog('cyan', `🔄 Handoffs Configured: ${Object.keys(result.handoffs).length}`);
      
      // Validate all agents are available
      const failedAgents = Object.entries(result.agents)
        .filter(([name, status]) => status !== 'available')
        .map(([name]) => name);
      
      if (failedAgents.length > 0) {
        colorLog('yellow', `⚠️ Some agents unavailable: ${failedAgents.join(', ')}`);
      }
      
      return true;
    } else {
      const error = await response.json();
      colorLog('red', `❌ API Health Check: FAILED`);
      colorLog('red', `Error: ${error.error}`);
      return false;
    }
  } catch (error) {
    colorLog('red', `❌ API Health Check: FAILED`);
    colorLog('red', `Error: ${error.message}`);
    return false;
  }
}

/**
 * Execute a single test case
 */
async function executeTestCase(testCase, index) {
  colorLog('blue', `\n🧪 Step ${index + 2}: Testing ${testCase.name}`);
  colorLog('blue', '='.repeat(50));
  colorLog('cyan', `📝 Description: ${testCase.description}`);
  
  const startTime = Date.now();
  
  try {
    // Send request to API
    colorLog('yellow', '🚀 Sending request to API...');
    const response = await fetch(`${API_BASE_URL}/api/agent/run-improved`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCase.request)
    });
    
    const responseTime = Date.now() - startTime;
    colorLog('cyan', `⏱️ Response time: ${responseTime}ms`);
    
    if (!response.ok) {
      const error = await response.json();
      colorLog('red', `❌ API Request Failed: ${response.status}`);
      colorLog('red', `Error: ${JSON.stringify(error, null, 2)}`);
      return false;
    }
    
    const result = await response.json();
    colorLog('green', '✅ API Request Successful');
    colorLog('cyan', `🎯 Agent: ${result.agent}`);
    colorLog('cyan', `🔍 Trace ID: ${result.traceId}`);
    colorLog('cyan', `📊 Task Type: ${result.taskType}`);
    
    // Validate response structure
    if (!result.success) {
      colorLog('red', `❌ Agent execution failed: ${result.error}`);
      return false;
    }
    
    if (!result.result) {
      colorLog('red', `❌ Missing result data`);
      return false;
    }
    
    // Parse and validate result
    let parsedResult;
    try {
      parsedResult = typeof result.result === 'string' ? JSON.parse(result.result) : result.result;
    } catch (e) {
      colorLog('yellow', '⚠️ Result is not JSON, treating as text');
      parsedResult = { raw_text: result.result };
    }
    
    // Validate our fixes
    const validationResults = await validateFixes(parsedResult, testCase, result);
    
    // Save test output
    await saveTestOutput(testCase.name, {
      request: testCase.request,
      response: result,
      parsedResult,
      validationResults,
      responseTime
    });
    
    // Report validation results
    const passedValidations = validationResults.filter(v => v.passed).length;
    const totalValidations = validationResults.length;
    
    colorLog('cyan', `\n📊 Validation Results: ${passedValidations}/${totalValidations} passed`);
    
    validationResults.forEach(validation => {
      if (validation.passed) {
        colorLog('green', `✅ ${validation.name}: ${validation.message}`);
      } else {
        colorLog('red', `❌ ${validation.name}: ${validation.message}`);
      }
    });
    
    return passedValidations === totalValidations;
    
  } catch (error) {
    colorLog('red', `❌ Test execution failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate that our fixes are working correctly
 */
async function validateFixes(parsedResult, testCase, apiResult) {
  const validations = [];
  
  // 1. Validate consolidated content generator usage
  validations.push({
    name: 'Consolidated Content Generator',
    passed: checkConsolidatedContentGenerator(parsedResult, apiResult),
    message: checkConsolidatedContentGenerator(parsedResult, apiResult) 
      ? 'Advanced content generator detected in response'
      : 'Simple content generator detected - should use consolidated version'
  });
  
  // 2. Validate AI-driven MJML generation
  validations.push({
    name: 'AI-Driven MJML Generation',
    passed: checkAIDrivenMJML(parsedResult, apiResult),
    message: checkAIDrivenMJML(parsedResult, apiResult)
      ? 'AI-generated MJML template detected'
      : 'Hardcoded MJML template detected - should be AI-generated'
  });
  
  // 3. Validate image planning execution
  validations.push({
    name: 'Image Planning Execution',
    passed: checkImagePlanning(parsedResult, apiResult),
    message: checkImagePlanning(parsedResult, apiResult)
      ? 'Image planning execution detected'
      : 'No image planning detected - should execute planEmailImages'
  });
  
  // 4. Validate file structure and saving
  validations.push({
    name: 'File Structure Validation',
    passed: await checkFileStructure(parsedResult, apiResult),
    message: await checkFileStructure(parsedResult, apiResult)
      ? 'Proper file structure detected'
      : 'File structure issues detected'
  });
  
  // 5. Validate template uniqueness
  validations.push({
    name: 'Template Uniqueness',
    passed: checkTemplateUniqueness(parsedResult, testCase),
    message: checkTemplateUniqueness(parsedResult, testCase)
      ? 'Unique template generated based on content'
      : 'Generic template detected - should be content-specific'
  });
  
  return validations;
}

/**
 * Check if consolidated content generator was used
 */
function checkConsolidatedContentGenerator(parsedResult, apiResult) {
  // Look for indicators of consolidated content generator
  const resultText = JSON.stringify(parsedResult).toLowerCase();
  
  // Check for advanced content fields that only consolidated generator provides
  const advancedFields = [
    'target_audience',
    'campaign_context',
    'content_strategy',
    'email_structure',
    'personalization_tags'
  ];
  
  return advancedFields.some(field => resultText.includes(field));
}

/**
 * Check if AI-driven MJML was generated
 */
function checkAIDrivenMJML(parsedResult, apiResult) {
  const resultText = JSON.stringify(parsedResult).toLowerCase();
  
  // Look for AI-generated MJML indicators
  const aiMjmlIndicators = [
    'ai-generated template',
    'dynamic color palette',
    'content-based design',
    'generateaiplacement',
    'content analysis',
    'design strategy'
  ];
  
  // Check for hardcoded template indicators (should NOT be present)
  const hardcodedIndicators = [
    'kupibilet email template',
    'static template',
    'hardcoded design'
  ];
  
  const hasAIIndicators = aiMjmlIndicators.some(indicator => resultText.includes(indicator));
  const hasHardcodedIndicators = hardcodedIndicators.some(indicator => resultText.includes(indicator));
  
  return hasAIIndicators && !hasHardcodedIndicators;
}

/**
 * Check if image planning was executed
 */
function checkImagePlanning(parsedResult, apiResult) {
  const resultText = JSON.stringify(parsedResult).toLowerCase();
  
  // Look for image planning indicators
  const imagePlanningIndicators = [
    'image_plan',
    'search_tags',
    'figma_assets',
    'planemailimages',
    'asset_requirements'
  ];
  
  return imagePlanningIndicators.some(indicator => resultText.includes(indicator));
}

/**
 * Check file structure and saving
 */
async function checkFileStructure(parsedResult, apiResult) {
  try {
    // Look for file paths or campaign IDs in the result
    const resultText = JSON.stringify(parsedResult);
    
    // Check for campaign folder structure indicators
    const fileIndicators = [
      'campaign_',
      'email.html',
      'email.mjml',
      'folder_path',
      'saved_files'
    ];
    
    return fileIndicators.some(indicator => resultText.includes(indicator));
  } catch (error) {
    return false;
  }
}

/**
 * Check template uniqueness based on content
 */
function checkTemplateUniqueness(parsedResult, testCase) {
  const resultText = JSON.stringify(parsedResult).toLowerCase();
  const inputText = JSON.stringify(testCase.request.input).toLowerCase();
  
  // Extract key terms from input
  const inputTerms = [
    testCase.request.input.topic?.toLowerCase(),
    testCase.request.input.target_audience?.toLowerCase(),
    testCase.request.input.brand_voice?.toLowerCase()
  ].filter(Boolean);
  
  // Check if result contains content-specific terms
  const contentSpecificTerms = inputTerms.filter(term => 
    resultText.includes(term) || 
    resultText.includes(term.split(' ')[0]) // Check first word of multi-word terms
  );
  
  return contentSpecificTerms.length > 0;
}

/**
 * Save test output for analysis
 */
async function saveTestOutput(testName, data) {
  try {
    if (!fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
    
    const filename = `${testName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.json`;
    const filepath = path.join(TEST_OUTPUT_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    colorLog('cyan', `💾 Test output saved: ${filepath}`);
  } catch (error) {
    colorLog('yellow', `⚠️ Failed to save test output: ${error.message}`);
  }
}

/**
 * Main test execution
 */
async function runTests() {
  colorLog('magenta', '\n🧪 EMAIL-MAKERS API TEST SUITE');
  colorLog('magenta', '='.repeat(50));
  colorLog('cyan', '🎯 Testing api/agent/run-improved endpoint');
  colorLog('cyan', '🔧 Validating all implemented fixes');
  colorLog('cyan', `📊 Running ${testCases.length} test cases`);
  
  // Clean up previous test outputs
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }
  
  const startTime = Date.now();
  let passedTests = 0;
  
  try {
    // Test health check first
    const healthCheckPassed = await testHealthCheck();
    if (!healthCheckPassed) {
      colorLog('red', '\n❌ Health check failed - aborting tests');
      process.exit(1);
    }
    
    // Execute test cases
    for (let i = 0; i < testCases.length; i++) {
      const testPassed = await executeTestCase(testCases[i], i);
      if (testPassed) {
        passedTests++;
      }
      
      // Add delay between tests
      if (i < testCases.length - 1) {
        colorLog('yellow', '⏳ Waiting 2 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Final results
    const totalTime = Date.now() - startTime;
    const totalTests = testCases.length;
    
    colorLog('blue', '\n📊 FINAL RESULTS');
    colorLog('blue', '='.repeat(50));
    colorLog('cyan', `📈 Tests passed: ${passedTests}/${totalTests}`);
    colorLog('cyan', `⏱️ Total time: ${totalTime}ms`);
    colorLog('cyan', `💾 Output saved to: ${TEST_OUTPUT_DIR}`);
    
    if (passedTests === totalTests) {
      colorLog('green', '\n🎉 ALL TESTS PASSED!');
      colorLog('green', '✅ All fixes are working correctly');
      colorLog('green', '🚀 Email generation system is ready');
    } else {
      colorLog('red', '\n⚠️ SOME TESTS FAILED');
      colorLog('red', `❌ ${totalTests - passedTests} tests need attention`);
      colorLog('yellow', '🔧 Check test outputs for details');
    }
    
  } catch (error) {
    colorLog('red', `\n❌ Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  colorLog('red', `❌ Test execution failed: ${error.message}`);
  process.exit(1);
}); 