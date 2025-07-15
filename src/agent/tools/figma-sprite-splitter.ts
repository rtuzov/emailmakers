import sharp from 'sharp';
import { Sharp } from 'sharp';
import { promises as fs } from 'fs';
import * as path from 'path';
import { OpenAI } from 'openai';
import { ensureDirectoryExists } from '../utils/file-system';
import { tmpdir } from 'os';
import { performance } from 'perf_hooks';
import EmailFolderManager, { EmailFolder } from './email-folder-manager';
import { getUsageModel } from '../../shared/utils/model-config';

// ===== INTERFACES & TYPES (from Creative Phase Architecture) =====

export interface SplitParams {
  path: string;
  h_gap?: number | null;
  v_gap?: number | null;
  confidence_threshold?: number | null;
  min_component_size?: number | null;
  output_dir?: string | null;
  emailFolder?: EmailFolder; // Новый параметр для интеграции с email папками
}

interface ProcessingConfig {
  horizontalGap: number;
  verticalGap: number;
  minSegmentArea: number;
  confidenceThreshold: number;
  maxProcessingTime: number;
  tempDir: string;
}

interface ImageSegment {
  bounds: { x: number; y: number; width: number; height: number };
  imageData: Buffer;
  area: number;
  metadata: Record<string, any>;
}

interface Classification {
  type: 'color' | 'mono' | 'logo';
  confidence: number;
  reasoning: string;
  heuristicScore?: number;
  visionScore?: number;
}

interface ClassifiedSegment extends ImageSegment {
  classification: Classification;
}

interface SpriteSlice {
  filename: string;
  type: 'color' | 'mono' | 'logo';
  confidence: number;
  bounds: { x: number; y: number; width: number; height: number };
  size_kb: number;
  metadata: Record<string, any>;
}

interface SliceManifest {
  slices: SpriteSlice[];
  processing_time: number;
  accuracy_score: number;
  
  metadata: {
    original_image: string;
    processing_config: ProcessingConfig;
    timestamp: string;
  };
}

interface ProjectionProfile {
  horizontal: number[];
  vertical: number[];
}

interface CutLine {
  start: number;
  end: number;
  position: number;
}

// ===== ERROR HANDLING =====

class ProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public phase: 'trim' | 'cut' | 'classify' | 'export',
    public recoverable: boolean
  ) {
    super(message);
    this.name = 'ProcessingError';
  }
}

// ===== MODULAR COMPONENTS (from Creative Phase Design) =====

class ImageProcessor {
  /**
   * Trim whitespace using Sharp's built-in optimized trimming
   * Creative Decision: Sharp built-in trim() for optimal performance
   */
  async trimWhitespace(image: Sharp): Promise<Sharp> {
    try {
      return image.trim({
        background: { r: 255, g: 255, b: 255, alpha: 0 },
        threshold: 10 // 10 out of 255 tolerance for slight variations
      });
    } catch (error: any) {
      throw new ProcessingError(
        `Failed to trim whitespace: ${error.message}`,
        'TRIM_FAILED',
        'trim',
        false
      );
    }
  }

  /**
   * Create projection profile using optimized single-pass algorithm
   * Creative Decision: O(W×H) single pass with O(W+H) space complexity
   */
  async createProjectionProfile(image: Sharp): Promise<ProjectionProfile> {
    try {
      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
      
      const horizontal = new Array(info.height).fill(0);
      const vertical = new Array(info.width).fill(0);
      
      // Single pass through image data (O(W×H) optimization)
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          const pixelIndex = (y * info.width + x) * info.channels;
          const alpha = info.channels === 4 ? data[pixelIndex + 3] : 255;
          
          if (alpha > 10) { // Non-transparent pixel threshold
            horizontal[y]++;
            vertical[x]++;
          }
        }
      }
      
