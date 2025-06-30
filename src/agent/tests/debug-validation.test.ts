/**
 * 🐛 DEBUG TEST - Отладка проблем валидации
 */

import { describe, test, expect } from 'vitest';
import { ContentToDesignHandoffDataSchema } from '../types/base-agent-types';

describe('🐛 Debug Validation Issues', () => {
  test('Debug ContentToDesignHandoffDataSchema', () => {
    const validData = {
      content_package: {
        complete_content: {
          subject: 'Test Subject',
          preheader: 'Test Preheader',
          body: 'Test Body Content with sufficient length for validation purposes',
          cta: 'Test CTA'
        },
        content_metadata: {
          language: 'ru',
          tone: 'friendly',
          word_count: 4,
          reading_time: 1
        },
        brand_guidelines: {
          voice_tone: 'professional',
          key_messages: ['test'],
          compliance_notes: []
        }
      },
      design_requirements: {
        template_type: 'promotional',
        visual_priority: 'balanced',
        layout_preferences: ['responsive'],
        color_scheme: 'warm_inviting'
      },
      campaign_context: {
        topic: 'test',
        target_audience: 'general',
        urgency_level: 'medium'
      },
      trace_id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    console.log('Testing data:', JSON.stringify(validData, null, 2));

    const result = ContentToDesignHandoffDataSchema.safeParse(validData);
    
    if (!result.success) {
      console.log('Validation errors:', result.error.issues);
      result.error.issues.forEach(issue => {
        console.log(`Path: ${issue.path.join('.')}, Message: ${issue.message}, Code: ${issue.code}`);
      });
    }

    expect(result.success).toBe(true);
  });
});