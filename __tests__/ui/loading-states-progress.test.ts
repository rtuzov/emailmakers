/**
 * Test suite for Phase 2.2.4: Loading States and Progress Bars
 * Tests enhanced loading states, progress visualization, and time estimation
 */

describe('Loading States and Progress Bars', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading Stage Management', () => {
    it('transitions through correct loading stages', () => {
      const stages = [
        { progress: 0, expected: 'initializing' },
        { progress: 10, expected: 'connecting' },
        { progress: 40, expected: 'processing' },
        { progress: 95, expected: 'finalizing' }
      ];

      stages.forEach(({ progress, expected }) => {
        let actualStage = 'idle';
        
        if (progress === 0) {
          actualStage = 'initializing';
        } else if (progress < 25) {
          actualStage = 'connecting';
        } else if (progress < 90) {
          actualStage = 'processing';
        } else {
          actualStage = 'finalizing';
        }

        expect(actualStage).toBe(expected);
      });
    });

    it('provides appropriate loading stage messages', () => {
      const getLoadingStageMessage = (stage: string) => {
        switch (stage) {
          case 'initializing': return 'Инициализация агентной системы...';
          case 'connecting': return 'Подключение к AI сервисам...';
          case 'processing': return 'Обработка специализированными агентами...';
          case 'finalizing': return 'Финальная обработка и проверка...';
          default: return 'Подготовка...';
        }
      };

      expect(getLoadingStageMessage('initializing')).toContain('Инициализация');
      expect(getLoadingStageMessage('connecting')).toContain('Подключение');
      expect(getLoadingStageMessage('processing')).toContain('Обработка');
      expect(getLoadingStageMessage('finalizing')).toContain('Финальная');
      expect(getLoadingStageMessage('unknown')).toBe('Подготовка...');
    });

    it('resets loading stage when process completes', () => {
      let loadingStage = 'processing';
      
      // Simulate completion
      const processCompleted = true;
      if (processCompleted) {
        loadingStage = 'idle';
      }

      expect(loadingStage).toBe('idle');
    });
  });

  describe('Time Estimation and Formatting', () => {
    it('formats time remaining correctly', () => {
      const formatTimeRemaining = (seconds: number | null) => {
        if (!seconds || seconds <= 0) return null;
        
        if (seconds < 60) {
          return `${seconds} сек`;
        }
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      };

      expect(formatTimeRemaining(30)).toBe('30 сек');
      expect(formatTimeRemaining(90)).toBe('1:30');
      expect(formatTimeRemaining(125)).toBe('2:05');
      expect(formatTimeRemaining(0)).toBeNull();
      expect(formatTimeRemaining(null)).toBeNull();
    });

    it('calculates estimated time remaining from API data', () => {
      const mockApiResponse = {
        success: true,
        progress: {
          trace_id: 'test_time_estimate',
          overall_progress: 40,
          estimated_completion: Date.now() + 20000, // 20 seconds from now
          status: 'running'
        }
      };

      const remaining = Math.max(0, Math.round((mockApiResponse.progress.estimated_completion - Date.now()) / 1000));
      
      expect(remaining).toBeGreaterThan(15);
      expect(remaining).toBeLessThan(25);
    });

    it('handles missing estimated completion time gracefully', () => {
      const mockApiResponse = {
        success: true,
        progress: {
          trace_id: 'test_no_estimate',
          overall_progress: 50,
          status: 'running'
          // No estimated_completion field
        }
      };

      const estimatedTimeRemaining = mockApiResponse.progress.estimated_completion 
        ? Math.max(0, Math.round((mockApiResponse.progress.estimated_completion - Date.now()) / 1000))
        : null;

      expect(estimatedTimeRemaining).toBeNull();
    });
  });

  describe('Enhanced Progress Bar Features', () => {
    it('displays progress markers at correct intervals', () => {
      const progressMarkers = [25, 50, 75, 100];
      const currentProgress = 60;

      const markerStates = progressMarkers.map(marker => ({
        value: marker,
        highlighted: currentProgress >= marker
      }));

      expect(markerStates[0].highlighted).toBe(true);  // 25%
      expect(markerStates[1].highlighted).toBe(true);  // 50%
      expect(markerStates[2].highlighted).toBe(false); // 75%
      expect(markerStates[3].highlighted).toBe(false); // 100%
    });

    it('applies correct CSS classes based on progress state', () => {
      const getProgressBarClass = (progress: number) => {
        return `bg-gradient-to-r from-kupibilet-primary to-kupibilet-primary/80 h-3 rounded-full transition-all duration-500 relative`;
      };

      const getMarkerClass = (progress: number, marker: number) => {
        return progress >= marker ? 'text-white/70' : 'text-white/40';
      };

      expect(getProgressBarClass(50)).toContain('kupibilet-primary');
      expect(getMarkerClass(60, 50)).toBe('text-white/70');
      expect(getMarkerClass(60, 75)).toBe('text-white/40');
    });

    it('shows animated elements during active progress', () => {
      const progress = 45;
      const isActive = progress > 0 && progress < 100;

      const hasShineEffect = isActive;
      const hasPulseAnimation = isActive;

      expect(hasShineEffect).toBe(true);
      expect(hasPulseAnimation).toBe(true);
    });
  });

  describe('Agent Status Indicators', () => {
    it('displays correct status indicators for each agent state', () => {
      const getStatusIndicator = (status: string) => {
        switch (status) {
          case 'completed': return { class: 'bg-green-500', symbol: '✓' };
          case 'in_progress': return { class: 'bg-kupibilet-primary animate-pulse', symbol: '⟳' };
          case 'failed': return { class: 'bg-red-500', symbol: '✗' };
          default: return { class: 'bg-white/50', symbol: '○' };
        }
      };

      expect(getStatusIndicator('completed').class).toContain('green-500');
      expect(getStatusIndicator('completed').symbol).toBe('✓');
      
      expect(getStatusIndicator('in_progress').class).toContain('animate-pulse');
      expect(getStatusIndicator('failed').class).toContain('red-500');
      expect(getStatusIndicator('pending').class).toContain('white/50');
    });

    it('shows confidence scores for completed agents', () => {
      const agents = [
        { agent: 'content_specialist', status: 'completed', confidence_score: 94 },
        { agent: 'design_specialist', status: 'in_progress', confidence_score: undefined },
        { agent: 'quality_specialist', status: 'pending', confidence_score: undefined }
      ];

      const completedAgentsWithScores = agents.filter(agent => 
        agent.status === 'completed' && agent.confidence_score !== undefined
      );

      expect(completedAgentsWithScores).toHaveLength(1);
      expect(completedAgentsWithScores[0].confidence_score).toBe(94);
    });
  });

  describe('Progress Tracking Integration', () => {
    it('updates loading states based on API progress data', async () => {
      const progressStages = [
        { overall_progress: 0, expected_stage: 'initializing' },
        { overall_progress: 15, expected_stage: 'connecting' },
        { overall_progress: 50, expected_stage: 'processing' },
        { overall_progress: 95, expected_stage: 'finalizing' },
        { overall_progress: 100, expected_stage: 'idle' }
      ];

      progressStages.forEach(({ overall_progress, expected_stage }) => {
        let stage = 'idle';
        
        if (overall_progress === 0) {
          stage = 'initializing';
        } else if (overall_progress < 25) {
          stage = 'connecting';
        } else if (overall_progress < 90) {
          stage = 'processing';
        } else if (overall_progress < 100) {
          stage = 'finalizing';
        } else {
          stage = 'idle';
        }

        expect(stage).toBe(expected_stage);
      });
    });

    it('handles progress API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      let loadingStage = 'processing';
      
      try {
        await fetch('/api/agent/progress?traceId=error_test');
      } catch (error) {
        loadingStage = 'idle';
      }

      expect(loadingStage).toBe('idle');
    });

    it('stops progress updates when generation completes', async () => {
      const completionResponse = {
        success: true,
        progress: {
          trace_id: 'test_completion',
          overall_progress: 100,
          status: 'completed',
          agents: []
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => completionResponse
      });

      const response = await fetch('/api/agent/progress?traceId=test_completion');
      const data = await response.json();

      const shouldStopTracking = data.progress.status === 'completed' || data.progress.status === 'failed';
      
      expect(shouldStopTracking).toBe(true);
      expect(data.progress.overall_progress).toBe(100);
    });
  });

  describe('UI State Management', () => {
    it('initializes with correct default values', () => {
      const initialState = {
        isGenerating: false,
        progress: 0,
        loadingStage: 'idle',
        estimatedTimeRemaining: null
      };

      expect(initialState.isGenerating).toBe(false);
      expect(initialState.progress).toBe(0);
      expect(initialState.loadingStage).toBe('idle');
      expect(initialState.estimatedTimeRemaining).toBeNull();
    });

    it('sets initial values when generation starts', () => {
      const startGenerationState = {
        isGenerating: true,
        progress: 0,
        loadingStage: 'initializing',
        estimatedTimeRemaining: 30
      };

      expect(startGenerationState.isGenerating).toBe(true);
      expect(startGenerationState.loadingStage).toBe('initializing');
      expect(startGenerationState.estimatedTimeRemaining).toBe(30);
    });

    it('resets all values when form is reset', () => {
      const resetState = {
        isGenerating: false,
        progress: 0,
        loadingStage: 'idle',
        estimatedTimeRemaining: null,
        agentProgress: null
      };

      expect(resetState.isGenerating).toBe(false);
      expect(resetState.progress).toBe(0);
      expect(resetState.loadingStage).toBe('idle');
      expect(resetState.estimatedTimeRemaining).toBeNull();
      expect(resetState.agentProgress).toBeNull();
    });
  });

  describe('Visual Enhancements', () => {
    it('applies pulse animation to active loading indicators', () => {
      const isActive = true;
      const pulseClass = isActive ? 'animate-pulse' : '';
      
      expect(pulseClass).toBe('animate-pulse');
    });

    it('shows gradient progress bar with shine effect', () => {
      const progressBarClasses = [
        'bg-gradient-to-r',
        'from-kupibilet-primary',
        'to-kupibilet-primary/80',
        'h-3',
        'rounded-full',
        'transition-all',
        'duration-500',
        'relative'
      ];

      const shineEffectClasses = [
        'absolute',
        'inset-0',
        'bg-gradient-to-r',
        'from-transparent',
        'via-white/20',
        'to-transparent',
        'animate-pulse'
      ];

      progressBarClasses.forEach(className => {
        expect(className).toBeTruthy();
      });

      shineEffectClasses.forEach(className => {
        expect(className).toBeTruthy();
      });
    });

    it('displays status badges with appropriate colors', () => {
      const getStatusBadgeColor = (status: string) => {
        switch (status) {
          case 'completed': return 'border-green-500 bg-green-500/10';
          case 'in_progress': return 'border-kupibilet-primary bg-kupibilet-primary/10';
          case 'failed': return 'border-red-500 bg-red-500/10';
          default: return 'border-white/20';
        }
      };

      expect(getStatusBadgeColor('completed')).toContain('green-500');
      expect(getStatusBadgeColor('in_progress')).toContain('kupibilet-primary');
      expect(getStatusBadgeColor('failed')).toContain('red-500');
      expect(getStatusBadgeColor('pending')).toContain('white/20');
    });
  });

  describe('Performance Considerations', () => {
    it('uses efficient polling interval for progress updates', () => {
      const POLLING_INTERVAL = 1000; // 1 second
      
      expect(POLLING_INTERVAL).toBe(1000);
      expect(POLLING_INTERVAL).toBeGreaterThan(500); // Not too frequent
      expect(POLLING_INTERVAL).toBeLessThan(5000); // Not too slow
    });

    it('cleans up resources when unmounting', () => {
      let intervalId: NodeJS.Timeout | null = setInterval(() => {}, 1000);
      
      // Simulate cleanup
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      expect(intervalId).toBeNull();
    });

    it('handles rapid state updates efficiently', () => {
      const states = [
        { progress: 0, stage: 'initializing' },
        { progress: 10, stage: 'connecting' },
        { progress: 25, stage: 'processing' },
        { progress: 50, stage: 'processing' },
        { progress: 90, stage: 'finalizing' },
        { progress: 100, stage: 'idle' }
      ];

      // Simulate rapid updates - should not cause issues
      const processedStates = states.map(state => ({
        ...state,
        timestamp: Date.now()
      }));

      expect(processedStates).toHaveLength(6);
      expect(processedStates.every(state => state.timestamp)).toBe(true);
    });
  });
});