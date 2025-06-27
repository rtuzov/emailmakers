# Email-Makers API Endpoints

## Overview

Email-Makers provides a comprehensive REST API for AI-powered email template generation with design system integration. All endpoints support JSON request/response format.

**Base URL**: `http://localhost:3000/api`
**Version**: 1.0.0

## API Status

- **Server**: Operational
- **Database**: Operational
- **External Services**: Mock implementations (OpenAI, Anthropic, Figma, Litmus)

## Authentication Endpoints

### Register User
- **Endpoint**: `POST /api/auth/register`
- **Description**: Register a new user account
- **Required Fields**: `email`, `password`, `name`
- **Status**: Active

### Login User
- **Endpoint**: `POST /api/auth/login`
- **Description**: Authenticate user and create session
- **Required Fields**: `email`, `password`
- **Status**: Active

### Logout User
- **Endpoint**: `POST /api/auth/logout`
- **Description**: End user session
- **Status**: Active

### Get Current User
- **Endpoint**: `GET /api/auth/me`
- **Description**: Get current user information
- **Requires Auth**: Yes
- **Status**: Active

## Template Generation

### Generate Email Template
- **Endpoint**: `POST /api/templates/generate`
- **Description**: Generate email templates from content briefs with optional Figma integration
- **Status**: Active (Mock Implementation)

#### Request Body
```json
{
  "content": "Your content brief text", // Required
  "type": "text|json|figma_url", // Optional, default: "text"
  "title": "Email Title", // Optional
  "description": "Email Description", // Optional
  "options": {
    "figmaUrl": "https://figma.com/file/...", // Optional
    "campaignType": "newsletter|promotional|transactional|welcome", // Optional
    "priorityProvider": "openai|anthropic", // Optional
    "skipCache": false, // Optional
    "qualityThreshold": 0.8, // Optional (0-1)
    "brandGuidelines": {
      "tone": "professional|casual|friendly|formal|playful|urgent",
      "voice": "authoritative|conversational|empathetic|enthusiastic|informative",
      "values": ["string array"],
      "prohibitedWords": ["string array"],
      "preferredLanguage": "string"
    },
    "targetAudience": "string"
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "jobId": "job_1750687884552_scmgkvgsw",
    "template": {
      "id": "template_1750687884552",
      "subject": "Generated: Email Template",
      "preheader": "This is a generated email template preview",
      "body": "<p>Template generated content...</p>",
      "cta": {
        "text": "Learn More",
        "url": "https://example.com",
        "style": { "backgroundColor": "#007bff", "color": "#ffffff" }
      },
      "html": "<!DOCTYPE html>...",
      "mjml": "<mjml>...",
      "metadata": {
        "generatedAt": "2025-06-23T14:11:24.552Z",
        "version": "1.0.0",
        "fileSize": 1024,
        "wordCount": 2,
        "estimatedReadTime": 1
      }
    },
    "qualityReport": {
      "overallScore": 0.85,
      "crossClientCompatibility": { "score": 0.9, "supportedClients": [...] },
      "accessibility": { "score": 0.8, "recommendations": [...] },
      "performance": { "score": 0.85, "metrics": {...} }
    }
  }
}
```

### Get Template Generation Info
- **Endpoint**: `GET /api/templates/generate`
- **Description**: Get information about the template generation endpoint
- **Supported Types**: `text`, `json`, `figma_url`
- **Supported Campaign Types**: `newsletter`, `promotional`, `transactional`, `welcome`
- **Supported Providers**: `openai`, `anthropic`

## Content Validation

### Validate Content Brief
- **Endpoint**: `POST /api/content/validate`
- **Description**: Validate content briefs before template generation
- **Status**: Active

#### Request Body
```json
{
  "content": "Content to validate", // Required
  "type": "text|json|figma_url", // Optional, default: "text"
  "title": "Content Title", // Optional
  "description": "Content Description", // Optional
  "brandGuidelines": {
    "tone": "professional|casual|friendly|formal|playful|urgent",
    "voice": "authoritative|conversational|empathetic|enthusiastic|informative"
  },
  "targetAudience": "string"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "briefInfo": {
      "id": "brief_1750687891053_frzk0pvy1",
      "type": "text",
      "wordCount": 3,
      "characterCount": 23,
      "figmaUrls": [],
      "createdAt": "2025-06-23T14:11:31.053Z"
    },
    "suggestions": []
  }
}
```

## Design System Integration

### Extract Design System
- **Endpoint**: `POST /api/design-system/extract`
- **Description**: Extract design tokens, components, and assets from Figma URLs
- **Status**: Active (Mock Implementation)

