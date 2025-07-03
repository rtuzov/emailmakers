# 📡 API INTEGRATION SPECIFICATIONS

**Project**: Email-Makers Frontend-Backend Integration  
**Date**: 2025-01-27  
**Purpose**: Complete API documentation for frontend integration

---

## 🎯 **PRIMARY INTEGRATION ENDPOINTS**

### **1. Agent Run API** - `/api/agent/run`
**Purpose**: Main email generation endpoint for Create page integration

#### **Request Format:**
```typescript
POST /api/agent/run
Content-Type: application/json

{
  // New format (preferred)
  briefText: string;
  destination?: string;  // Default: "Париж"
  origin?: string;      // Default: "Москва"
  tone?: string;        // Optional
  language?: string;    // Optional
  
  // Old format (also supported)
  topic?: string;
  destination?: string;
  origin?: string;
}
```

#### **Response Format:**
```typescript
// Success Response
{
  status: 'success';
  data: {
    template_id: string;
    html_content: string;
    mjml_content: string;
    text_content: string;
    subject_line: string;
    preview_text: string;
    design_tokens: any;
    quality_scores: {
      content_quality: number;
      design_quality: number;
      deliverability_score: number;
      overall_quality: number;
    };
    file_urls?: {
      html_file: string;
      mjml_file: string;
      text_file: string;
      preview_image: string;
    };
  };
  metadata: {
    generation_time: number;
    mode: string;
    apis_used: string[];
    template_size?: number;
    agent_confidence_scores?: Record<string, number>;
  };
}

// Error Response  
{
  status: 'error';
  error_message: string;
  generation_time: number;
}
```

#### **Integration Status:**
- ✅ **Backend**: Fully functional, real agent execution
- ⚠️ **Frontend**: Already integrated but needs progress tracking improvements
- 🔄 **Next Steps**: Add real-time progress tracking, improve error handling

---

### **2. Templates API** - `/api/templates`
**Purpose**: Dynamic template loading for Templates page

#### **Request Format:**
```typescript
GET /api/templates?page=1&limit=12&category=all&search=&status=published&sortBy=createdAt&sortOrder=desc&tags=&userId=&qualityMin=&qualityMax=&agentGenerated=&dateStart=&dateEnd=
```

#### **Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 12, max: 50)  
- `category`: string | 'all' (categories: promotional, transactional, welcome, newsletter, announcement)
- `search`: string (searches name, description, briefText)
- `status`: 'published' | 'draft' | null
- `sortBy`: 'createdAt' | 'updatedAt' | 'name' | 'openRate' | 'clickRate' | 'qualityScore'
- `sortOrder`: 'desc' | 'asc'
- `tags`: comma-separated string
- `userId`: string
- `qualityMin`: number (0-100)
- `qualityMax`: number (0-100)
- `agentGenerated`: 'true' | 'false'
- `dateStart`: ISO date string
- `dateEnd`: ISO date string

#### **Response Format:**
```typescript
{
  success: boolean;
  data: {
    templates: Array<{
      id: string;
      name: string;
      category: string;
      description: string;
      thumbnail?: string;
      preview?: string;
      createdAt: string;
      updatedAt?: string;
      tags?: string[];
      status?: 'published' | 'draft';
      openRate?: number;
      clickRate?: number;
      qualityScore?: number;
      agentGenerated?: boolean;
      userId?: string;
      subjectLine?: string;
      previewText?: string;
      // Database fields
      briefText?: string;
      generatedContent?: any;
      mjmlCode?: string;
      htmlOutput?: string;
      designTokens?: any;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters: {
      categories: Array<{ value: string; label: string; count: number }>;
      tags: string[];
    };
  };
  metadata?: {
    query_time: number;
    cache_status: string;
  };
}
```

#### **Integration Status:**
- ✅ **Backend**: Fully functional with database integration and mock data fallback
- ❌ **Frontend**: Using static mock data, needs API integration
- 🔄 **Next Steps**: Replace static data, add filtering and search, implement pagination

