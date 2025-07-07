# 🌍 Multi-Destination Feature Documentation

## Overview

The Multi-Destination Feature is a comprehensive solution for creating email campaigns with multiple travel destinations. It enables users to input simple queries like "Европа осенью" or "Азия зимой" and automatically generates sophisticated email campaigns with multiple destination options, seasonal optimization, and intelligent layout selection.

## Architecture

### Multi-Agent System Integration

The feature integrates with the existing multi-agent architecture:

- **ContentSpecialistAgent**: Analyzes geographical queries and generates destination plans
- **DesignSpecialistV2**: Selects optimal MJML templates and plans layouts
- **QualitySpecialistV2**: Validates multi-destination content and compliance
- **DeliverySpecialistAgent**: Organizes assets by country/region for deployment

### Core Components

#### 1. Type System (`src/shared/types/multi-destination-types.ts`)

Complete TypeScript type definitions with Zod validation schemas compatible with OpenAI Agents SDK v2:

```typescript
interface MultiDestinationPlan {
  campaign_id: string;
  geographical_scope: GeographicalScope;
  destinations: DestinationPlan[];
  seasonal_context?: SeasonalContext;
  campaign_metadata: CampaignMetadata;
  // ... additional fields
}

interface DestinationPlan {
  destination: string;
  appeal_score: number;
  seasonal_fit: number;
  pricing_tier: 'budget' | 'mid-range' | 'luxury';
  estimated_price_range: PriceRange;
  marketing_appeal: MarketingAppeal;
  // ... additional fields
}
```

#### 2. Content Analysis Services

**DestinationAnalyzer** (`src/agent/specialists/content/services/destination-analyzer.ts`)
- Geographical scope analysis from natural language queries
- Destination generation with appeal scoring
- Seasonal context detection

**MultiDestinationPlanner** (`src/agent/specialists/content/services/multi-destination-planner.ts`)
- Unified campaign planning
- Destination mix optimization
- Regional balancing and pricing strategies

**SeasonalOptimizer** (`src/agent/specialists/content/services/seasonal-optimizer.ts`)
- Climate data analysis for optimal timing
- Season-specific destination recommendations
- Date optimization with weather considerations

#### 3. Design and Layout System

**MultiDestinationLayoutService** (`src/agent/specialists/design/services/multi-destination-layout.ts`)
- Intelligent MJML template selection
- Image planning and optimization
- Responsive layout validation

**MJML Templates** (`src/domains/template-processing/templates/`)
- **multi-destination-compact.mjml**: 2-3 destinations with hero design
- **multi-destination-grid.mjml**: 4-6 destinations with adaptive grid layouts
- **multi-destination-carousel.mjml**: 6+ destinations with ranking system

#### 4. Quality Assurance

**MultiDestinationValidationService** (`src/agent/specialists/quality/services/multi-destination-validation-service.ts`)
- Email size validation (100KB limit)
- Image optimization verification
- Seasonal date consistency checks
- Cross-client compatibility validation

#### 5. Asset Management

**Enhanced DeliveryManager** (`src/agent/tools/consolidated/delivery-manager.ts`)
- Asset organization by country/region
- Hierarchical folder structures
- Metadata generation and indexing

## Usage Examples

### Basic Multi-Destination Query

```typescript
import { ContentSpecialistAgent } from './src/agent/specialists/content-specialist-agent';

const agent = new ContentSpecialistAgent();

const result = await agent.executeTask({
  task_type: 'analyze_multi_destination',
  campaign_brief: {
    topic: 'Европа осенью',
    campaign_type: 'promotional',
    target_audience: 'travel_enthusiasts'
  },
  trace_id: 'europe-autumn-campaign'
});

// Result includes:
// - Geographical scope (Europe, autumn season)
// - Generated destinations (France, Italy, Germany, etc.)
// - Unified campaign plan with seasonal optimization
// - Readiness assessment and recommendations
```

### Template Selection and Layout Planning

```typescript
import { DesignSpecialistV2 } from './src/agent/specialists/design-specialist-v2';

const designAgent = new DesignSpecialistV2();

// Select optimal template
const templateResult = await designAgent.executeTask({
  task_type: 'select_multi_destination_template',
  multi_destination_plan: campaignPlan,
  layout_preferences: ['grid', 'compact'],
  device_targets: ['mobile', 'tablet', 'desktop'],
  trace_id: 'template-selection'
});

// Plan images for destinations
const imageResult = await designAgent.executeTask({
  task_type: 'plan_multi_destination_images',
  multi_destination_plan: campaignPlan,
  layout_plan: templateResult.layout_plan,
  trace_id: 'image-planning'
});
```

