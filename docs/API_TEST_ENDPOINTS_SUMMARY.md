# 🧪 Email-Makers Agent Testing API Endpoints

## Overview

This document describes the comprehensive API endpoints created for testing each specialist in the Email-Makers agent system. These endpoints accelerate development and debugging by automatically loading context from previous specialists and running individual specialists with realistic data.

## 🏗️ Agent Architecture

**EmailMakersAgent** - Main agent with mandatory Orchestrator entry point
- **5 specialists**: data-collection → content → design → quality → delivery
- **OpenAI SDK handoffs** between specialists
- **Structured campaigns** in `/campaigns` folder

## 📁 Campaign Structure

Campaigns follow the pattern: `campaign_[timestamp]_[id]`

```
campaign_1752472784725_9sazmuaiwoh/
├── data/                    # Dynamic data from Data Collection Specialist
├── content/                 # Email content from Content Specialist
├── assets/                  # Visual assets from Design Specialist
├── templates/               # MJML/HTML templates from Design Specialist
├── docs/                    # Technical specifications
├── handoffs/                # Context transfer between specialists
│   ├── data-collection specialist-to-content-specialist.json
│   ├── content-specialist-to-design-specialist.json
│   ├── design-specialist-to-quality-specialist.json
│   └── quality-specialist-to-delivery-specialist.json
├── exports/                 # Final deliverables
├── logs/                    # Process execution logs
├── README.md               # Campaign overview
└── campaign-metadata.json  # Campaign metadata
```

## 🔗 Handoff System

**Handoff files** contain context transfer between specialists:

```json
{
  "from_specialist": "Data Collection Specialist",
  "to_specialist": "Content Specialist",
  "handoff_data": {
    "summary": "Completed comprehensive destination analysis",
    "key_outputs": ["destination-analysis.json", "market-intelligence.json"],
    "context_for_next": "Use the destination analysis for content creation",
    "data_files": ["data/destination-analysis.json"],
    "recommendations": ["Focus on emotional triggers", "Use pricing insights"]
  },
  "created_at": "2025-07-14T06:13:29.665Z",
  "file_path": "/path/to/handoff/file.json"
}
```

## 🛠️ API Endpoints

### 1. Utility Endpoint - `/api/agent/test/utils`

**Base functionality for campaign management and context loading**

#### GET Methods:
- `?action=list_campaigns` - Lists all campaigns sorted by timestamp
- `?action=get_latest` - Gets latest campaign info
- `?action=get_campaign_info&campaignId=X` - Detailed campaign information
- `?action=load_context&campaignId=X&specialist=Y` - Loads context for specialist

#### Key Functions:
- `listCampaigns()` - Scans campaigns folder and sorts by timestamp
- `getLatestCampaign()` - Identifies most recent campaign
- `getCampaignInfo()` - Parses README and validates campaign structure
- `loadSpecialistContext()` - Loads handoff data from previous specialists

### 2. Data Collection Specialist Test - `/api/agent/test/data-collection`

**Tests Data Collection Specialist with latest campaign context**

#### POST `/api/agent/test/data-collection`
```json
{
  "campaignId": "campaign_1752472784725_9sazmuaiwoh", // Optional - auto-detects latest
  "useLatest": true,
  "customRequest": "Analyze travel destination data",
  "testMode": "full" // 'full' | 'quick' | 'validation'
}
```

#### GET `/api/agent/test/data-collection?action=info`
- Specialist information and capabilities
- Dependencies: None (entry point specialist)
- Outputs: Destination analysis, market intelligence, emotional profile, trend analysis

#### Features:
- **Auto-detects latest campaign** by timestamp
- **No dependencies** - entry point specialist
- **Extracts outputs**: destination analysis, market intelligence, emotional profile, trend analysis
- **Test modes**: full (with file saving), quick (fast), validation (basic checks)

### 3. Content Specialist Test - `/api/agent/test/content`

**Tests Content Specialist with Data Collection context**

#### POST `/api/agent/test/content`
```json
{
  "campaignId": "campaign_1752472784725_9sazmuaiwoh",
  "useLatest": true,
  "customRequest": "Generate email content for Thailand autumn travel",
  "testMode": "full"
}
```

#### GET `/api/agent/test/content?action=info`
- Specialist information and capabilities
- Dependencies: Data Collection Specialist (recommended)
- Outputs: Subject line, preheader, body content, CTA, pricing data

#### Features:
- **Checks for Data Collection context** availability
- **Loads previous specialist results** from handoff files
- **Extracts outputs**: subject line, preheader, body content, CTA, pricing data
- **Language detection** (RU/EN) and content sections analysis

### 4. Design Specialist Test - `/api/agent/test/design`

**Tests Design Specialist with previous specialists context**

#### POST `/api/agent/test/design`
```json
{
  "campaignId": "campaign_1752472784725_9sazmuaiwoh",
  "useLatest": true,
  "customRequest": "Create MJML email template with Kupibilet branding",
  "testMode": "full"
}
```

#### GET `/api/agent/test/design?action=info`
- Specialist information and capabilities
- Dependencies: Content Specialist (recommended), Data Collection (optional)
- Outputs: MJML templates, HTML output, CSS styles, assets, responsive design

#### Features:
- **Checks for both Data Collection and Content context**
- **Extracts outputs**: MJML templates, HTML output, CSS styles, assets, responsive design
- **Design elements analysis**: header, hero, content, footer, buttons
- **Brand compliance**: Kupibilet colors and style guidelines

### 5. Quality Specialist Test - `/api/agent/test/quality` ✨ NEW

**Tests Quality Specialist with previous specialists context**

