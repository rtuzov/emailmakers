# Email-Makers Agent - Curl Testing Results

## 🚀 Agent Testing Summary

**Server Status**: ✅ Running on http://localhost:3000  
**Test Date**: $(date)  
**Agent Mode**: REAL_AGENT_ACTIVE  

---

## ✅ Working Endpoints

### 1. Health Check
```bash
curl -s http://localhost:3000/api/health | jq '.status, .checks.database.status, .checks.memory.status'
```
**Result**: ✅ "healthy", "pass", "pass"

### 2. Agent Status
```bash
curl -s http://localhost:3000/api/agent/run | jq '.status, .message, .mode'
```
**Result**: ✅ "healthy", "Kupibilet Email Generator Agent API", "REAL_AGENT_ACTIVE"

### 3. Content Validation
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"content": "Тестовое содержимое письма с информацией о путешествии в Москву", "type": "text", "title": "Тестовая тема письма"}' \
  http://localhost:3000/api/content/validate | jq '.success, .data.isValid'
```
**Result**: ✅ true, true

### 4. Quality Validation
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"html": "<!DOCTYPE html><html><body><h1>Test Email</h1><p>This is a test email template.</p></body></html>", "type": "email_template"}' \
  http://localhost:3000/api/quality/validate | jq '.success'
```
**Result**: ✅ true

### 5. Environment Check
```bash
curl -s http://localhost:3000/api/agent/env-check | jq '.success, .summary.critical_ready'
```
**Result**: ✅ Environment ready, 1 ready service, 8 configured services

### 6. Offline Agent Test (Working!)
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"topic": "Test Campaign"}' \
  http://localhost:3000/api/agent/test-offline
```
**Result**: ✅ Successfully generates HTML email template

---

## ⚠️ Issues Found

### 1. Main Agent Run - Schema Validation Error
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"topic": "Акция: Дешевые билеты в Москву", "destination": "MOW", "origin": "LED"}' \
  http://localhost:3000/api/agent/run
```
**Error**: `Invalid schema for function 'content_create': In context=('properties', 'target_audience', 'anyOf', '0', 'anyOf', '0', 'not'), schema must have a 'type' key.`

### 2. Comprehensive Agent Test - T1 Tool Error
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"topic": "Путешествие в Санкт-Петербург"}' \
  http://localhost:3000/api/agent/test-comprehensive
```
**Error**: `T1 failed: localResult.data.map is not a function`

---

## 🛠️ Recommended Test Commands

### Quick Health Check
```bash
curl -s http://localhost:3000/api/health | jq '.status'
```

### Test Agent Availability
```bash
curl -s http://localhost:3000/api/agent/run | jq '.mode'
```

### Working Agent Test (Offline Mode)
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"topic": "Путешествие в Москву"}' \
  http://localhost:3000/api/agent/test-offline | jq '.status'
```

### Content Validation Test
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{
    "content": "Специальное предложение: билеты в Европу со скидкой до 40%. Бронируйте сейчас!",
    "type": "text",
    "title": "Акция на авиабилеты",
    "brandGuidelines": {
      "tone": "friendly",
      "voice": "enthusiastic"
    }
  }' \
  http://localhost:3000/api/content/validate | jq '.success, .data.isValid'
```

### Quality Check Test
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{
    "html": "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\"><html><head><title>Email</title></head><body><table width=\"600\"><tr><td><h1>Скидки на билеты!</h1><p>Лучшие предложения для путешествий.</p></td></tr></table></body></html>",
    "type": "email_template"
  }' \
  http://localhost:3000/api/quality/validate | jq '.success'
```

---

## 🔧 Environment Status

**API Keys Configured**:
- ✅ OpenAI (ready and tested)
- ⚠️ Anthropic (configured, not tested)
- ⚠️ Figma (configured, not tested)
- ⚠️ AWS S3 (configured, not tested)
- ⚠️ Percy (configured)
- ❌ Litmus (missing)
- ❌ Kupibilet (missing)

**Recommendations**:
- The offline agent works perfectly for testing
- Main agent needs schema validation fixes
- T1 tool (Figma assets) needs debugging

---

## 📊 Test Results Summary

| Endpoint | Status | Notes |
|----------|--------|-------|
| Health Check | ✅ Pass | Server healthy |
| Agent Status | ✅ Pass | Agent ready |
| Content Validation | ✅ Pass | Validates properly |
| Quality Validation | ✅ Pass | HTML validation works |
| Environment Check | ✅ Pass | APIs configured |
| Offline Agent | ✅ Pass | **Generates working emails!** |
| Main Agent Run | ❌ Fail | Schema validation error |
| Comprehensive Test | ❌ Fail | T1 tool error |

**Overall Status**: 🟡 Partially Working - Offline mode fully functional, online mode needs fixes 