      return { horizontal, vertical };
    } catch (error: any) {
      throw new ProcessingError(
        `Failed to create projection profile: ${error.message}`,
        'PROJECTION_FAILED',
        'cut',
        false
      );
    }
  }

  /**
   * Find cut lines in projection profile
   * Creative Decision: Gap-based detection with configurable thresholds
   */
  findCutLines(profile: number[], gapThreshold: number): CutLine[] {
    const cuts: CutLine[] = [];
    let zeroStart = -1;
    
    for (let i = 0; i < profile.length; i++) {
      if (profile[i] === 0) {
        if (zeroStart === -1) {
          zeroStart = i;
        }
      } else {
        if (zeroStart !== -1) {
          const gapSize = i - zeroStart;
          if (gapSize >= gapThreshold) {
            cuts.push({
              start: zeroStart,
              end: i - 1,
              position: Math.floor((zeroStart + i - 1) / 2)
            });
          }
          zeroStart = -1;
        }
      }
    }
    
    return cuts;
  }

  /**
   * Extract segments based on cut lines
   * Creative Decision: Grid-based extraction with bounds calculation
   */
  async extractSegments(image: Sharp, horizontalCuts: CutLine[], verticalCuts: CutLine[]): Promise<ImageSegment[]> {
    try {
      const { width, height } = await image.metadata();
      const segments: ImageSegment[] = [];
      
      // Create grid boundaries
      const yBounds = [0, ...horizontalCuts.map(cut => cut.position), height];
      const xBounds = [0, ...verticalCuts.map(cut => cut.position), width];
      
      // Extract each grid cell
      for (let i = 0; i < yBounds.length - 1; i++) {
        for (let j = 0; j < xBounds.length - 1; j++) {
                     const bounds = {
             x: xBounds[j],
             y: yBounds[i],
             width: xBounds[j + 1] - xBounds[j],
             height: yBounds[i + 1] - yBounds[i]
           };
           
           if (bounds.width > 0 && bounds.height > 0) {
             const segmentImage = image.clone().extract({
               left: bounds.x,
               top: bounds.y,
               width: bounds.width,
               height: bounds.height
             });
            const imageData = await segmentImage.png().toBuffer();
            
            segments.push({
              bounds,
              imageData,
              area: bounds.width * bounds.height,
              metadata: {
                grid_position: { row: i, col: j },
                extracted_at: new Date().toISOString()
              }
            });
          }
        }
      }
      
      return segments;
    } catch (error: any) {
      throw new ProcessingError(
        `Failed to extract segments: ${error.message}`,
        'EXTRACTION_FAILED',
        'cut',
        false
      );
    }
  }
}

class SegmentClassifier {
  constructor(private openaiClient: OpenAI) {}

  /**
   * Classify segment using hybrid heuristics + AI approach
   * Creative Decision: 60% heuristics, 40% vision for optimal speed/accuracy
   */
  async classifySegment(segment: ImageSegment): Promise<Classification> {
    try {
      // Step 1: Fast heuristic classification
      const heuristicResult = await this.classifyWithHeuristics(segment);
      
      // Step 2: Use AI if heuristic confidence is low
      if (heuristicResult.confidence < 0.8) {
        const visionResult = await this.classifyWithVision(segment);
        return this.combineClassifications(heuristicResult, visionResult);
      }
      
      return heuristicResult;
    } catch (error: any) {
      throw new ProcessingError(
        `Failed to classify segment: ${error.message}`,
        'CLASSIFICATION_FAILED',
        'classify',
        true // Recoverable error
      );
    }
  }