#### POST `/api/agent/test/quality`
```json
{
  "campaignId": "campaign_1752472784725_9sazmuaiwoh",
  "useLatest": true,
  "customRequest": "Perform comprehensive quality analysis",
  "testMode": "full"
}
```

#### GET `/api/agent/test/quality?action=info`
- Specialist information and capabilities
- Dependencies: Design Specialist (recommended), Content Specialist (optional)
- Outputs: Quality analysis report, validation results, compatibility matrix, performance metrics

#### Features:
- **Loads Design and Content Specialist context**
- **Quality analysis**: HTML/CSS validation, cross-client compatibility, accessibility
- **AI-powered analysis**: 5 specialized AI agents for comprehensive quality assessment
- **Performance metrics**: File size, load time, compatibility scores
- **Test clients**: Gmail, Outlook, Apple Mail, Yahoo Mail

### 6. Delivery Specialist Test - `/api/agent/test/delivery` ✨ NEW

**Tests Delivery Specialist with all previous specialists context**

#### POST `/api/agent/test/delivery`
```json
{
  "campaignId": "campaign_1752472784725_9sazmuaiwoh",
  "useLatest": true,
  "customRequest": "Package and deliver final email campaign",
  "testMode": "full"
}
```

#### GET `/api/agent/test/delivery?action=info`
- Specialist information and capabilities
- Dependencies: Quality Specialist (recommended), Design Specialist (recommended)
- Outputs: Final campaign package (ZIP), deployment documentation, asset manifest

#### Features:
- **Loads ALL previous specialists context** (final step in workflow)
- **Package creation**: ZIP format with all assets and documentation
- **Quality gates**: Validates minimum quality score and required files
- **Deployment ready**: Creates production deployment guides
- **Asset optimization**: Ensures <600KB total package size

## 🚀 Usage Examples

### Testing Individual Specialists

```bash
# Test Data Collection Specialist with latest campaign
curl -X POST http://localhost:3000/api/agent/test/data-collection \
  -H "Content-Type: application/json" \
  -d '{"useLatest": true, "testMode": "full"}'

# Test Content Specialist with specific campaign
curl -X POST http://localhost:3000/api/agent/test/content \
  -H "Content-Type: application/json" \
  -d '{"campaignId": "campaign_1752472784725_9sazmuaiwoh", "testMode": "quick"}'

# Test Quality Specialist with custom request
curl -X POST http://localhost:3000/api/agent/test/quality \
  -H "Content-Type: application/json" \
  -d '{"useLatest": true, "customRequest": "Focus on accessibility validation", "testMode": "validation"}'
```

### Getting Specialist Information

```bash
# Get Quality Specialist capabilities
curl http://localhost:3000/api/agent/test/quality?action=info

# Check Delivery Specialist status
curl http://localhost:3000/api/agent/test/delivery?action=status

# List all campaigns
curl http://localhost:3000/api/agent/test/utils?action=list_campaigns
```

## 📊 Response Format

All test endpoints return structured responses:

```json
{
  "success": true,
  "specialist": "quality",
  "campaign_id": "campaign_1752472784725_9sazmuaiwoh",
  "execution_time": 15420,
  "test_mode": "full",
  "context": {
    "had_design_context": true,
    "had_content_context": true,
    "campaign_context": true
  },
  "outputs": {
    "summary": "Quality analysis completed",
    "qualityScore": 92,
    "validationResults": ["✅ HTML validation passed", "✅ CSS validation passed"],
    "recommendations": ["Optimize image sizes", "Add alt text to images"],
    "files": ["quality-report.html", "validation-results.json"]
  },
  "result": {
    "finalOutput": "Detailed specialist output...",
    "messages": [...],
    "usage": {...}
  }
}
```

## 🔄 Workflow Testing

### Sequential Testing
Test the complete workflow by running specialists in order:

1. **Data Collection** → Gathers pricing and contextual data
2. **Content** → Creates email content using data insights
3. **Design** → Generates MJML templates with content
4. **Quality** → Validates templates for compliance
5. **Delivery** → Packages final campaign for deployment

### Context Flow Validation
Each specialist automatically:
- **Loads context** from previous specialists via handoff files
- **Validates dependencies** and warns if context is missing
- **Extracts insights** from previous specialist outputs
- **Passes enhanced context** to the EmailMakersAgent

## 🛡️ Error Handling

- **Graceful degradation**: Specialists work with limited context if previous data unavailable
- **Dependency warnings**: Clear messages when recommended context is missing
- **Detailed error logging**: Full stack traces for debugging
- **Context validation**: Ensures handoff data integrity

## ⚡ Performance Features

- **Automatic latest campaign detection** by timestamp parsing
- **Parallel context loading** from multiple handoff files
- **Efficient file system operations** with existence checks
- **Structured output extraction** with pattern matching
- **Memory-efficient** campaign scanning and context loading

## 🎯 Benefits

1. **Accelerated Testing**: Test individual specialists without running full workflow
2. **Realistic Context**: Automatic loading of context from previous specialists
3. **Debugging Support**: Detailed outputs and error information
4. **Development Velocity**: Quick iteration on specialist improvements
5. **Quality Assurance**: Validate specialist behavior with real campaign data
6. **Integration Testing**: Test specialist handoffs and context flow

---

## 🔧 Technical Implementation

- Uses `EmailMakersAgent.runSpecialist()` for direct specialist execution
- Loads campaign context via utility API calls
- Enhanced context preparation with campaign info, test config, and previous results
- Pattern matching for output extraction (files, insights, content sections)
- Comprehensive error handling and logging

The system enables rapid testing of individual specialists with realistic context from previous workflow stages, significantly accelerating development and debugging of the Email-Makers agent system. 