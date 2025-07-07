# Email-Makers Agent Optimization Tasks
**Project**: Agent Folders Optimization (tools & core)  
**Created**: 2025-01-07  
**Status**: Ready for Implementation  
**Complexity**: Level 3 (Intermediate Feature)  

---

## 🎯 Project Overview

Оптимизация папок `/src/agent/tools/` и `/src/agent/core/` для устранения дублирования функций, исправления архитектурных антипаттернов и улучшения организации кода в соответствии с OpenAI Agents SDK v2.

---

## 📋 Task List

### Phase 1: Immediate Duplications Cleanup
**Priority**: HIGH  
**Estimated Time**: 2 hours

#### Task 1.1: Remove Email Rendering Service Wrapper
- [ ] **Remove**: `/src/agent/core/email-rendering-service.ts`
- [ ] **Reason**: Architectural anti-pattern (core importing tools)
- [ ] **Verify**: No other files import this service
- [ ] **Test**: Ensure main agent still works

#### Task 1.2: Remove Unused Delivery Manager
- [ ] **Remove**: `/src/agent/tools/consolidated/delivery-manager.ts`
- [ ] **Reason**: Registry uses delivery-manager-fixed.ts instead
- [ ] **Verify**: No imports of original delivery manager
- [ ] **Test**: Ensure delivery functionality works

#### Task 1.3: Verify Email Renderer Services
- [ ] **Check**: If `/tools/email-renderer/services/` are used by email-renderer-v2.ts
- [ ] **Action**: Remove if unused, keep if used
- [ ] **Document**: Usage patterns for future maintenance

### Phase 1.5: Core Folder Optimization (NEW)
**Priority**: HIGH  
**Estimated Time**: 3 hours

#### Task 1.5.1: Logging Consolidation
- [ ] **Remove**: `/src/agent/core/logger.ts` (дубликат с shared/utils/logger.ts)
- [ ] **Update**: All imports from core/logger to shared/utils/logger
- [ ] **Extract**: Prometheus metrics to separate metrics service
- [ ] **Test**: Verify logging functionality works correctly

#### Task 1.5.2: Error Handling Consolidation
- [ ] **Integrate**: Retry logic from retry-wrapper.ts into error-handler.ts
- [ ] **Add**: executeWithRetry method to error-handler.ts
- [ ] **Remove**: retry-wrapper.ts after integration
- [ ] **Update**: All retry logic usage to use new method

#### Task 1.5.3: Handoff Implementation Cleanup
- [ ] **Move**: agent-handoffs.ts → useless/ (used only in examples)
- [ ] **Keep**: agent-handoffs-sdk.ts as proper SDK implementation
- [ ] **Verify**: Main agent doesn't use old handoff version
- [ ] **Update**: Examples to reference new location if needed

### Phase 2: Comprehensive File Usage Analysis
**Priority**: MEDIUM  
**Estimated Time**: 3 hours

#### Task 2.1: Scan All Tool Files
- [ ] **Analyze**: All files in `/src/agent/tools/` and subdirectories
- [ ] **Cross-reference**: With tool-registry.ts imports
- [ ] **Check**: Direct imports in core files
- [ ] **Identify**: Unused files for removal

#### Task 2.2: Verify Main Agent Integration
- [ ] **Test**: `/src/app/api/agent/run-improved/route.ts` functionality
- [ ] **Check**: Specialist agents file imports
- [ ] **Ensure**: All tool categories work correctly
- [ ] **Document**: Integration points

#### Task 2.3: Create Unused Files List
- [ ] **Generate**: Complete list of unused files
- [ ] **Categorize**: By reason for non-usage
- [ ] **Verify**: Each file is truly unused (no indirect imports)
- [ ] **Prepare**: For move to useless folder

### Phase 2.5: Tools Verification (NEW)
**Priority**: MEDIUM  
**Estimated Time**: 2 hours

#### Task 2.5.1: Verify Active Tools (DO NOT DELETE)
- [ ] **Keep**: ai-tag-mapper.ts (used in 3 files)
- [ ] **Keep**: airports-loader.ts (used in prices.ts)
- [ ] **Keep**: image-planning.ts (used in tool-registry.ts)
- [ ] **Keep**: ml-scoring-tools.ts (used in tool-registry.ts)
- [ ] **Keep**: All diff.ts, patch.ts, percy.ts, upload.ts (130+ uses)
- [ ] **Keep**: figma-local-processor.ts (multiple uses)

#### Task 2.5.2: Move Truly Unused Files
- [ ] **Move**: external-image-agent.ts → useless/agent/tools/
- [ ] **Move**: render-test.ts → useless/agent/tools/
- [ ] **Create**: MOVED_FILES.md with reasons for each move
- [ ] **Verify**: No broken imports after moves

### Phase 3: File Organization & Optimization
**Priority**: MEDIUM  
**Estimated Time**: 2 hours

#### Task 3.1: Move Unused Files
- [ ] **Create**: `/useless/agent/` directory structure if not exists
- [ ] **Move**: All confirmed unused files
- [ ] **Maintain**: Directory structure in useless folder
- [ ] **Document**: Reason for each moved file

#### Task 3.2: Optimize File Structure
- [ ] **Review**: `/tools/simple/` vs `/tools/consolidated/` organization
- [ ] **Consolidate**: Similar functionality if beneficial
- [ ] **Standardize**: Naming conventions
- [ ] **Clean**: Empty directories

