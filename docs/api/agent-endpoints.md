# Email-Makers Agent API Documentation

## POST `/api/agent/run-improved`

Initiates an AI-powered email campaign creation process using the OpenAI Agents SDK multi-specialist workflow.

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `task_type` | string | Type of task to execute. Currently supports `"email_campaign_creation"` | `"email_campaign_creation"` |
| `input` | string | Campaign topic or brief describing the email content to generate | `"Guatemala autumn travel"` |

### Optional Fields

| Field | Type | Default | Description | Example |
|-------|------|---------|-------------|---------|
| `trace_id` | string | auto-generated | Unique identifier for tracking the campaign creation process | `"campaign_20241220_1234567890"` |
| `additional_context` | object | `{}` | Additional context for campaign customization | `{"brand": "TravelCorp", "audience": "adventure travelers"}` |

### Request Headers

```
Content-Type: application/json
```

### Request Body Schema

```json
{
  "task_type": "email_campaign_creation",
  "input": "string (required)",
  "trace_id": "string (optional)",
  "additional_context": {
    "brand": "string (optional)",
    "audience": "string (optional)",
    "tone": "string (optional)",
    "design_style": "string (optional)"
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:3000/api/agent/run-improved \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "email_campaign_creation",
    "input": "Guatemala autumn travel adventure package",
    "additional_context": {
      "brand": "AdventureTravel Co",
      "audience": "adventure enthusiasts aged 25-45",
      "tone": "exciting and informative"
    }
  }'
```

### Response Format

#### Success Response (200 OK)

```json
{
  "success": true,
  "campaign_id": "campaign_20241220_1234567890",
  "message": "Email campaign creation initiated successfully",
  "trace_id": "campaign_20241220_1234567890",
  "estimated_completion_time": "6-8 minutes",
  "monitoring": {
    "logs_path": "logs/campaign_20241220_1234567890.log",
    "campaign_folder": "campaigns/campaign_20241220_1234567890/"
  }
}
```

#### Error Response (400 Bad Request)

```json
{
  "error": "Missing required fields: task_type and input",
  "required_fields": ["task_type", "input"],
  "provided_fields": ["input"]
}
```

#### Error Response (500 Internal Server Error)

```json
{
  "error": "Campaign creation failed",
  "details": "OpenAI API rate limit exceeded",
  "trace_id": "campaign_20241220_1234567890"
}
```

### Multi-Agent Workflow

The endpoint orchestrates a complex multi-specialist workflow:

1. **Orchestrator** - Creates campaign folder and coordinates specialists
2. **Data Collection Specialist** - Gathers market research and travel data
3. **Content Specialist** - Generates email copy and content structure
4. **Design Specialist** - Creates MJML templates, previews, and design assets
5. **Quality Assurance Specialist** - Validates templates and cross-client compatibility
6. **Delivery Specialist** - Finalizes and packages the email campaign

### Campaign Output Structure

Successful campaigns generate the following file structure:

```
campaigns/{campaign_id}/
├── templates/
│   ├── email-template.mjml
│   ├── email-template.html
│   └── email-template-mobile.html
├── assets/
│   ├── images/
│   └── manifest.json
├── docs/
│   ├── content-brief.json
│   ├── design-package.json
│   └── quality-report.json
├── handoffs/
│   ├── data-to-content.json
│   ├── content-to-design.json
│   ├── design-to-quality.json
│   └── quality-to-delivery.json
└── logs/
    └── campaign.log
```

### Monitoring Campaign Progress

Monitor campaign creation progress by checking the log file:

```bash
# Monitor logs in real-time
tail -f logs/{campaign_id}.log

# Check specific campaign folder
ls -la campaigns/{campaign_id}/
```

### Processing Time

- **Typical Duration**: 6-8 minutes
- **Factors Affecting Time**: 
  - Complexity of travel destination
  - OpenAI API response times
  - Image generation and optimization
  - Cross-client template validation

### Rate Limits

- **Concurrent Campaigns**: Maximum 3 simultaneous campaigns
- **API Calls**: Respects OpenAI API rate limits
- **File Size**: Generated templates must be <100KB for email client compatibility

### Error Handling

The API implements comprehensive error handling:

- **Validation Errors**: Missing or invalid required fields
- **OpenAI API Errors**: Rate limits, authentication, or service issues
- **File System Errors**: Disk space or permission issues
- **Template Errors**: MJML compilation or validation failures

### Troubleshooting

Common issues and solutions:

1. **Missing required fields**: Ensure both `task_type` and `input` are provided
2. **Campaign stuck**: Check logs for specific specialist errors
3. **Template validation failures**: Review MJML syntax and email client compatibility
4. **API timeouts**: OpenAI API may be experiencing high load, retry after delay

### Related Endpoints

- `GET /api/campaigns/{campaign_id}` - Retrieve campaign details
- `GET /api/campaigns/{campaign_id}/preview` - View email preview
- `GET /api/campaigns/{campaign_id}/download` - Download campaign package 