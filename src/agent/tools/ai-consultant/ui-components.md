# PHASE 13.6: INTERACTIVE UI COMPONENTS SPECIFICATION

## 🎨 UI/UX DESIGN SPECIFICATIONS

### **Main Interface Layout**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📧 Email Generation & Quality Improvement Workspace                │
├─────────────────────────────────────────────────────────────────────┤
│ Progress: [████████████████████░░░] 85% │ Score: 67→82 │ Step 2/3   │
├───────────────────────────┬─────────────────────────────────────────┤
│                           │ 🤖 AI Recommendations (5)              │
│  📱 Email Preview         │ ┌─────────────────────────────────────┐ │
│  ┌─────────────────────┐  │ │ 🎨 Visual: Replace rabbit emotion  │ │
│  │ [Live Email HTML]   │  │ │ Impact: +8 points                   │ │
│  │                     │  │ │ [✓ Auto] [✗ Skip] [👁 Details]    │ │
│  │ ⚠️ Issues highlighted │  │ └─────────────────────────────────────┘ │
│  │                     │  │ ┌─────────────────────────────────────┐ │
│  │                     │  │ │ 📝 Content: Improve subject line   │ │
│  │                     │  │ │ Impact: +5 points                   │ │
│  │                     │  │ │ [👤 Review] [✗ Skip] [👁 Details] │ │
│  └─────────────────────┘  │ └─────────────────────────────────────┘ │
│                           │                                         │
│  📊 Quality Dashboard     │ 💡 Next Steps:                         │
│  ┌─────────────────────┐  │ • Auto-apply 3 safe improvements       │
│  │ Overall: 67/100     │  │ • Review 2 content changes             │
│  │ [Quality Radar]     │  │ • Final score estimate: 82/100         │
│  │ Visual: 72          │  │                                         │
│  │ Content: 58 ⚠️      │  │                                         │
│  │ Technical: 89       │  │                                         │
│  └─────────────────────┘  │                                         │
├───────────────────────────┴─────────────────────────────────────────┤
│ [🔄 Apply Auto] [⏸ Pause] [⚙️ Settings] [✅ Complete] [❌ Cancel]  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 COMPONENT SPECIFICATIONS

### **1. QualityImprovementWorkspace.tsx**

**Purpose**: Main container component for the entire quality improvement interface

```tsx
interface QualityImprovementWorkspaceProps {
  emailTopic: string;
  initialData?: any;
  configuration: AIConsultantConfig;
  onComplete: (result: EmailGenerationResult) => void;
  onCancel: () => void;
}

interface WorkspaceState {
  currentStep: 'generating' | 'analyzing' | 'improving' | 'completed';
  progress: number;
  currentScore: number;
  targetScore: number;
  iteration: number;
  recommendations: QualityRecommendation[];
  emailHtml: string;
  isProcessing: boolean;
}
```

**Features**:
- Real-time progress tracking
- WebSocket connection management
- State synchronization across components
- Keyboard shortcuts (Space = pause/resume, Enter = approve first, Esc = cancel)
- Auto-save functionality

---

### **2. RecommendationsPanel.tsx**

**Purpose**: Interactive panel for viewing and managing AI recommendations

```tsx
interface RecommendationsPanelProps {
  recommendations: QualityRecommendation[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onBulkAction: (action: 'approve_all_auto' | 'reject_all' | 'approve_selected', ids?: string[]) => void;
  executingIds: string[];
}
```

**UI Elements**:
- **Filter tabs**: All, Auto-execute, Manual Review, Critical
- **Bulk actions**: "Apply all safe changes", "Reject all", custom selection
- **Sort options**: Priority, Impact, Complexity, Type
- **Search/filter**: Filter by keywords, type, estimated impact