  /**
   * Heuristic classification focusing on Kupibilet brand elements
   * Creative Decision: Brand-specific green detection + contrast analysis
   */
  private async classifyWithHeuristics(segment: ImageSegment): Promise<Classification> {
    try {
      const image = sharp(segment.imageData);
      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
      
      // Kupibilet brand green: #00d56b (RGB: 0, 213, 107)
      const targetGreen = { r: 0, g: 213, b: 107 };
      const colorTolerance = 30; // RGB tolerance
      
      let greenPixels = 0;
      let totalPixels = 0;
      let totalSaturation = 0;
      let contrastSum = 0;
      
      for (let i = 0; i < data.length; i += info.channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = info.channels === 4 ? data[i + 3] : 255;
        
        if (alpha > 10) { // Skip transparent pixels
          totalPixels++;
          
          // Check for Kupibilet green
          const greenMatch = Math.abs(r - targetGreen.r) < colorTolerance &&
                           Math.abs(g - targetGreen.g) < colorTolerance &&
                           Math.abs(b - targetGreen.b) < colorTolerance;
          
          if (greenMatch) greenPixels++;
          
          // Calculate saturation for mono detection
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          totalSaturation += saturation;
          
          // Calculate contrast contribution
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          contrastSum += luminance;
        }
      }
      
      if (totalPixels === 0) {
        return {
          type: 'color',
          confidence: 0.1,
          reasoning: 'Empty or transparent segment',
          heuristicScore: 0
        };
      }
      
      const greenPercentage = greenPixels / totalPixels;
      const averageSaturation = totalSaturation / totalPixels;
      const averageLuminance = contrastSum / totalPixels;
      const contrast = averageLuminance / 255; // Normalize to 0-1
      
      // Kupibilet green detection (high confidence)
      if (greenPercentage > 0.3) {
        return {
          type: 'color',
          confidence: 0.9,
          reasoning: 'High concentration of Kupibilet brand green color',
          heuristicScore: greenPercentage
        };
      }
      
      // High contrast detection for logos
      if (contrast > 0.7 || (contrast < 0.3 && averageSaturation < 0.2)) {
        return {
          type: 'logo',
          confidence: 0.8,
          reasoning: 'High contrast pattern typical of logos',
          heuristicScore: contrast
        };
      }
      
      // Low saturation for monochrome
      if (averageSaturation < 0.2) {
        return {
          type: 'mono',
          confidence: 0.7,
          reasoning: 'Low color saturation indicates monochrome',
          heuristicScore: 1 - averageSaturation
        };
      }
      
      return {
        type: 'color', // Default
        confidence: 0.1,
        reasoning: 'Unable to classify with heuristics',
        heuristicScore: 0
      };
    } catch (error: any) {
      return {
        type: 'color',
        confidence: 0.1,
        reasoning: `Heuristic analysis failed: ${error.message}`,
        heuristicScore: 0
      };
    }
  }

  /**
   * AI Vision classification using GPT-4o mini
   * Creative Decision: Low detail mode for faster processing
   */
  private async classifyWithVision(segment: ImageSegment): Promise<Classification> {
    try {
      const base64 = segment.imageData.toString('base64');
      
      const response = await this.openaiClient.chat.completions.create({
        model: getUsageModel(),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Classify this image segment from a Kupibilet email template. Is it: 'color' (colorful illustration), 'mono' (monochrome/outline version), or 'logo' (company logo)? Respond with just the classification and confidence (0-1) in format: TYPE:CONFIDENCE"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${base64}`,
                  detail: "low" // Use low detail for faster processing
                }
              }
            ]
          }
        ],
        max_tokens: 50,
        temperature: 0 // Deterministic results
      });
      
      const result = this.parseVisionResponse(response.choices[0].message.content || '');
      
      return {
        type: result.type,
        confidence: result.confidence,
        reasoning: 'GPT-4o mini Vision classification',
        visionScore: result.confidence
      };
    } catch (error: any) {
      return {
        type: 'color',
        confidence: 0.1,
        reasoning: `AI Vision analysis failed: ${error.message}`,
        visionScore: 0
      };
    }
  }

  /**
   * Parse GPT-4o mini Vision response
   */
  private parseVisionResponse(content: string): { type: 'color' | 'mono' | 'logo'; confidence: number } {
    try {
      const parts = content.trim().split(':');
      if (parts.length >= 2) {
        const type = parts[0].toLowerCase() as 'color' | 'mono' | 'logo';
        const confidence = Math.min(1, Math.max(0, parseFloat(parts[1])));
        
        if (['color', 'mono', 'logo'].includes(type) && !isNaN(confidence)) {
          return { type, confidence };
        }
      }
    } catch (error: any) {
      // Parsing failed - use default classification
    }
    
    return { type: 'color', confidence: 0.1 };
  }

  /**
   * Combine heuristic and vision classifications
   * Creative Decision: 60% heuristics, 40% vision weighted combination
   */
  private combineClassifications(heuristic: Classification, vision: Classification): Classification {
    const combinedConfidence = (heuristic.confidence * 0.6) + (vision.confidence * 0.4);
    
    // Use the classification with higher confidence
    const selectedType = heuristic.confidence > vision.confidence ? heuristic.type : vision.type;
    
    return {
      type: selectedType,
      confidence: combinedConfidence,
      reasoning: `Combined: ${heuristic.reasoning} + ${vision.reasoning}`,
      heuristicScore: heuristic.heuristicScore,
      visionScore: vision.visionScore
    };
  }
}

class ExportManager {
  constructor(private config: ProcessingConfig, private emailFolder?: EmailFolder) {}

