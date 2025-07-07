#!/usr/bin/env node

/**
 * Fix Zod schemas for OpenAI Agents SDK compatibility
 * OpenAI requires .optional() fields to also have .nullable()
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Zod schemas for OpenAI Agents SDK compatibility...');

// Replacement patterns
const replacements = [
  // Basic cases: .optional().describe( → .nullable().optional().describe(
  {
    pattern: /\.optional\(\)\.describe\(/g,
    replacement: '.nullable().optional().describe(',
    description: '.optional().describe() → .nullable().optional().describe()'
  },
  
  // Object endings: }).optional().describe( → }).nullable().optional().describe(
  {
    pattern: /\}\)\.optional\(\)\.describe\(/g,
    replacement: '}).nullable().optional().describe(',
    description: '}).optional().describe() → }).nullable().optional().describe()'
  },
  
  // Array endings: ])).optional().describe( → ])).nullable().optional().describe(
  {
    pattern: /\]\)\)\.optional\(\)\.describe\(/g,
    replacement: '])).nullable().optional().describe(',
    description: '])).optional().describe() → ])).nullable().optional().describe()'
  },
  
  // Enum endings: ]).optional().describe( → ]).nullable().optional().describe(
  {
    pattern: /\]\)\.optional\(\)\.describe\(/g,
    replacement: ']).nullable().optional().describe(',
    description: ']).optional().describe() → ]).nullable().optional().describe()'
  },
  
  // Simple cases without describe: .optional(), → .nullable().optional(),
  {
    pattern: /\.optional\(\),(?!\s*\.nullable\(\))/g,
    replacement: '.nullable().optional(),',
    description: '.optional(), → .nullable().optional(),'
  },
  
  // End of line cases: .optional() at end → .nullable().optional()
  {
    pattern: /\.optional\(\)$/gm,
    replacement: '.nullable().optional()',
    description: '.optional() at end → .nullable().optional()'
  },
  
  // Before closing brace: .optional() before } → .nullable().optional()
  {
    pattern: /\.optional\(\)(\s*\})/g,
    replacement: '.nullable().optional()$1',
    description: '.optional() before } → .nullable().optional()'
  }
];

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and test directories
      if (file !== 'node_modules' && file !== '.git' && !file.includes('test')) {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      // Skip test files
      if (!file.includes('.test.') && !file.includes('.spec.')) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Skip files that don't use Zod
    if (!content.includes('z.') && !content.includes('zod')) {
      return false;
    }
    
    // Apply all replacements
    for (const { pattern, replacement, description } of replacements) {
      const before = content;
      content = content.replace(pattern, replacement);
      if (content !== before) {
        modified = true;
        console.log(`  ✅ Applied: ${description} in ${filePath}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  try {
    const files = getAllFiles('./src');
    console.log(`📁 Found ${files.length} files to check`);
    
    let modifiedCount = 0;
    
    for (const file of files) {
      const wasModified = fixFile(file);
      if (wasModified) {
        modifiedCount++;
      }
    }
    
    console.log(`\n✨ Fixed ${modifiedCount} files`);
    console.log('🎯 All Zod schemas should now be OpenAI Agents SDK compatible!');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

main(); 