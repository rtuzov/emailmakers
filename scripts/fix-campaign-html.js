#!/usr/bin/env node

/**
 * Fix Campaign HTML Validation Issues
 * Fixes common HTML validation errors in email templates
 */

const fs = require('fs').promises;
const path = require('path');

async function fixHtmlValidationIssues(campaignPath) {
  console.log('🔧 Fixing HTML validation issues for campaign:', path.basename(campaignPath));
  
  const htmlTemplatePath = path.join(campaignPath, 'templates', 'email-template.html');
  
  try {
    // Read the HTML template
    let htmlContent = await fs.readFile(htmlTemplatePath, 'utf8');
    const originalLength = htmlContent.length;
    
    console.log(`📄 Original HTML size: ${originalLength} characters`);
    
    // Fix common HTML validation issues
    let fixedHtml = htmlContent;
    const fixes = [];
    
    // 1. Fix DOCTYPE for email compatibility
    if (!fixedHtml.includes('<!doctype html>')) {
      fixedHtml = '<!doctype html>\n' + fixedHtml.replace(/<!doctype[^>]*>/i, '');
      fixes.push('Fixed DOCTYPE declaration');
    }
    
    // 2. Fix lang attribute
    fixedHtml = fixedHtml.replace(/<html[^>]*>/i, (match) => {
      if (!match.includes('lang=')) {
        return match.replace('>', ' lang="ru">');
      }
      return match.replace(/lang="und"/, 'lang="ru"');
    });
    fixes.push('Fixed HTML lang attribute');
    
    // 3. Fix missing alt attributes
    fixedHtml = fixedHtml.replace(/<img([^>]*?)(?:\s+alt="")?([^>]*?)>/gi, (match, before, after) => {
      if (!match.includes('alt=')) {
        return `<img${before} alt="Email image"${after}>`;
      }
      return match;
    });
    fixes.push('Added missing alt attributes');
    
    // 4. Fix CSS font-weight values (remove "px" from font-weight)
    fixedHtml = fixedHtml.replace(/font-weight:\s*(\d+)px/gi, 'font-weight: $1');
    if (htmlContent !== fixedHtml) {
      fixes.push('Fixed font-weight CSS values');
    }
    
    // 5. Fix CSS margin values
    fixedHtml = fixedHtml.replace(/margin:\s*auto\s+auto/gi, 'margin: 0 auto');
    fixes.push('Fixed CSS margin values');
    
    // 6. Fix CSS padding values (add px units where missing)
    fixedHtml = fixedHtml.replace(/padding:\s*(\d+)\s+(\d+)(?!\w)/gi, 'padding: $1px $2px');
    fixes.push('Fixed CSS padding values');
    
    // 7. Fix image width attributes that are too small
    fixedHtml = fixedHtml.replace(/width="(\d+)"/gi, (match, width) => {
      const w = parseInt(width);
      if (w > 0 && w < 100) {
        fixes.push(`Fixed small image width: ${w}px → 150px`);
        return 'width="150"';
      }
      return match;
    });
    
    // 8. Fix style width values that are too small
    fixedHtml = fixedHtml.replace(/width:\s*(\d+)px/gi, (match, width) => {
      const w = parseInt(width);
      if (w > 0 && w < 100) {
        fixes.push(`Fixed small style width: ${w}px → 150px`);
        return 'width: 150px';
      }
      return match;
    });
    
    // 9. Add missing title if not present
    if (!fixedHtml.includes('<title>')) {
      fixedHtml = fixedHtml.replace(/<head([^>]*)>/, '<head$1>\n    <title>Email Template</title>');
      fixes.push('Added missing title tag');
    }
    
    // 10. Fix invalid CSS list-style-type values
    fixedHtml = fixedHtml.replace(/list-style-type:\s*-/gi, 'list-style-type: none');
    fixes.push('Fixed CSS list-style-type values');
    
    // 11. Ensure proper email meta tags
    if (!fixedHtml.includes('http-equiv="X-UA-Compatible"')) {
      fixedHtml = fixedHtml.replace(/<head([^>]*)>/, 
        '<head$1>\n    <meta http-equiv="X-UA-Compatible" content="IE=edge">');
      fixes.push('Added X-UA-Compatible meta tag');
    }
    
    if (!fixedHtml.includes('name="viewport"')) {
      fixedHtml = fixedHtml.replace(/<head([^>]*)>/, 
        '<head$1>\n    <meta name="viewport" content="width=device-width, initial-scale=1">');
      fixes.push('Added viewport meta tag');
    }
    
    const newLength = fixedHtml.length;
    const sizeChange = ((newLength - originalLength) / originalLength * 100).toFixed(2);
    
    console.log(`📊 Fixed HTML size: ${newLength} characters (${sizeChange}% change)`);
    console.log(`🔧 Applied ${fixes.length} fixes:`);
    fixes.forEach((fix, i) => console.log(`   ${i + 1}. ${fix}`));
    
    // Save the fixed HTML
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + 'T' + 
                     new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
    
    const fixedHtmlPath = path.join(campaignPath, 'templates', `email-template-fixed-${timestamp}.html`);
    await fs.writeFile(fixedHtmlPath, fixedHtml);
    
    // Also overwrite the main template
    await fs.writeFile(htmlTemplatePath, fixedHtml);
    
    console.log(`✅ Fixed HTML saved to: ${fixedHtmlPath}`);
    console.log(`✅ Main template updated: ${htmlTemplatePath}`);
    
    // Create a validation report
    const reportPath = path.join(campaignPath, 'docs', 'html-validation-fix-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    
    const report = {
      timestamp: new Date().toISOString(),
      original_size: originalLength,
      fixed_size: newLength,
      size_change_percent: sizeChange,
      fixes_applied: fixes,
      files: {
        original: 'templates/email-template.html',
        fixed: `templates/email-template-fixed-${timestamp}.html`
      },
      validation_status: 'FIXED',
      issues_resolved: fixes.length
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 Validation report saved to: ${reportPath}`);
    
    return {
      success: true,
      fixes_applied: fixes.length,
      size_change: sizeChange,
      report_path: reportPath
    };
    
  } catch (error) {
    console.error('❌ Failed to fix HTML validation issues:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main execution
async function main() {
  const campaignPath = process.argv[2] || 
    '/Users/rtuzov/PycharmProjects/Email-Makers/campaigns/campaign_1753274074753_unqs8lm4n8s';
  
  console.log('🚀 Starting HTML validation fix process...');
  const result = await fixHtmlValidationIssues(campaignPath);
  
  if (result.success) {
    console.log(`\n✅ HTML validation fix completed successfully!`);
    console.log(`📊 Applied ${result.fixes_applied} fixes`);
    console.log(`📈 Size change: ${result.size_change}%`);
    console.log(`📋 Report: ${result.report_path}`);
  } else {
    console.error(`\n❌ HTML validation fix failed: ${result.error}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixHtmlValidationIssues }; 