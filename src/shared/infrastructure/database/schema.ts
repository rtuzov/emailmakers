import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  first_name: varchar('first_name', { length: 100 }),
  last_name: varchar('last_name', { length: 100 }),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  email_verified: boolean('email_verified').default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// API Keys table
export const api_keys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  service: varchar('service', { length: 50 }).notNull(), // 'openai', 'figma', 'litmus'
  encrypted_key: text('encrypted_key').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Email Templates table
export const email_templates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  brief_text: text('brief_text').notNull(),
  generated_content: jsonb('generated_content'),
  mjml_code: text('mjml_code'),
  html_output: text('html_output'),
  design_tokens: jsonb('design_tokens'),
  status: varchar('status', { length: 50 }).default('draft'),
  quality_score: integer('quality_score'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Brands table
export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  figma_url: varchar('figma_url', { length: 500 }),
  design_tokens: jsonb('design_tokens'),
  brand_guidelines: jsonb('brand_guidelines'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Content Briefs table
export const content_briefs = pgTable('content_briefs', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  template_id: uuid('template_id').references(() => email_templates.id),
  brief_type: varchar('brief_type', { length: 50 }).notNull(), // 'text', 'json', 'figma'
  brief_content: text('brief_content').notNull(),
  tone: varchar('tone', { length: 50 }),
  target_audience: varchar('target_audience', { length: 255 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Quality Test Results table
export const quality_test_results = pgTable('quality_test_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  template_id: uuid('template_id').references(() => email_templates.id).notNull(),
  test_type: varchar('test_type', { length: 50 }).notNull(), // 'litmus', 'accessibility', 'performance'
  test_results: jsonb('test_results').notNull(),
  overall_score: integer('overall_score'),
  passed: boolean('passed').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type ApiKey = typeof api_keys.$inferSelect;
export type NewApiKey = typeof api_keys.$inferInsert;
export type EmailTemplate = typeof email_templates.$inferSelect;
export type NewEmailTemplate = typeof email_templates.$inferInsert;
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
export type ContentBrief = typeof content_briefs.$inferSelect;
export type NewContentBrief = typeof content_briefs.$inferInsert;
export type QualityTestResult = typeof quality_test_results.$inferSelect;
export type NewQualityTestResult = typeof quality_test_results.$inferInsert; 