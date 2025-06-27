import { ToolResult, handleToolError } from './index';

interface DiffParams {
  original_html: string;
  modified_html: string;
  tolerance?: number;
}

interface DiffResult {
  has_changes: boolean;
  change_percentage: number;
  significant_changes: string[];
  layout_regression: boolean;
  diff_report: string;
}

/**
 * T5: HTML Diff Tool
 * Detects layout regression between original and modified HTML
 */
export async function diffHtml(params: any): Promise<ToolResult> {
  try {
    console.log('T5: Analyzing HTML differences');

    // Handle both old and new parameter formats
    let originalHtml: string;
    let modifiedHtml: string;

    if (params.original_html && params.modified_html) {
      // New format
      originalHtml = params.original_html;
      modifiedHtml = params.modified_html;
    } else if (params.html) {
      // Old format - use baseline template
      originalHtml = getBaselineTemplate();
      modifiedHtml = params.html;
    } else {
      throw new Error('Either (original_html and modified_html) or html parameter is required');
    }

    const tolerance = params.tolerance || 0.01; // 1% default tolerance

    // Perform comprehensive HTML comparison
    const diffResult = await analyzeHtmlDifferences(
      originalHtml,
      modifiedHtml,
      tolerance
    );

    return {
      success: true,
      data: diffResult,
      metadata: {
        tolerance_threshold: tolerance,
        analysis_type: 'layout_regression',
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    return handleToolError('diff_html', error);
  }
}

async function analyzeHtmlDifferences(
  originalHtml: string,
  modifiedHtml: string,
  tolerance: number
): Promise<DiffResult> {
  
  // Structural analysis
  const structuralChanges = analyzeStructuralChanges(originalHtml, modifiedHtml);
  
  // Content analysis
  const contentChanges = analyzeContentChanges(originalHtml, modifiedHtml);
  
  // Style analysis
  const styleChanges = analyzeStyleChanges(originalHtml, modifiedHtml);
  
  // Calculate overall change percentage
  const changePercentage = calculateChangePercentage(structuralChanges, contentChanges, styleChanges);
  
  // Determine if there's layout regression
  const layoutRegression = changePercentage > tolerance;
  
  // Compile significant changes
  const significantChanges = [];
  if (structuralChanges.length > 0) {
    significantChanges.push(`Structural: ${structuralChanges.join(', ')}`);
  }
  if (contentChanges.length > 0) {
    significantChanges.push(`Content: ${contentChanges.join(', ')}`);
  }
  if (styleChanges.length > 0) {
    significantChanges.push(`Style: ${styleChanges.join(', ')}`);
  }

  // Generate diff report
  const diffReport = generateDiffReport(originalHtml, modifiedHtml, significantChanges);

  return {
    has_changes: changePercentage > 0,
    change_percentage: Math.round(changePercentage * 10000) / 100, // Round to 2 decimal places
    significant_changes: significantChanges,
    layout_regression: layoutRegression,
    diff_report: diffReport
  };
}

function analyzeStructuralChanges(original: string, modified: string): string[] {
  const changes: string[] = [];
  
  // Check for table structure changes (critical for email)
  const originalTables = (original.match(/<table[^>]*>/g) || []).length;
  const modifiedTables = (modified.match(/<table[^>]*>/g) || []).length;
  
  if (originalTables !== modifiedTables) {
    changes.push(`Table count changed: ${originalTables} → ${modifiedTables}`);
  }
  
  // Check for image changes
  const originalImages = (original.match(/<img[^>]*>/g) || []).length;
  const modifiedImages = (modified.match(/<img[^>]*>/g) || []).length;
  
  if (originalImages !== modifiedImages) {
    changes.push(`Image count changed: ${originalImages} → ${modifiedImages}`);
  }
  
  // Check for link changes
  const originalLinks = (original.match(/<a[^>]*>/g) || []).length;
  const modifiedLinks = (modified.match(/<a[^>]*>/g) || []).length;
  
  if (originalLinks !== modifiedLinks) {
    changes.push(`Link count changed: ${originalLinks} → ${modifiedLinks}`);
  }
  
  return changes;
}

function analyzeContentChanges(original: string, modified: string): string[] {
  const changes: string[] = [];
  
  // Extract text content
  const originalText = original.replace(/<[^>]*>/g, '').trim();
  const modifiedText = modified.replace(/<[^>]*>/g, '').trim();
  
  // Check for significant content changes
  const originalWords = originalText.split(/\s+/).length;
  const modifiedWords = modifiedText.split(/\s+/).length;
  
  const wordDifference = Math.abs(originalWords - modifiedWords);
  const wordChangePercentage = wordDifference / Math.max(originalWords, 1);
  
  if (wordChangePercentage > 0.1) { // 10% word count change
    changes.push(`Word count changed: ${originalWords} → ${modifiedWords}`);
  }
  
  // Check for title/subject changes
  const originalTitle = original.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '';
  const modifiedTitle = modified.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '';
  
  if (originalTitle !== modifiedTitle) {
    changes.push(`Title changed: "${originalTitle}" → "${modifiedTitle}"`);
  }
  
  return changes;
}

function analyzeStyleChanges(original: string, modified: string): string[] {
  const changes: string[] = [];
  
  // Extract style content
  const originalStyles = original.match(/<style[^>]*>([^<]*)<\/style>/gi) || [];
  const modifiedStyles = modified.match(/<style[^>]*>([^<]*)<\/style>/gi) || [];
  
  if (originalStyles.length !== modifiedStyles.length) {
    changes.push(`Style block count changed: ${originalStyles.length} → ${modifiedStyles.length}`);
  }
  
  // Check for inline style changes
  const originalInlineStyles = (original.match(/style="[^"]*"/g) || []).length;
  const modifiedInlineStyles = (modified.match(/style="[^"]*"/g) || []).length;
  
  if (originalInlineStyles !== modifiedInlineStyles) {
    changes.push(`Inline style count changed: ${originalInlineStyles} → ${modifiedInlineStyles}`);
  }
  
  return changes;
}

function calculateChangePercentage(
  structuralChanges: string[],
  contentChanges: string[],
  styleChanges: string[]
): number {
  // Weight different types of changes
  const structuralWeight = 0.4;
  const contentWeight = 0.4;
  const styleWeight = 0.2;
  
  const structuralScore = Math.min(structuralChanges.length * 0.1, 1);
  const contentScore = Math.min(contentChanges.length * 0.1, 1);
  const styleScore = Math.min(styleChanges.length * 0.05, 1);
  
  return (
    structuralScore * structuralWeight +
    contentScore * contentWeight +
    styleScore * styleWeight
  );
}

function generateDiffReport(
  original: string,
  modified: string,
  significantChanges: string[]
): string {
  const report = `HTML Diff Analysis Report
Generated: ${new Date().toISOString()}

Original HTML Size: ${original.length} characters
Modified HTML Size: ${modified.length} characters
Size Change: ${((modified.length - original.length) / original.length * 100).toFixed(2)}%

Significant Changes:
${significantChanges.length > 0 ? significantChanges.map(change => `- ${change}`).join('\n') : '- No significant changes detected'}

Analysis completed successfully.`;

  return report;
}

function getBaselineTemplate(): string {
  // Simple baseline template for comparison
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Template</title>
</head>
<body>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td>
        <h1>Subject</h1>
        <p>Content</p>
        <a href="#">CTA</a>
      </td>
    </tr>
  </table>
</body>
</html>`;
}