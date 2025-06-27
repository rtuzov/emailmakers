/**
 * QA Integration Test - Email-Makers
 * Tests T11 quality validation and quality gates
 */

// Import using ES modules syntax for TypeScript compatibility
import('../src/agent/tools/quality-validation.js').then(({ qualityValidation }) => {
  
  // Test data: Low quality email that should fail quality gate
  const lowQualityEmailTest = {
    html_content: `
      <div>
        <p>Bad email with no tables, no proper structure</p>
        <img src="broken-link.jpg">
        <a href="#">Click here</a>
      </div>
    `,
    mjml_source: `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Bad email content</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    topic: "Test Low Quality Email",
    assets_used: {
      original_assets: [],
      processed_assets: []
    },
    campaign_metadata: {
      prices: null,
      content: {
        subject: "Test",
        tone: "neutral",
        language: "en",
        word_count: 10
      },
      generation_time: 1000
    },
    render_test_results: {
      overall_score: 45, // Low score
      client_compatibility: {
        "Gmail": 40,
        "Outlook": 30
      },
      issues_found: ["No table structure", "Missing alt attributes", "Poor accessibility"]
    }
  };

  // Test data: High quality email that should pass quality gate
  const highQualityEmailTest = {
    html_content: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html>
        <body>
          <table width="600" style="margin: 0 auto;">
            <tr>
              <td>
                <h1 style="color: #333; font-family: Arial, sans-serif;">Great Email</h1>
                <p style="color: #666; font-family: Arial, sans-serif;">Well structured content with proper email markup.</p>
                <img src="rabbit-happy.png" alt="Happy rabbit" width="100" height="100" style="display: block;">
                <a href="https://example.com" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none;">Book Now</a>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    mjml_source: `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text font-family="Arial, sans-serif" color="#333">
                <h1>Great Email</h1>
                <p>Well structured content with proper email markup.</p>
              </mj-text>
              <mj-image src="rabbit-happy.png" alt="Happy rabbit" width="100px" height="100px"></mj-image>
              <mj-button background-color="#007bff" color="white" href="https://example.com">Book Now</mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    topic: "Flight deals to Paris",
    assets_used: {
      original_assets: ["rabbit-happy.png"],
      processed_assets: ["rabbit-happy.png"]
    },
    campaign_metadata: {
      prices: {
        origin: "Moscow",
        destination: "Paris", 
        cheapest_price: 25000,
        currency: "RUB",
        date_range: "March 2025"
      },
      content: {
        subject: "Amazing Paris deals - Book now!",
// Test data: Low quality email that should fail quality gate
const lowQualityEmailTest = {
  html_content: `
    <div>
      <p>Bad email with no tables, no proper structure</p>
      <img src="broken-link.jpg">
      <a href="#">Click here</a>
    </div>
  `,
  mjml_source: `
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>Bad email content</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `,
  topic: "Test Low Quality Email",
  assets_used: {
    original_assets: [],
    processed_assets: []
  },
  campaign_metadata: {
    prices: null,
    content: {
      subject: "Test",
      tone: "neutral",
      language: "en",
      word_count: 10
    },
    generation_time: 1000
  },
  render_test_results: {
    overall_score: 45, // Low score
    client_compatibility: {
      "Gmail": 40,
      "Outlook": 30
    },
    issues_found: ["No table structure", "Missing alt attributes", "Poor accessibility"]
  }
};

// Test data: High quality email that should pass quality gate
const highQualityEmailTest = {
  html_content: `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html>
      <body>
        <table width="600" style="margin: 0 auto;">
          <tr>
            <td>
              <h1 style="color: #333; font-family: Arial, sans-serif;">Great Email</h1>
              <p style="color: #666; font-family: Arial, sans-serif;">Well structured content with proper email markup.</p>
              <img src="rabbit-happy.png" alt="Happy rabbit" width="100" height="100" style="display: block;">
              <a href="https://example.com" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none;">Book Now</a>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `,
  mjml_source: `
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text font-family="Arial, sans-serif" color="#333">
              <h1>Great Email</h1>
              <p>Well structured content with proper email markup.</p>
            </mj-text>
            <mj-image src="rabbit-happy.png" alt="Happy rabbit" width="100px" height="100px"></mj-image>
            <mj-button background-color="#007bff" color="white" href="https://example.com">Book Now</mj-button>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `,
  topic: "Flight deals to Paris",
  assets_used: {
    original_assets: ["rabbit-happy.png"],
    processed_assets: ["rabbit-happy.png"]
  },
  campaign_metadata: {
    prices: {
      origin: "Moscow",
      destination: "Paris", 
      cheapest_price: 25000,
      currency: "RUB",
      date_range: "March 2025"
    },
    content: {
      subject: "Amazing Paris deals - Book now!",
      tone: "promotional",
      language: "en",
      word_count: 25
    },
    generation_time: 2500
  },
  render_test_results: {
    overall_score: 95, // High score
    client_compatibility: {
      "Gmail": 98,
      "Outlook": 92,
      "Apple Mail": 96
    },
    issues_found: []
  }
};

async function testQualityGates() {
  console.log('🔍 Testing Email-Makers QA Integration\n');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Low quality email (should fail)
    console.log('\n📧 TEST 1: Low Quality Email (Should FAIL Quality Gate)');
    console.log('-'.repeat(30));
    
    const lowQualityResult = await qualityValidation(lowQualityEmailTest);
    console.log(lowQualityResult);
    
    // Check if quality gate failed as expected
    const lowQualityPassed = lowQualityResult.includes('Quality Gate: ✅ PASSED');
    const lowQualityFailed = lowQualityResult.includes('Quality Gate: ❌ FAILED');
    
    console.log(`\n🎯 Expected: Quality Gate FAILED`);
    console.log(`📊 Actual: Quality Gate ${lowQualityFailed ? 'FAILED ✅' : 'PASSED ❌'}`);
    console.log(`✅ Test 1 Result: ${lowQualityFailed ? 'PASSED' : 'FAILED'}`);
    
    console.log('\n' + '='.repeat(50));
    
    // Test 2: High quality email (should pass)
    console.log('\n📧 TEST 2: High Quality Email (Should PASS Quality Gate)');
    console.log('-'.repeat(30));
    
    const highQualityResult = await qualityValidation(highQualityEmailTest);
    console.log(highQualityResult);
    
    // Check if quality gate passed as expected
    const highQualityPassed = highQualityResult.includes('Quality Gate: ✅ PASSED');
    const highQualityFailed = highQualityResult.includes('Quality Gate: ❌ FAILED');
    
    console.log(`\n🎯 Expected: Quality Gate PASSED`);
    console.log(`📊 Actual: Quality Gate ${highQualityPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`✅ Test 2 Result: ${highQualityPassed ? 'PASSED' : 'FAILED'}`);
    
    console.log('\n' + '='.repeat(50));
    
    // Overall test results
    console.log('\n🏆 QA INTEGRATION TEST RESULTS');
    console.log('-'.repeat(30));
    
    const test1Passed = lowQualityFailed;
    const test2Passed = highQualityPassed;
    const allTestsPassed = test1Passed && test2Passed;
    
    console.log(`Test 1 (Low Quality): ${test1Passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Test 2 (High Quality): ${test2Passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`\n🎯 Overall QA Integration: ${allTestsPassed ? '✅ WORKING CORRECTLY' : '❌ NEEDS FIXES'}`);
    
    if (allTestsPassed) {
      console.log('\n🎉 SUCCESS: Quality gates are working correctly!');
      console.log('   - Low quality emails are blocked');
      console.log('   - High quality emails are approved');
      console.log('   - T11 quality validation is functioning as designed');
    } else {
      console.log('\n⚠️  WARNING: Quality gates need attention!');
      console.log('   - Quality validation may not be blocking properly');
      console.log('   - Check T11 integration and scoring logic');
    }
    
  } catch (error) {
    console.error('\n❌ QA Integration Test Failed:', error.message);
    console.log('\n🔧 Possible Issues:');
    console.log('   - Quality validation service not available');
    console.log('   - Missing dependencies or configuration');
    console.log('   - Integration problems in T11 tool');
  }
}

// Run the test
testQualityGates(); 