**Recommendation Card Design**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🎨 Visual Enhancement                        💪 HIGH PRIORITY │
├─────────────────────────────────────────────────────────────┤
│ Replace current rabbit with happier emotion                 │
│ Current image doesn't match promotional tone                │
│                                                             │
│ 📈 Expected improvement: +8 points                          │
│ ⏱️ Execution time: ~30 seconds                             │
│ 🔒 Auto-executable (safe operation)                        │
│                                                             │
│ Command: get_figma_assets(['заяц', 'счастлив'])            │
│                                                             │
│ [✅ Approve] [❌ Reject] [👁️ View Details] [⚙️ Customize] │
└─────────────────────────────────────────────────────────────┘
```

---

### **3. InteractiveEmailPreview.tsx**

**Purpose**: Live email preview with problem highlighting and improvement visualization

```tsx
interface InteractiveEmailPreviewProps {
  htmlContent: string;
  issues: AnalyzedElement[];
  recommendations: QualityRecommendation[];
  onElementClick: (elementId: string) => void;
  highlightMode: 'issues' | 'improvements' | 'both' | 'none';
}
```

**Interactive Features**:
- **Problem highlighting**: Red outlines for issues, yellow for warnings
- **Hover tooltips**: Show specific problems and recommended fixes
- **Click interactions**: Click element to see related recommendations
- **Before/after comparison**: Split view or overlay showing changes
- **Device preview**: Desktop, tablet, mobile views
- **Email client simulation**: Gmail, Outlook, Apple Mail previews

**Highlight System**:
```css
.email-issue-critical { border: 2px solid #ef4444; background: rgba(239, 68, 68, 0.1); }
.email-issue-warning { border: 2px solid #f59e0b; background: rgba(245, 158, 11, 0.1); }
.email-improvement { border: 2px solid #10b981; background: rgba(16, 185, 129, 0.1); }
.email-processing { border: 2px solid #3b82f6; animation: pulse 2s infinite; }
```

---

### **4. QualityDashboard.tsx**

**Purpose**: Real-time quality metrics visualization with animated updates

```tsx
interface QualityDashboardProps {
  currentScore: number;
  targetScore: number;
  dimensionScores: Record<QualityDimension, number>;
  history: ScoreHistory[];
  recommendations: QualityRecommendation[];
}
```

**Visualization Components**:
- **Overall score**: Large circular progress with animated counting
- **Radar chart**: 5-dimensional quality breakdown
- **Progress timeline**: Show improvement over iterations
- **Quality gate indicator**: Clear pass/fail status
- **Recommendations summary**: Count by category and priority

**Score Display**:
```
┌─────────────────┐
│ Overall Quality │
│      🎯         │
│   67 → 82       │
│   ████████░░    │ 
│   Quality Gate  │
│   ✅ Projected  │
└─────────────────┘
```

---

### **5. ProgressHeader.tsx**

**Purpose**: Top-level progress indicator with current step and overall status

```tsx
interface ProgressHeaderProps {
  currentStep: QualityImprovementStep;
  progress: number;
  timeElapsed: number;
  estimatedTimeRemaining: number;
  canPause: boolean;
  canCancel: boolean;
}
```

**Progress Visualization**:
```
📧 Email Quality Improvement │ ████████████████████░░░ 85% │ 2:15 elapsed │ ~45s remaining
                             │ Step 2/3: Applying improvements                              
```

---

## 🔄 REAL-TIME INTERACTION FLOWS

### **Flow 1: Automatic Improvement**
1. **AI Analysis completes** → Recommendations appear in panel
2. **User clicks "Apply Auto"** → Safe recommendations execute automatically
3. **Email preview updates** → Live changes visible
4. **Score animates up** → Real-time score increase
5. **Next iteration** → Process repeats if needed

### **Flow 2: Manual Review**
1. **Recommendation appears** → Card shows in "Manual Review" section
2. **User clicks "View Details"** → Modal with full analysis
3. **User approves/rejects** → Immediate UI feedback
4. **If approved** → Command executes, preview updates
5. **Score updates** → Dashboard reflects changes

### **Flow 3: Interactive Editing**
1. **User clicks problematic element** → Highlight and show recommendations
2. **Tooltip appears** → Quick actions available
3. **User selects action** → Immediate execution or approval queue
4. **Preview updates** → Changes visible instantly

---

## 🎨 DESIGN SYSTEM

### **Color Palette**
- **Primary**: #3b82f6 (blue) - Actions, links, active states
- **Success**: #10b981 (green) - Approved, completed, quality gate passed
- **Warning**: #f59e0b (amber) - Manual review needed, warnings
- **Error**: #ef4444 (red) - Critical issues, rejected, failed
- **Info**: #6366f1 (indigo) - Information, AI insights
- **Neutral**: #6b7280 (gray) - Secondary text, borders

### **Typography**
- **Headers**: Inter 600 (semibold)
- **Body**: Inter 400 (regular)
- **Code**: JetBrains Mono 400
- **Numbers**: Tabular figures for scores and metrics

### **Animations**
- **Score changes**: Smooth counting animation (1-2 seconds)
- **Progress updates**: Smooth bar progression
- **Card interactions**: Subtle hover and click effects
- **Real-time updates**: Gentle pulse for new content
- **Loading states**: Skeleton screens and spinners

---

## 📱 RESPONSIVE DESIGN

### **Desktop (1440px+)**
- Three-column layout: Preview | Recommendations | Dashboard
- Full functionality available
- Side-by-side before/after comparisons

### **Tablet (768px - 1439px)**  
- Two-column layout: Preview | Recommendations+Dashboard
- Collapsible sidebar for dashboard
- Touch-friendly interaction zones

### **Mobile (< 768px)**
- Single-column with tabs: Preview | Recommendations | Dashboard
- Swipe gestures for navigation
- Simplified recommendation cards

---

## 🚀 IMPLEMENTATION PRIORITIES

### **MVP (Phase 13.6.1 - 2h)**
- Basic workspace layout
- WebSocket connection
- Simple recommendation cards
- Basic email preview

### **Enhanced (Phase 13.6.2 - 1h)**
- Interactive highlighting
- Real-time score updates
- Bulk actions
- Progress animations

### **Advanced (Phase 13.6.3 - 1h)**
- Before/after comparisons
- Advanced filtering
- Keyboard shortcuts
- Mobile responsive design

---

## 🧪 TESTING SCENARIOS

### **User Acceptance Tests**
- [ ] User can see email generation progress in real-time
- [ ] User can approve/reject recommendations with clear feedback
- [ ] User can see quality score improvements immediately
- [ ] User can pause/resume the improvement process
- [ ] User can understand what each recommendation will do
- [ ] User can see before/after comparisons
- [ ] Interface works smoothly on mobile devices

### **Performance Tests**
- [ ] WebSocket connection handles disconnections gracefully
- [ ] UI remains responsive during AI processing
- [ ] Animations don't block user interactions
- [ ] Real-time updates don't cause memory leaks
- [ ] Large emails (100KB+) render smoothly in preview

---

## 📋 DEVELOPMENT CHECKLIST

- [ ] **Setup React components** with TypeScript
- [ ] **Implement WebSocket** integration with FastAPI
- [ ] **Create recommendation cards** with interactive controls
- [ ] **Build email preview** with highlighting system
- [ ] **Add quality dashboard** with real-time charts
- [ ] **Implement responsive design** for mobile/tablet
- [ ] **Add animations** and smooth transitions
- [ ] **Test real-time** synchronization
- [ ] **Optimize performance** for large emails
- [ ] **Add accessibility** features (WCAG AA)

**Estimated Total Time**: 3-4 hours for full interactive UI implementation 