#### Request Body
```json
{
  "figmaUrl": "https://www.figma.com/file/...", // Required
  "options": {
    "skipCache": false, // Optional
    "includeAssets": true, // Optional, default: true
    "includeComponents": true, // Optional, default: true
    "includeTokens": true, // Optional, default: true
    "optimizeForEmail": true // Optional, default: true
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "designSystem": {
      "tokens": {
        "colors": [
          {
            "name": "primary",
            "value": "#007bff",
            "emailSafe": true,
            "darkModeVariant": "#0d6efd"
          }
        ],
        "typography": [...],
        "spacing": [...]
      },
      "components": [
        {
          "id": "button-primary",
          "name": "Primary Button",
          "type": "button",
          "emailMapping": {...},
          "mjmlEquivalent": "mj-button"
        }
      ],
      "assets": [...],
      "metadata": {
        "projectId": "mock-project-id",
        "extractedAt": "2025-06-23T14:11:36.409Z",
        "totalTokens": 5,
        "totalComponents": 1
      }
    }
  }
}
```

#### Supported Features
- Color token extraction with email-safe validation
- Typography token extraction with web-safe fallbacks
- Spacing token extraction
- Component mapping to MJML equivalents
- Asset optimization for email clients
- Dark mode variant generation

## Quality Assurance

### Validate Email Template
- **Endpoint**: `POST /api/quality/validate`
- **Description**: Validate email templates for cross-client compatibility, accessibility, and performance
- **Status**: Active (Mock Implementation)

#### Request Body
```json
{
  "html": "<html>...</html>", // Required
  "mjml": "<mjml>...</mjml>", // Optional
  "options": {
    "skipLitmusTest": false, // Optional
    "skipAccessibilityTest": false, // Optional
    "skipPerformanceTest": false, // Optional
    "targetClients": ["gmail", "outlook_2016", "apple_mail"], // Optional
    "performanceThresholds": {
      "maxFileSize": 100000, // Optional (bytes)
      "maxLoadTime": 2.0, // Optional (seconds)
      "minAccessibilityScore": 0.8 // Optional (0-1)
    }
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "overallScore": 0.85,
    "crossClientCompatibility": {
      "score": 0.9,
      "supportedClients": ["gmail", "outlook_2016", "outlook_365"],
      "issues": [],
      "recommendations": [...]
    },
    "htmlValidation": {
      "isValid": true,
      "errors": [],
      "warnings": [...],
      "score": 0.85
    },
    "accessibility": {
      "score": 0.8,
      "issues": [...],
      "recommendations": [...],
      "wcagLevel": "AA"
    },
    "performance": {
      "score": 0.85,
      "metrics": {
        "fileSize": 73,
        "loadTime": 0.3,
        "imageOptimization": 0.9,
        "cssOptimization": 0.8
      },
      "recommendations": [...]
    },
    "autoFixSuggestions": [
      {
        "type": "accessibility",
        "priority": "high",
        "description": "Add alt attributes to images",
        "fix": "Add alt='' for decorative images..."
      }
    ],
    "summary": {
      "totalIssues": 2,
      "criticalIssues": 1,
      "passesMinimumThreshold": true,
      "readyForProduction": true
    }
  }
}
```

#### Validation Types
- Cross-client compatibility testing
- HTML validation and standards compliance
- Accessibility (WCAG AA) compliance
- Performance optimization analysis
- Auto-fix suggestion generation

#### Supported Email Clients
- Gmail
- Outlook 2016+
- Outlook 365
- Apple Mail
- Yahoo Mail
- Thunderbird
- Samsung Email

#### Scoring System
- **Overall Score**: Weighted average of all validation scores (0-1)
- **Minimum Threshold**: 0.7 (for basic functionality)
- **Production Ready**: 0.8+ (recommended for production use)

## API Features

### Content Generation
- **Description**: AI-powered content generation using OpenAI GPT-4o mini and Anthropic Claude
- **Providers**: OpenAI, Anthropic
- **Fallback Support**: Yes (automatic provider switching on failure)

### Design System Integration
- **Supported Platforms**: Figma
- **Token Types**: Colors, Typography, Spacing, Effects
- **Email Optimization**: Automatic conversion to email-safe formats

### Template Processing
- **Description**: MJML-based email template compilation with cross-client optimization
- **Output Formats**: HTML, MJML
- **Email Client Support**: Gmail, Outlook, Apple Mail, Yahoo Mail

### Quality Assurance
- **Validation Types**: Cross-client, Accessibility, Performance, HTML Standards
- **Auto-fix Suggestions**: Yes
- **WCAG Compliance**: AA Level

## Rate Limits & Constraints

- **Rate Limit**: 100 requests per minute per API key
- **Max File Size**: 10MB for uploads
- **Max Template Size**: 100KB HTML output
- **Cache TTL**: 1 hour for design tokens, 24 hours for generated content

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information or validation errors"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Rate Limited
- `500`: Internal Server Error
- `502`: External Service Error
- `503`: Service Unavailable

## Development Notes

Currently, all service endpoints are using mock implementations for development and testing purposes. The actual service integrations will be available in production with proper API keys and configurations for:

- OpenAI GPT-4o mini API
- Anthropic Claude API
- Figma REST API
- Litmus Email Testing API

The mock responses provide realistic data structures and validation patterns that match the expected production behavior. 