### Quality Validation

```typescript
import { QualitySpecialistV2 } from './src/agent/specialists/quality-specialist-v2';

const qualityAgent = new QualitySpecialistV2();

const validationResult = await qualityAgent.executeTask({
  task_type: 'validate_multi_destination_content',
  campaign_data: campaignPlan,
  layout_plan: layoutPlan,
  email_package: {
    html_output: emailHTML,
    mjml_source: mjmlSource,
    file_size_bytes: htmlSize,
    asset_urls: assetUrls
  },
  multi_destination_validation_criteria: {
    max_email_size_kb: 100,
    seasonal_date_validation: true,
    min_destinations: 3,
    max_destinations: 6
  },
  trace_id: 'quality-validation'
});
```

### Asset Organization

```typescript
import { DeliverySpecialistAgent } from './src/agent/specialists/delivery-specialist-agent';

const deliveryAgent = new DeliverySpecialistAgent();

const assetResult = await deliveryAgent.executeTask({
  task_type: 'organize_multi_destination_assets',
  campaign_plan: campaignPlan,
  asset_urls: generatedAssets,
  organization_strategy: 'by_country',
  output_directory: './campaign-assets/',
  trace_id: 'asset-organization'
});
```

## Workflow Pipeline

### 1. Query Analysis Phase
```
User Input: "Европа осенью"
↓
ContentSpecialistAgent.analyzeMultiDestinationBrief()
↓
- Geographical scope detection (Europe, autumn)
- Season analysis (September-November optimal)
- Target audience assessment
```

### 2. Destination Generation Phase
```
DestinationAnalyzer.generateDestinationOptions()
↓
- Appeal scoring (France: 95, Italy: 92, Germany: 88)
- Seasonal fit analysis
- Pricing tier classification
- Marketing appeal definition
```

### 3. Campaign Planning Phase
```
MultiDestinationPlanner.createUnifiedPlan()
↓
- Unified campaign ID generation
- Destination mix optimization
- Seasonal context integration
- Campaign metadata compilation
```

### 4. Design Selection Phase
```
DesignSpecialistV2.selectMultiDestinationTemplate()
↓
- Template selection (grid for 4-6 destinations)
- Image planning with optimization
- Responsive breakpoint calculation
```

### 5. Quality Validation Phase
```
QualitySpecialistV2.validateMultiDestinationContent()
↓
- Email size validation (<100KB)
- Image optimization verification
- Date consistency checks
- Cross-client compatibility
```

### 6. Asset Organization Phase
```
DeliverySpecialistAgent.organizeMultiDestinationAssets()
↓
- Country-based folder structure
- Metadata file generation
- Index file creation
- Cost calculation
```

## Configuration Options

### Layout Types

- **compact**: 2-3 destinations, hero-focused design
- **grid**: 4-6 destinations, balanced grid layout
- **carousel**: 6+ destinations, scrollable carousel with ranking

### Seasonal Contexts

- **spring**: March-May, renewal themes
- **summer**: June-August, adventure focus
- **autumn**: September-November, cultural emphasis
- **winter**: December-February, cozy experiences

### Organization Strategies

- **by_country**: Organize assets by destination country
- **by_region**: Group by geographical regions
- **by_destination**: Individual destination folders
- **hierarchical**: Nested country/city structure

## Performance Considerations

### Email Size Optimization
- **Target**: <100KB total HTML
- **Images**: Automatic compression and format optimization
- **Templates**: Minimal MJML with inline CSS

### Load Time Targets
- **Template Selection**: <2s
- **Image Planning**: <3s
- **Asset Organization**: <5s
- **Full Pipeline**: <30s end-to-end

### Compatibility Requirements
- **Email Clients**: 95%+ compatibility (Gmail, Outlook, Apple Mail, etc.)
- **Responsive Design**: Mobile-first with tablet/desktop optimization
- **Dark Mode**: Full support in all templates

## Testing

### Unit Tests
```bash
# Run multi-destination type tests
npm test __tests__/multi-destination/types.test.ts

# Test service integrations
npm test __tests__/multi-destination/integration.test.ts
```