#### Task 3.3: Fix Architectural Dependencies
- [ ] **Ensure**: Core files don't import tool files
- [ ] **Fix**: Any remaining dependency direction issues
- [ ] **Optimize**: Import paths for better organization
- [ ] **Document**: New architectural patterns

### Phase 3.5: Core Structure Reorganization (NEW)
**Priority**: MEDIUM  
**Estimated Time**: 2 hours

#### Task 3.5.1: Final Core Folder Structure
```
src/agent/core/
├── tool-registry.ts          # Keep - actively used
├── prompt-manager.ts         # Keep - actively used
├── error-handler.ts          # Keep - merge with retry logic
├── cache-manager.ts          # Keep - simplify for in-memory
├── state-manager.ts          # Keep - for workflow tracking
├── config.ts                 # Keep - configuration
├── openai-agents-config.ts   # Keep - SDK configuration
└── [Remove/Move]
    ├── agent-handoffs.ts     # Move to useless/
    ├── retry-wrapper.ts      # Remove - merge into error-handler
    └── logger.ts             # Remove - use shared/utils/logger
```

#### Task 3.5.2: Cache Manager Simplification
- [ ] **Remove**: Redis dependency from cache-manager
- [ ] **Implement**: In-memory only caching
- [ ] **Add**: Interface for future extensions
- [ ] **Document**: Cache usage patterns

### Phase 4: System Verification & Testing
**Priority**: HIGH  
**Estimated Time**: 2 hours

#### Task 4.1: Functionality Testing
- [ ] **Test**: Main agent API endpoint
- [ ] **Verify**: All tool categories work
- [ ] **Check**: Specialist agent handoffs
- [ ] **Ensure**: No broken imports or missing files

#### Task 4.2: Performance Verification
- [ ] **Measure**: Tool loading times
- [ ] **Check**: Registry initialization
- [ ] **Verify**: No performance degradation
- [ ] **Document**: Performance improvements

#### Task 4.3: Integration Testing
- [ ] **Test**: Complete email generation workflow
- [ ] **Verify**: All tools accessible through registry
- [ ] **Check**: Error handling for missing tools
- [ ] **Ensure**: System stability

### Phase 5: Documentation & Cleanup
**Priority**: MEDIUM  
**Estimated Time**: 1 hour

#### Task 5.1: Update Memory Bank
- [ ] **Update**: activeContext.md with optimization results
- [ ] **Document**: Files removed and reasons
- [ ] **Record**: Performance improvements
- [ ] **Note**: Architectural improvements made

#### Task 5.2: Update Project Documentation
- [ ] **Document**: New file organization
- [ ] **Update**: Import patterns and dependencies
- [ ] **Record**: Optimization metrics
- [ ] **Create**: File usage guide

### Phase 6: OpenAI SDK Validation (NEW)
**Priority**: HIGH  
**Estimated Time**: 1 hour

#### Task 6.1: Validate OpenAI Agents SDK Compliance
- [ ] **Verify**: All tools use proper `tool()` function from SDK
- [ ] **Check**: Tool definitions follow SDK schema (name, description, parameters, execute)
- [ ] **Validate**: Zod schemas for parameter validation
- [ ] **Ensure**: Error handling follows SDK patterns

#### Task 6.2: Update Tool Registry Integration
- [ ] **Verify**: ML scoring tools properly integrated via native SDK
- [ ] **Check**: Tool registry returns proper SDK tool objects
- [ ] **Validate**: All handoffs use Agent.create() for type safety
- [ ] **Test**: Tool execution through SDK run() function

---

## 📊 Expected Results

### Quantitative Metrics
- **Code Reduction**: ~40% less duplication
- **Files Moved**: 10-15 files to useless/
- **Architecture Issues Fixed**: 3+ dependency issues
- **Performance**: Maintained or improved

### Qualitative Improvements
- **Code Quality**: Cleaner, more maintainable
- **Architecture**: Proper dependency directions (Tools → Core, not Core → Tools)
- **SDK Compliance**: Full OpenAI Agents SDK v2 compatibility
- **Documentation**: Clear usage patterns

---

## ⚠️ Critical Notes

### Files to KEEP (Actively Used)
1. **agent-tools.ts** - Used in delivery services (11 files)
2. **ai-tag-mapper.ts** - Used in asset planning
3. **airports-loader.ts** - Used in pricing
4. **image-planning.ts** - Used in tool registry (legacy path)
5. **ml-scoring-tools.ts** - Native SDK integration
6. **All diff/patch/percy/upload tools** - Extensive usage (130+ files)

### Architecture Rules
1. **Never**: Core files importing tool files
2. **Always**: Tools importing core utilities
3. **Maintain**: OpenAI SDK patterns (tool(), Agent.create())
4. **Preserve**: Working functionality during refactoring

---

## 🔄 Implementation Order

1. **Start with Phase 1 & 1.5**: Remove obvious duplicates and fix core
2. **Then Phase 2 & 2.5**: Analyze usage thoroughly
3. **Continue with Phase 3 & 3.5**: Reorganize structure
4. **Finish with Phase 4-6**: Test and validate

---

## ✅ Success Criteria

- [ ] Zero TypeScript errors after changes
- [ ] All tests passing
- [ ] Main agent API working correctly
- [ ] No broken imports
- [ ] Improved file organization
- [ ] Full OpenAI SDK compliance
- [ ] Documentation updated

---

**Total Estimated Time**: 16 hours  
**Risk Level**: Medium (system integration changes)  
**Recommendation**: Implement in stages with thorough testing between phases