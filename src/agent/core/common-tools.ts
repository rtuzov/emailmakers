/**
 * 📅 COMMON TOOLS - Shared utilities for all specialists
 * 
 * Common tools that are used across multiple specialists to avoid duplication
 * and ensure consistency in the workflow.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';

// ============================================================================
// DATE AND TIME TOOLS
// ============================================================================

/**
 * Get current date and time in various formats
 * Replaces the hardcoded getCurrentDate function in prompts
 */
export const getCurrentDate = tool({
  name: 'getCurrentDate',
  description: 'Get current date and time in various formats for campaign planning and scheduling',
  parameters: z.object({
    timezone: z.string().default('Europe/Moscow').describe('Timezone for date formatting (default: Moscow time)'),
    locale: z.string().default('ru-RU').describe('Locale for date formatting (default: Russian)')
  }),
  execute: async ({ timezone, locale }) => {
    const now = new Date();
    
    // Get date in specified timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    
    const formatter = new Intl.DateTimeFormat(locale, options);
    const parts = formatter.formatToParts(now);
    
    // Extract parts
    const dateComponents: any = {};
    parts.forEach(part => {
      if (part.type !== 'literal') {
        dateComponents[part.type] = part.value;
      }
    });
    
    // Calculate future dates for campaign planning
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const in60Days = new Date(now);
    in60Days.setDate(in60Days.getDate() + 60);
    
    return JSON.stringify({
      current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
      current_datetime: now.toISOString(),
      current_year: now.getFullYear(),
      current_month: now.getMonth() + 1,
      current_day: now.getDate(),
      formatted_date: now.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone
      }),
      weekday: now.toLocaleDateString(locale, { 
        weekday: 'long',
        timeZone: timezone 
      }),
      timezone: timezone,
      locale: locale,
      // Useful for campaign planning
      tomorrow: tomorrow.toISOString().split('T')[0],
      next_week: nextWeek.toISOString().split('T')[0],
      next_month: nextMonth.toISOString().split('T')[0],
      in_60_days: in60Days.toISOString().split('T')[0],
      // Season detection for Russian market
      season: getSeason(now.getMonth() + 1),
      // Timestamp for logging
      timestamp: now.getTime()
    }, null, 2);
  }
});

/**
 * Helper function to determine season for Russian market
 */
function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return 'весна';
  if (month >= 6 && month <= 8) return 'лето';
  if (month >= 9 && month <= 11) return 'осень';
  return 'зима';
}

/**
 * Validate that a date is in the future
 * Useful for campaign date validation
 */
export const validateFutureDate = tool({
  name: 'validateFutureDate',
  description: 'Validate that a given date is in the future (useful for campaign planning)',
  parameters: z.object({
    date: z.string().describe('Date to validate in YYYY-MM-DD format'),
    minimum_days_ahead: z.number().default(1).describe('Minimum days the date should be in the future')
  }),
  execute: async ({ date, minimum_days_ahead }) => {
    try {
      const inputDate = new Date(date);
      const now = new Date();
      
      // Reset time to midnight for date comparison
      inputDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      
      const minimumDate = new Date(now);
      minimumDate.setDate(minimumDate.getDate() + minimum_days_ahead);
      
      const isValid = inputDate >= minimumDate;
      const daysAhead = Math.floor((inputDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return JSON.stringify({
        is_valid: isValid,
        input_date: date,
        current_date: now.toISOString().split('T')[0],
        minimum_required_date: minimumDate.toISOString().split('T')[0],
        days_ahead: daysAhead,
        message: isValid 
          ? `Date is valid: ${daysAhead} days in the future`
          : `Date must be at least ${minimum_days_ahead} days in the future`
      }, null, 2);
    } catch (error) {
      return JSON.stringify({
        is_valid: false,
        error: 'Invalid date format. Please use YYYY-MM-DD format.'
      }, null, 2);
    }
  }
});

// ============================================================================
// COMMON TOOL EXPORTS
// ============================================================================

export const commonTools = [
  getCurrentDate,
  validateFutureDate
];

export default commonTools;