---

### **3. Agent Status API** - `/api/agent/status`
**Purpose**: Live agent status for homepage and dashboard integration

#### **Request Format:**
```typescript
GET /api/agent/status?agent=<agent_id>&metrics=true&health=true

// Optional query parameters:
// - agent: specific agent ID to filter
// - metrics: include performance metrics
// - health: include health status
```

#### **Response Format:**
```typescript
{
  success: boolean;
  agents: Array<{
    id: string;
    name: string;
    status: 'active' | 'standby' | 'error' | 'offline';
    description: string;
    capabilities: string[];
    lastActivity: string;
    color: string;
    icon: string;
    metrics?: {
      uptime: string;
      tasksCompleted: number;
      avgResponseTime: number;
      errorRate: number;
      lastError?: string;
    };
    health?: {
      cpu: number;
      memory: number;
      connections: number;
      status: 'healthy' | 'warning' | 'critical';
    };
  }>;
  system_status: {
    totalAgents: number;
    activeAgents: number;
    completedTasks: number;
    avgResponseTime: string;
    systemHealth: 'healthy' | 'warning' | 'critical';
    lastUpdate: string;
  };
  timestamp: string;
}
```

#### **POST Actions:**
```typescript
POST /api/agent/status
{
  action: 'restart' | 'test' | 'update_status' | 'get_logs' | 'clear_errors';
  agent_id: string;
  data?: any;
}
```

#### **Integration Status:**
- ✅ **Backend**: Fully functional with real agent monitoring
- ❌ **Frontend**: Using hardcoded stats, needs API integration  
- 🔄 **Next Steps**: Connect homepage stats, add real-time updates

---

### **4. System Metrics API** - `/api/metrics`
**Purpose**: Prometheus metrics for system monitoring

#### **Request Format:**
```typescript
GET /api/metrics
```

#### **Response Format:**
```
Content-Type: text/plain; version=0.0.4; charset=utf-8

# Prometheus metrics format
# HELP metric_name Description
# TYPE metric_name counter/gauge/histogram
metric_name{label="value"} 123.456
```

#### **Integration Status:**
- ✅ **Backend**: Prometheus metrics available
- ❌ **Frontend**: Not integrated, needs parsing and display
- 🔄 **Next Steps**: Parse metrics for dashboard display

---

### **5. Optimization API** - `/api/optimization/demo`
**Purpose**: Optimization dashboard integration

#### **Request Format:**
```typescript
GET /api/optimization/demo?type=basic|simulation|integration

POST /api/optimization/demo
{
  action: 'custom_demo' | 'analyze_system' | 'get_recommendations';
  config?: any;
}
```

#### **Response Format:**
```typescript
{
  success: boolean;
  timestamp: string;
  demo?: {
    type: string;
    description: string;
    features: string[];
  };
  logs?: string[];
  summary?: {
    total_log_entries: number;
    demo_duration: string;
    status: string;
  };
  results?: {
    system_analysis: any;
    recommendations: any;
    service_status: any;
  };
}
```

#### **Integration Status:**
- ✅ **Backend**: Fully functional optimization system
- ⚠️ **Frontend**: Large static component, needs API integration
- 🔄 **Next Steps**: Connect to real optimization data

---

## 🔧 **MISSING API ENDPOINTS**

### **1. Agent Progress Tracking** - `/api/agent/progress` ❌ MISSING
**Current Issue**: Create page tries to track progress but endpoint doesn't exist

**Required Implementation:**
```typescript
GET /api/agent/progress?traceId=<trace_id>

Response:
{
  success: boolean;
  progress: {
    trace_id: string;
    overall_progress: number;
    current_agent: string;
    agents: Array<{
      agent: string;
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      progress_percentage: number;
      current_operation?: string;
      confidence_score?: number;
      error?: string;
    }>;
    status: 'initializing' | 'running' | 'completed' | 'failed';
    start_time: number;
    estimated_completion?: number;
    error?: string;
  };
}
```

