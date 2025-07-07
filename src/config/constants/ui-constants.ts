/**
 * 🎨 UI CONSTANTS
 * 
 * Централизованные константы для UI компонентов
 * Включает цвета бренда, типографику, анимации и кампании
 */

export const UI_CONSTANTS = {
  // Цвета бренда (из оригинального constants.ts)
  BRAND_COLORS: {
    PRIMARY: '#4BFF7E',
    SECONDARY: '#1DA857', 
    TERTIARY: '#2C3959',
    
    // Дополнительные цвета
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    GRAY_50: '#F9FAFB',
    GRAY_100: '#F3F4F6',
    GRAY_200: '#E5E7EB',
    GRAY_300: '#D1D5DB',
    GRAY_400: '#9CA3AF',
    GRAY_500: '#6B7280',
    GRAY_600: '#4B5563',
    GRAY_700: '#374151',
    GRAY_800: '#1F2937',
    GRAY_900: '#111827',
    
    // Статусные цвета
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#3B82F6'
  } as const,
  
  // Типы кампаний (из оригинального constants.ts)
  CAMPAIGN_TYPES: [
    'promotional',
    'informational', 
    'seasonal',
    'urgent',
    'newsletter'
  ] as const,
  
  // Пороги качества
  QUALITY_THRESHOLDS: {
    SCORE_THRESHOLD: 85,
    MIN_ACCEPTABLE: 70,
    EXCELLENT: 95
  } as const,
  
  // Типографика
  TYPOGRAPHY: {
    FONT_FAMILY: {
      SANS: 'Inter, system-ui, sans-serif',
      MONO: 'JetBrains Mono, Consolas, monospace',
      SERIF: 'Crimson Text, serif'
    },
    FONT_SIZE: {
      XS: '0.75rem',   // 12px
      SM: '0.875rem',  // 14px  
      BASE: '1rem',    // 16px
      LG: '1.125rem',  // 18px
      XL: '1.25rem',   // 20px
      '2XL': '1.5rem', // 24px
      '3XL': '1.875rem', // 30px
      '4XL': '2.25rem'   // 36px
    },
    FONT_WEIGHT: {
      LIGHT: '300',
      NORMAL: '400', 
      MEDIUM: '500',
      SEMIBOLD: '600',
      BOLD: '700'
    }
  } as const,
  
  // Spacing система (Tailwind-compatible)
  SPACING: {
    0: '0px',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
    32: '8rem'     // 128px
  } as const,
  
  // Анимации и переходы
  ANIMATIONS: {
    DURATION: {
      FAST: '150ms',
      NORMAL: '300ms',
      SLOW: '500ms'
    },
    EASING: {
      EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
      EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
      EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  } as const,
  
  // Breakpoints для responsive design
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px', 
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px'
  } as const,
  
  // Z-index слои
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080
  } as const,
  
  // Размеры компонентов
  COMPONENT_SIZES: {
    BUTTON: {
      SM: { height: '2rem', padding: '0.5rem 1rem' },
      MD: { height: '2.5rem', padding: '0.75rem 1.5rem' },
      LG: { height: '3rem', padding: '1rem 2rem' }
    },
    INPUT: {
      SM: { height: '2rem', padding: '0.25rem 0.75rem' },
      MD: { height: '2.5rem', padding: '0.5rem 1rem' },
      LG: { height: '3rem', padding: '0.75rem 1.25rem' }
    }
  } as const,
  
  // Регексы для валидации UI
  VALIDATION_REGEX: {
    BRAND_COLOR: /(#4BFF7E|#1DA857|#2C3959)/i,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  } as const
} as const;

export type CampaignType = typeof UI_CONSTANTS.CAMPAIGN_TYPES[number];
export type BrandColor = typeof UI_CONSTANTS.BRAND_COLORS[keyof typeof UI_CONSTANTS.BRAND_COLORS];