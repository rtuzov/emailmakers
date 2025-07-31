/**
 * Handoff Auto-Enrichment Utilities
 * Universal functions to automatically enrich handoff data for all specialists
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Check if data object has valid content (not empty object)
 */
export function hasValidData(data: any): boolean {
  return data && typeof data === 'object' && Object.keys(data).length > 0 && 
         !(Object.keys(data).length === 1 && Object.keys(data)[0] === 'length');
}

/**
 * Auto-load data from campaign folders based on specialist type
 */
export async function loadSpecialistData(campaignPath: string, specialist: string): Promise<any> {
  switch (specialist) {
    case 'data-collection':
      return await loadDataCollectionFiles(campaignPath);
    case 'content':
      return await loadContentFiles(campaignPath);
    case 'design':
      return await loadDesignFiles(campaignPath);
    case 'quality':
      return await loadQualityFiles(campaignPath);
    default:
      return {};
  }
}

/**
 * Load data collection files from /data folder
 */
async function loadDataCollectionFiles(campaignPath: string): Promise<any> {
  const dataPath = path.join(campaignPath, 'data');
  const loadedData: any = {};

  try {
    // Сначала получаем все JSON файлы в папке data
    const files = await fs.readdir(dataPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`📂 Найдено ${jsonFiles.length} JSON файлов в папке data`);

    // Загружаем все найденные JSON файлы
    for (const fileName of jsonFiles) {
      try {
        const filePath = path.join(dataPath, fileName);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        // Создаем ключ из имени файла, обрабатывая различные форматы
        let key = fileName.replace('.json', '');
        
        // Обрабатываем различные паттерны именования файлов
        if (key.includes('_insights_')) {
          // key_insights_insights.json -> key_insights
          key = key.replace('_insights_insights', '_insights');
        } else if (key.endsWith('-insights')) {
          // travel_intelligence-insights.json -> travel_intelligence
          key = key.replace('-insights', '');
        }
        
        // Заменяем дефисы на подчеркивания для консистентности
        key = key.replace(/-/g, '_');
        
        // ✅ CRITICAL FIX: Extract 'data' field if it exists (for specialist files)
        if (data && typeof data === 'object' && data.data && typeof data.data === 'object') {
          loadedData[key] = data.data;
          console.log(`🔧 Extracted 'data' field from ${fileName} for specialist handoff`);
        } else {
          loadedData[key] = data;
        }
        
        console.log(`✅ Auto-loaded ${fileName} as '${key}' for handoff`);
      } catch (fileError) {
        console.log(`⚠️ Could not auto-load ${fileName}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
      }
    }

    // Также пытаемся загрузить ожидаемые файлы, если они не были загружены
    const expectedFiles = [
      'consolidated-insights.json',
      'destination-analysis.json', 
      'emotional-profile.json',
      'market-intelligence.json',
      'travel_intelligence-insights.json',
      'trend-analysis.json'
    ];

    for (const fileName of expectedFiles) {
      const key = fileName.replace('-insights.json', '').replace('.json', '').replace('-', '_');
      
      // Если этот ключ еще не загружен, пытаемся загрузить файл
      if (!loadedData[key] && !jsonFiles.includes(fileName)) {
        try {
          const filePath = path.join(dataPath, fileName);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(fileContent);
          
          loadedData[key] = data;
          console.log(`✅ Auto-loaded expected file ${fileName} for handoff`);
        } catch (fileError) {
          // Файл не существует - это нормально
          if (fileError instanceof Error && !fileError.message.includes('ENOENT')) {
            console.log(`⚠️ Could not auto-load expected file ${fileName}: ${fileError.message}`);
          }
        }
      }
    }

    // Generate collection metadata
    loadedData.collection_metadata = {
      files_created: jsonFiles.map(file => `data/${file}`),
      total_analyses: jsonFiles.length,
      data_quality_score: 100,
      processing_completed_at: new Date().toISOString(),
      data_types: jsonFiles.map(file => {
        let type = file.replace('.json', '');
        if (type.includes('_insights_')) {
          type = type.replace('_insights_insights', '_insights');
        } else if (type.endsWith('-insights')) {
          type = type.replace('-insights', '');
        }
        return type.replace(/-/g, '_');
      })
    };

    console.log(`📊 Successfully loaded ${Object.keys(loadedData).filter(key => hasValidData(loadedData[key])).length} data files`);
    return loadedData;
  } catch (error) {
    console.log(`⚠️ Failed to auto-load data folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {};
  }
}

/**
 * Load content files from /content folder
 */
async function loadContentFiles(campaignPath: string): Promise<any> {
  const contentPath = path.join(campaignPath, 'content');
  const loadedData: any = {};

  try {
    const contentFiles = [
      'context-analysis.json',
      'date-analysis.json',
      'pricing-analysis.json',
      'asset-strategy.json',
      'generated-content.json',
      'technical-requirements.json',
      'design-brief.json'
    ];

    for (const fileName of contentFiles) {
      try {
        const filePath = path.join(contentPath, fileName);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        const key = fileName.replace('.json', '').replace('-', '_');
        loadedData[key] = data;
        
        console.log(`✅ Auto-loaded ${fileName} for content handoff`);
      } catch (fileError) {
        // Files may not exist if previous specialist hasn't completed yet - this is normal
        const key = fileName.replace('.json', '').replace('-', '_');
        loadedData[key] = null;
        
        if (fileError instanceof Error && !fileError.message.includes('ENOENT')) {
          console.log(`⚠️ Could not auto-load ${fileName}: ${fileError.message}`);
        }
      }
    }

    // Generate content metadata
    const files = await fs.readdir(contentPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    loadedData.content_metadata = {
      files_created: jsonFiles.map(file => `content/${file}`),
      total_files: jsonFiles.length,
      content_quality_score: Math.round((Object.keys(loadedData).filter(key => 
        hasValidData(loadedData[key])
      ).length / 7) * 100),
      processing_completed_at: new Date().toISOString()
    };

    return loadedData;
  } catch (error) {
    console.log(`⚠️ Failed to auto-load content folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {};
  }
}

/**
 * Load design files from /design folder
 */
async function loadDesignFiles(campaignPath: string): Promise<any> {
  const designPath = path.join(campaignPath, 'design');
  const loadedData: any = {};

  try {
    const designFiles = [
      'design-package.json',
      'mjml-template.mjml',
      'asset-manifest.json',
      'technical-specification.json'
    ];

    for (const fileName of designFiles) {
      try {
        const filePath = path.join(designPath, fileName);
        const fileContent = await fs.readFile(filePath, 'utf8');
        
        const key = fileName.replace('.json', '').replace('.mjml', '').replace('-', '_');
        
        if (fileName.endsWith('.json')) {
          loadedData[key] = JSON.parse(fileContent);
        } else {
          loadedData[key] = fileContent; // For MJML files
        }
        
        console.log(`✅ Auto-loaded ${fileName} for design handoff`);
      } catch (fileError) {
        // Files may not exist if design specialist hasn't completed yet - this is normal
        const key = fileName.replace('.json', '').replace('.mjml', '').replace('-', '_');
        loadedData[key] = null;
        
        if (fileError instanceof Error && !fileError.message.includes('ENOENT')) {
          console.log(`⚠️ Could not auto-load ${fileName}: ${fileError.message}`);
        }
      }
    }

    // Generate design metadata
    const files = await fs.readdir(designPath);
    const allFiles = files.filter(file => file.endsWith('.json') || file.endsWith('.mjml') || file.endsWith('.html'));
    
    loadedData.design_metadata = {
      files_created: allFiles.map(file => `design/${file}`),
      total_files: allFiles.length,
      design_quality_score: Math.round((Object.keys(loadedData).filter(key => 
        hasValidData(loadedData[key])
      ).length / 4) * 100),
      processing_completed_at: new Date().toISOString()
    };

    return loadedData;
  } catch (error) {
    console.log(`⚠️ Failed to auto-load design folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {};
  }
}

/**
 * Load quality files from /quality folder
 */
async function loadQualityFiles(campaignPath: string): Promise<any> {
  const qualityPath = path.join(campaignPath, 'quality');
  const loadedData: any = {};

  try {
    const qualityFiles = [
      'quality-report.json',
      'test-artifacts.json',
      'compliance-status.json',
      'validation-results.json',
      'client-compatibility.json',
      'accessibility-results.json'
    ];

    for (const fileName of qualityFiles) {
      try {
        const filePath = path.join(qualityPath, fileName);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        const key = fileName.replace('.json', '').replace('-', '_');
        loadedData[key] = data;
        
        console.log(`✅ Auto-loaded ${fileName} for quality handoff`);
      } catch (fileError) {
        // Files may not exist if quality specialist hasn't completed yet - this is normal
        const key = fileName.replace('.json', '').replace('-', '_');
        loadedData[key] = null;
        
        if (fileError instanceof Error && !fileError.message.includes('ENOENT')) {
          console.log(`⚠️ Could not auto-load ${fileName}: ${fileError.message}`);
        }
      }
    }

    // Generate quality metadata
    const files = await fs.readdir(qualityPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    loadedData.quality_metadata = {
      files_created: jsonFiles.map(file => `quality/${file}`),
      total_files: jsonFiles.length,
      quality_score: Math.round((Object.keys(loadedData).filter(key => 
        hasValidData(loadedData[key])
      ).length / 6) * 100),
      processing_completed_at: new Date().toISOString()
    };

    return loadedData;
  } catch (error) {
    console.log(`⚠️ Failed to auto-load quality folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {};
  }
}

/**
 * Auto-generate deliverables based on specialist data
 */
export function generateDeliverables(specialistData: any, specialist: string): any {
  const validKeys = Object.keys(specialistData).filter(key => 
    hasValidData(specialistData[key])
  );

  const metadata = specialistData[`${specialist.replace('-', '_')}_metadata`];
  
  return {
    created_files: metadata?.files_created || [],
    key_outputs: validKeys.filter(key => !key.includes('metadata')),
    data_quality_metrics: {
      total_analyses: metadata?.total_analyses || metadata?.total_files || validKeys.length,
      completion_rate: Math.round((validKeys.length / getExpectedDataTypes(specialist)) * 100),
      quality_score: metadata?.data_quality_score || metadata?.content_quality_score || metadata?.design_quality_score || metadata?.quality_score || 0
    }
  };
}

/**
 * Get expected number of data types for each specialist
 */
function getExpectedDataTypes(specialist: string): number {
  switch (specialist) {
    case 'data-collection': return 8; // Увеличено для учета всех возможных файлов данных
    case 'content': return 7;
    case 'design': return 4;
    case 'quality': return 6;
    default: return 5;
  }
}

/**
 * Auto-enrich handoff data for any specialist
 */
export async function enrichHandoffData(
  providedData: any,
  specialist: string,
  campaignPath: string,
  traceId?: string
): Promise<{
  enrichedData: any;
  enrichedDeliverables: any;
  autoTraceId: string;
}> {
  console.log(`🎯 Auto-enriching handoff data for ${specialist}...`);
  
  // Load actual data from files
  const actualData = await loadSpecialistData(campaignPath, specialist);
  
  // Merge provided data with actual data, prioritizing actual data
  const enrichedData: any = {};
  
  // Get all possible keys from both sources
  const allKeys = [...new Set([
    ...Object.keys(actualData),
    ...Object.keys(providedData)
  ])];
  
  for (const key of allKeys) {
    if (hasValidData(actualData[key])) {
      enrichedData[key] = actualData[key];
    } else if (hasValidData(providedData[key])) {
      enrichedData[key] = providedData[key];
    } else {
      enrichedData[key] = actualData[key] || providedData[key] || null;
    }
  }
  
  // Generate deliverables
  const enrichedDeliverables = generateDeliverables(enrichedData, specialist);
  
  // Auto-generate trace ID
  const autoTraceId = traceId || `handoff_${Date.now()}_${specialist}`;
  
  console.log(`✅ Handoff data enriched for ${specialist}:`, {
    dataTypes: Object.keys(enrichedData).length,
    validDataTypes: Object.keys(enrichedData).filter(key => hasValidData(enrichedData[key])).length,
    filesCreated: enrichedDeliverables.created_files.length
  });
  
  return {
    enrichedData,
    enrichedDeliverables,
    autoTraceId
  };
} 