### E2E Tests
```bash
# Complete workflow tests
npm test __tests__/e2e/multi-destination-workflow-simple.e2e.test.ts

# Functional validation tests
npm test __tests__/e2e/multi-destination-simple-e2e.test.ts
```

### Test Scenarios
- **Europe Autumn**: 3-6 European destinations, autumn season optimization
- **Asia Winter**: 3-5 Asian destinations, winter season considerations
- **Edge Cases**: Invalid queries, minimum/maximum destinations, seasonal constraints

## API Integration

### OpenAI Agents SDK v2 Compatibility

The feature is fully compatible with OpenAI Agents SDK v2:

```typescript
// Tool configuration for agents
const tools = [
  {
    type: 'function',
    function: {
      name: 'analyze_multi_destination',
      description: 'Analyze geographical queries for multi-destination campaigns',
      parameters: GeographicalAnalysisInputSchema // Zod schema
    }
  }
];

// Agent creation with proper handoffs
const agent = Agent.create({
  model: 'gpt-4o-mini',
  instructions: 'You are a travel campaign specialist...',
  tools: tools,
  handoffs: ['content_to_design', 'design_to_quality', 'quality_to_delivery']
});
```

### Error Handling

Comprehensive error handling with specific error types:

```typescript
try {
  const result = await analyzeMultiDestination(query);
} catch (error) {
  if (error instanceof GeographicalAnalysisError) {
    // Handle invalid geographical queries
  } else if (error instanceof SeasonalValidationError) {
    // Handle seasonal constraint violations
  } else if (error instanceof DestinationLimitError) {
    // Handle min/max destination violations
  }
}
```

## Constants and Limits

```typescript
export const MULTI_DESTINATION_LIMITS = {
  MIN_DESTINATIONS: 2,
  MAX_DESTINATIONS: 12,
  MAX_EMAIL_SIZE_KB: 100,
  OPTIMAL_DESTINATIONS: {
    compact: { min: 2, max: 3 },
    grid: { min: 4, max: 6 },
    carousel: { min: 6, max: 12 }
  }
};

export const SUPPORTED_REGIONS = [
  'europe', 'asia', 'north_america', 'south_america',
  'africa', 'oceania'
];

export const TRAVEL_SEASONS = [
  'spring', 'summer', 'autumn', 'winter'
];
```

## Troubleshooting

### Common Issues

1. **TypeScript Compilation Errors**
   ```bash
   npm run type-check
   # Fix any type mismatches in multi-destination files
   ```

2. **Template Selection Failures**
   - Verify MJML templates exist in `src/domains/template-processing/templates/`
   - Check template mapping configuration in MultiDestinationLayoutService

3. **Asset Organization Errors**
   - Ensure output directory permissions
   - Verify asset URL accessibility
   - Check file system space availability

4. **Quality Validation Failures**
   - Review email size (must be <100KB)
   - Validate image URLs and formats
   - Check seasonal date consistency

### Debug Mode

Enable detailed logging:

```typescript
// Set environment variable
process.env.DEBUG = 'multi-destination:*';

// Or use specific debug categories
process.env.DEBUG = 'multi-destination:analyzer,multi-destination:planner';
```

## Future Enhancements

### Planned Features
- **AI-Powered Image Generation**: Automatic destination image creation
- **Real-time Pricing Integration**: Live pricing data from travel APIs
- **Advanced Analytics**: Campaign performance tracking and optimization
- **Multi-language Support**: Localized content generation
- **A/B Testing**: Template and content variant testing

### Extension Points
- **Custom Destination Sources**: Plugin system for external destination APIs
- **Template Customization**: User-defined MJML template variants
- **Validation Rules**: Configurable quality and compliance checks
- **Asset Processing**: Additional image optimization and CDN integration

## Contributing

### Development Setup
```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run tests
npm test

# Build for production
npm run build
```

### Code Standards
- TypeScript strict mode enabled
- Zero compilation errors required
- 80%+ test coverage target
- ESLint and Prettier formatting
- OpenAI SDK v2 compatibility maintained

### Pull Request Process
1. Create feature branch from main
2. Implement changes with tests
3. Run full test suite
4. Update documentation
5. Submit PR with detailed description

## License

This feature is part of the Email-Makers project and follows the same licensing terms.

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Compatibility**: OpenAI Agents SDK v2, Node.js 18+, TypeScript 5.6+