  /**
   * Save classified segments as individual slice files
   */
  async saveSlices(segments: ClassifiedSegment[], outputDir: string): Promise<SpriteSlice[]> {
    try {
      // Если есть emailFolder, используем его sprite папку
      const finalOutputDir = this.emailFolder ? this.emailFolder.spritePath : outputDir;
      await ensureDirectoryExists(finalOutputDir);
      
      const slices: SpriteSlice[] = [];
      const sliceBuffers: Array<{ filename: string; buffer: Buffer }> = [];
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const filename = `slice_${i + 1}_${segment.classification.type}.png`;
        
        // Подготавливаем данные для сохранения
        sliceBuffers.push({
          filename,
          buffer: segment.imageData
        });
        
        // Вычисляем размер
        const sizeKb = Math.round(segment.imageData.length / 1024 * 100) / 100;
        
        slices.push({
          filename,
          type: segment.classification.type,
          confidence: segment.classification.confidence,
          bounds: segment.bounds,
          size_kb: sizeKb,
          metadata: {
            ...segment.metadata,
            classification_reasoning: segment.classification.reasoning,
            heuristic_score: segment.classification.heuristicScore,
            vision_score: segment.classification.visionScore
          }
        });
      }
      
      // Сохраняем файлы
      if (this.emailFolder) {
        // Используем EmailFolderManager для сохранения sprite slices
        const manifest = {
          slices,
          processing_time: 0, // Будет обновлено позже
          accuracy_score: 0,  // Будет обновлено позже
          metadata: {
            original_image: '',
            processing_config: this.config,
            timestamp: new Date().toISOString()
          }
        };
        
        await EmailFolderManager.saveSpriteSlices(this.emailFolder, sliceBuffers, manifest);
        console.log(`💾 T10: Saved ${slices.length} sprite slices to email folder`);
      } else {
        // Save to standard directory (not email folder)
        for (const slice of sliceBuffers) {
          const filepath = path.join(finalOutputDir, slice.filename);
          await fs.writeFile(filepath, slice.buffer);
        }
        console.log(`💾 T10: Saved ${slices.length} sprite slices to ${finalOutputDir}`);
      }
      
      return slices;
    } catch (error: any) {
      throw new ProcessingError(
        `Failed to save slices: ${error.message}`,
        'EXPORT_FAILED',
        'export',
        false
      );
    }
  }

  /**
   * Generate JSON manifest with processing metadata
   */
  async generateManifest(
    slices: SpriteSlice[],
    processingTime: number,
    originalImagePath: string,
    config: ProcessingConfig
  ): Promise<SliceManifest> {
    // Calculate accuracy score based on confidence
    const totalConfidence = slices.reduce((sum, slice) => sum + slice.confidence, 0);
    const accuracyScore = slices.length > 0 ? totalConfidence / slices.length : 0;
    
    return {
      slices,
      processing_time: Math.round(processingTime * 100) / 100,
      accuracy_score: Math.round(accuracyScore * 100) / 100,

      metadata: {
        original_image: originalImagePath,
        processing_config: config,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Cleanup temporary files
   */
  async cleanup(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error: any) {
      // Cleanup failure is not critical
      console.warn(`Failed to cleanup temp directory: ${error.message}`);
    }
  }
}

// ===== MAIN PROCESSOR CLASS =====

class FigmaSpriteProcessor {
  constructor(
    private imageProcessor: ImageProcessor,
    private classifier: SegmentClassifier,
    private exportManager: ExportManager,
    private config: ProcessingConfig
  ) {}

  /**
   * Main processing pipeline orchestrator
   */
  async process(imagePath: string): Promise<SliceManifest> {
    const startTime = performance.now();
    let tempDir: string | undefined;
    
    try {
      // Create temporary directory for processing
      tempDir = path.join(tmpdir(), `sprite-split-${Date.now()}`);
      await ensureDirectoryExists(tempDir);
      
      // Load and trim the image
      const originalImage = sharp(imagePath);
      const trimmedImage = await this.imageProcessor.trimWhitespace(originalImage);
      
      // Create projection profile
      const projectionProfile = await this.imageProcessor.createProjectionProfile(trimmedImage);
      
      // Find cut lines
      const horizontalCuts = this.imageProcessor.findCutLines(
        projectionProfile.horizontal,
        this.config.horizontalGap
      );
      const verticalCuts = this.imageProcessor.findCutLines(
        projectionProfile.vertical,
        this.config.verticalGap
      );
      
      console.log(`🔍 T10: Found ${horizontalCuts.length} horizontal cuts, ${verticalCuts.length} vertical cuts`);
      
      // Extract segments
      const segments = await this.imageProcessor.extractSegments(
        trimmedImage,
        horizontalCuts,
        verticalCuts
      );
      
      console.log(`📦 T10: Extracted ${segments.length} segments`);
      
      // Filter out tiny segments (likely artifacts)
      const { width, height } = await originalImage.metadata();
      const totalArea = (width || 0) * (height || 0);
      const minArea = totalArea * 0.08;
      
      console.log(`📏 T10: Image size: ${width}x${height}, total area: ${totalArea}, min segment area: ${minArea}`);
      
      const filteredSegments = segments.filter(
        segment => segment.area >= minArea // Minimum 8% of total area
      );
      
      console.log(`🔽 T10: Filtered to ${filteredSegments.length} segments (removed ${segments.length - filteredSegments.length} small segments)`);
      
      // Classify segments
      const classifiedSegments: ClassifiedSegment[] = [];
      for (const segment of filteredSegments) {
        const classification = await this.classifier.classifySegment(segment);
        classifiedSegments.push({ ...segment, classification });
      }
      
      // Export slices
      const slices = await this.exportManager.saveSlices(classifiedSegments, tempDir);
      
      // Generate manifest
      const processingTime = (performance.now() - startTime) / 1000;
      const manifest = await this.exportManager.generateManifest(
        slices,
        processingTime,
        imagePath,
        this.config
      );
      
      return manifest;
      
    } catch (error: any) {
      if (error instanceof ProcessingError && error.recoverable) {
              // Throw error when filtering fails
      console.error(`Error in processing: ${error.message}`);
      throw error;
      } else {
        throw error;
      }
    } finally {
      // Cleanup temporary files
      if (tempDir) {
        await this.exportManager.cleanup(tempDir);
      }
    }
  }
}

// ===== MAIN TOOL FUNCTION =====

/**
 * Split Figma PNG sprite into individual classified slices
 * Main tool interface following OpenAI Agents SDK patterns
 */
export async function splitFigmaSprite(params: SplitParams): Promise<{
  success: boolean;
  manifest?: SliceManifest;
  error?: string;
  slices_generated?: number;
  processing_time?: number;
}> {
  try {
    console.log(`🎯 T10: Starting sprite splitter on: ${params.path}`);
    
    // Validate input parameters
    if (!params.path) {
      throw new Error('Image path is required');
    }
    
    // Check if file exists
    await fs.access(params.path);
    console.log(`✅ T10: File exists and accessible`);
    
    // Configuration with defaults
    const config: ProcessingConfig = {
      horizontalGap: params.h_gap || 15,
      verticalGap: params.v_gap || 15,
      minSegmentArea: 0.08, // 8% of total area
      confidenceThreshold: params.confidence_threshold || 0.9,
      maxProcessingTime: 1200, // 1.2 seconds in milliseconds
      tempDir: ''
    };
    
    console.log(`🔧 T10: Config - H Gap: ${config.horizontalGap}, V Gap: ${config.verticalGap}, Min Area: ${config.minSegmentArea}`);
    
    // Initialize OpenAI client
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required for image classification');
    }
    
    const openaiClient = new OpenAI({
      apiKey: openaiApiKey,
    });
    
    // Initialize processor components
    const imageProcessor = new ImageProcessor();
    const classifier = new SegmentClassifier(openaiClient);
    const exportManager = new ExportManager(config, params.emailFolder);
    const processor = new FigmaSpriteProcessor(
      imageProcessor,
      classifier,
      exportManager,
      config
    );
    
    // Process the sprite
    console.log(`🚀 T10: Starting processing pipeline...`);
    const manifest = await processor.process(params.path);
    
    console.log(`✅ T10: Processing complete - ${manifest.slices.length} slices generated in ${manifest.processing_time}s`);
    
    return {
      success: true,
      manifest,
      slices_generated: manifest.slices.length,
      processing_time: manifest.processing_time
    };
    
  } catch (error: any) {
    console.error(`❌ T10: Sprite splitter failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      slices_generated: 0,
      processing_time: 0
    };
  }
} 