### **2. Agent Logs API** - `/api/agent/logs` ❌ MISSING
**Current Issue**: Create page tries to monitor logs but endpoint doesn't exist

**Required Implementation:**
```typescript
GET /api/agent/logs?traceId=<trace_id>&limit=50&level=all|info|warn|error

Response:
{
  success: boolean;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    agent?: string;
    tool?: string;
    traceId?: string;
  }>;
}
```

---

## 📊 **INTEGRATION IMPLEMENTATION PLAN**

### **Phase 1: Fix Create Page Integration** (2-3 hours)
#### **Issues to Resolve:**
1. **Missing Progress Tracking**: Implement `/api/agent/progress` endpoint
2. **Missing Logs Monitoring**: Implement `/api/agent/logs` endpoint  
3. **Error Handling**: Improve error handling and retry logic
4. **Real-time Updates**: Better WebSocket or polling implementation

#### **Implementation Tasks:**
1. Create progress tracking endpoint
2. Create logs monitoring endpoint
3. Update Create page to handle missing endpoints gracefully
4. Improve error messages and retry mechanisms

### **Phase 2: Templates Page Integration** (2-3 hours)
#### **Current Status:**
- Backend API fully functional
- Frontend using static mock data

#### **Implementation Tasks:**
1. Replace static mock data with API calls to `/api/templates`
2. Implement search and filtering functionality
3. Add pagination controls
4. Implement template preview and download
5. Add loading states and error handling

### **Phase 3: Homepage Metrics Integration** (2-3 hours)
#### **Current Status:**  
- Backend APIs available (`/api/agent/status`, `/api/metrics`)
- Frontend showing hardcoded stats

#### **Implementation Tasks:**
1. Connect to `/api/agent/status` for agent information
2. Parse `/api/metrics` for system health data
3. Implement real-time status updates (30-second refresh)
4. Add status indicators and health monitoring

### **Phase 4: Dashboard Integration** (3-4 hours)
#### **Current Status:**
- Optimization dashboard has large static component
- Backend APIs available (`/api/optimization/*`)

#### **Implementation Tasks:**
1. Connect optimization dashboard to real APIs
2. Integrate agent debug with real agent logs
3. Connect monitoring charts to live metrics
4. Add real-time dashboard updates

---

## 🚀 **IMMEDIATE NEXT STEPS**

### **Action 1: Create Missing Endpoints** (1 hour)
1. Implement `/api/agent/progress` endpoint
2. Implement `/api/agent/logs` endpoint
3. Test endpoints with Create page

### **Action 2: Update Create Page** (1-2 hours)
1. Handle missing endpoints gracefully  
2. Improve error handling and user feedback
3. Add better loading states and retry logic

### **Action 3: Templates Page Integration** (2-3 hours)
1. Replace static data with `/api/templates` calls
2. Implement filtering and search
3. Add pagination and loading states

### **Action 4: Homepage Integration** (2-3 hours)
1. Connect to `/api/agent/status` and `/api/metrics`
2. Replace hardcoded stats with live data
3. Add real-time updates

---

## 🎯 **SUCCESS CRITERIA**

### **Complete Integration Achieved:**
- ✅ Create page: Real email generation with progress tracking
- ✅ Templates page: Dynamic template loading from database
- ✅ Homepage: Live system metrics and agent status
- ✅ Dashboards: Real-time monitoring and optimization data
- ✅ Error handling: Comprehensive error handling and retry logic
- ✅ Performance: All API responses < 2 seconds
- ✅ Real-time: Live updates via polling or WebSocket

### **User Experience:**
- Smooth email generation workflow with real-time progress
- Dynamic template browsing with search and filtering
- Live system status and health monitoring
- Proper loading states and error messages throughout

**Status**: Ready to begin implementation with missing endpoints creation 