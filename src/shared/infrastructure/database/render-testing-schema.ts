import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, decimal, index, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Database Schema for Render Testing Domain
 * 
 * This schema supports the render testing bounded context with tables for
 * render jobs, email clients, screenshots, test results, and job queue.
 */

// Render Jobs table
export const renderJobs = pgTable('render_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  templateId: uuid('template_id'),
  subject: varchar('subject', { length: 255 }),
  preheader: varchar('preheader', { length: 255 }),
  htmlContent: text('html_content').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  priority: integer('priority').notNull().default(2),
  progress: integer('progress').notNull().default(0),
  config: jsonb('config').notNull(),
  estimatedDuration: integer('estimated_duration'), // seconds
  actualDuration: integer('actual_duration'), // seconds
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(3),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  queuedAt: timestamp('queued_at'),
  cancelledAt: timestamp('cancelled_at')
}, (table) => ({
  userIdIdx: index('render_jobs_user_id_idx').on(table.userId),
  statusIdx: index('render_jobs_status_idx').on(table.status),
  priorityIdx: index('render_jobs_priority_idx').on(table.priority),
  createdAtIdx: index('render_jobs_created_at_idx').on(table.createdAt),
  queuedAtIdx: index('render_jobs_queued_at_idx').on(table.queuedAt)
}));

// Email Clients table
export const emailClients = pgTable('email_clients', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 150 }).notNull(),
  vendor: varchar('vendor', { length: 100 }).notNull(),
  version: varchar('version', { length: 50 }),
  type: varchar('type', { length: 20 }).notNull(), // web, desktop, mobile
  platform: varchar('platform', { length: 50 }).notNull(),
  renderingEngine: varchar('rendering_engine', { length: 50 }).notNull(),
  marketShare: decimal('market_share', { precision: 5, scale: 2 }),
  capabilities: jsonb('capabilities').notNull(),
  testConfig: jsonb('test_config').notNull(),
  automationConfig: jsonb('automation_config').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  tags: jsonb('tags').notNull().default('[]'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  typeIdx: index('email_clients_type_idx').on(table.type),
  platformIdx: index('email_clients_platform_idx').on(table.platform),
  vendorIdx: index('email_clients_vendor_idx').on(table.vendor),
  activeIdx: index('email_clients_active_idx').on(table.isActive),
  marketShareIdx: index('email_clients_market_share_idx').on(table.marketShare)
}));

// Test Results table
export const testResults = pgTable('test_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  overallStatus: varchar('overall_status', { length: 50 }).notNull().default('pending'),
  overallScore: integer('overall_score').notNull().default(0),
  totalClients: integer('total_clients').notNull(),
  passedClients: integer('passed_clients').notNull().default(0),
  failedClients: integer('failed_clients').notNull().default(0),
  summary: jsonb('summary').notNull(),
  clientResults: jsonb('client_results').notNull().default('[]'),
  accessibilityResult: jsonb('accessibility_result'),
  performanceResult: jsonb('performance_result'),
  spamResult: jsonb('spam_result'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at')
}, (table) => ({
  jobIdIdx: index('test_results_job_id_idx').on(table.jobId),
  userIdIdx: index('test_results_user_id_idx').on(table.userId),
  statusIdx: index('test_results_status_idx').on(table.overallStatus),
  scoreIdx: index('test_results_score_idx').on(table.overallScore),
  completedAtIdx: index('test_results_completed_at_idx').on(table.completedAt),
  jobIdFk: foreignKey({
    columns: [table.jobId],
    foreignColumns: [renderJobs.id],
    name: 'test_results_job_id_fk'
  })
}));

// Screenshots table
export const screenshots = pgTable('screenshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull(),
  clientId: varchar('client_id', { length: 100 }).notNull(),
  clientName: varchar('client_name', { length: 150 }).notNull(),
  viewport: jsonb('viewport').notNull(),
  darkMode: boolean('dark_mode').notNull().default(false),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  imageMetadata: jsonb('image_metadata'),
  storageInfo: jsonb('storage_info'),
  captureConfig: jsonb('capture_config').notNull(),
  comparisonResults: jsonb('comparison_results').notNull().default('[]'),
  processingTime: integer('processing_time'), // milliseconds
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(3),
  capturedAt: timestamp('captured_at'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  jobIdIdx: index('screenshots_job_id_idx').on(table.jobId),
  clientIdIdx: index('screenshots_client_id_idx').on(table.clientId),
  statusIdx: index('screenshots_status_idx').on(table.status),
  darkModeIdx: index('screenshots_dark_mode_idx').on(table.darkMode),
  capturedAtIdx: index('screenshots_captured_at_idx').on(table.capturedAt),
  jobIdFk: foreignKey({
    columns: [table.jobId],
    foreignColumns: [renderJobs.id],
    name: 'screenshots_job_id_fk'
  }),
  clientIdFk: foreignKey({
    columns: [table.clientId],
    foreignColumns: [emailClients.id],
    name: 'screenshots_client_id_fk'
  })
}));

// Job Queue table (for queue management)
export const jobQueue = pgTable('job_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().unique(),
  priority: integer('priority').notNull(),
  queuedAt: timestamp('queued_at').notNull().defaultNow(),
  assignedWorker: varchar('assigned_worker', { length: 255 }),
  assignedAt: timestamp('assigned_at'),
  estimatedStartTime: timestamp('estimated_start_time'),
  position: integer('position'), // calculated position in queue
  metadata: jsonb('metadata').notNull().default('{}')
}, (table) => ({
  priorityQueuedAtIdx: index('job_queue_priority_queued_at_idx').on(table.priority, table.queuedAt),
  assignedWorkerIdx: index('job_queue_assigned_worker_idx').on(table.assignedWorker),
  positionIdx: index('job_queue_position_idx').on(table.position),
  jobIdFk: foreignKey({
    columns: [table.jobId],
    foreignColumns: [renderJobs.id],
    name: 'job_queue_job_id_fk'
  })
}));

// Worker Nodes table (for tracking worker instances)
export const workerNodes = pgTable('worker_nodes', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // docker, vm, browser
  status: varchar('status', { length: 50 }).notNull().default('idle'), // idle, busy, offline, error
  capabilities: jsonb('capabilities').notNull(),
  currentJobId: uuid('current_job_id'),
  maxConcurrentJobs: integer('max_concurrent_jobs').notNull().default(1),
  currentJobCount: integer('current_job_count').notNull().default(0),
  totalJobsProcessed: integer('total_jobs_processed').notNull().default(0),
  averageJobDuration: integer('average_job_duration').notNull().default(0),
  lastHeartbeat: timestamp('last_heartbeat').notNull().defaultNow(),
  configuration: jsonb('configuration').notNull(),
  metadata: jsonb('metadata').notNull().default('{}'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  statusIdx: index('worker_nodes_status_idx').on(table.status),
  typeIdx: index('worker_nodes_type_idx').on(table.type),
  heartbeatIdx: index('worker_nodes_heartbeat_idx').on(table.lastHeartbeat),
  currentJobIdx: index('worker_nodes_current_job_idx').on(table.currentJobId)
}));

// Client Usage Statistics table
export const clientUsageStats = pgTable('client_usage_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: varchar('client_id', { length: 100 }).notNull(),
  date: timestamp('date').notNull(),
  usageCount: integer('usage_count').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  failureCount: integer('failure_count').notNull().default(0),
  averageRenderTime: integer('average_render_time').notNull().default(0),
  totalRenderTime: integer('total_render_time').notNull().default(0),
  screenshotCount: integer('screenshot_count').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),
  metadata: jsonb('metadata').notNull().default('{}')
}, (table) => ({
  clientDateIdx: index('client_usage_stats_client_date_idx').on(table.clientId, table.date),
  dateIdx: index('client_usage_stats_date_idx').on(table.date),
  clientIdFk: foreignKey({
    columns: [table.clientId],
    foreignColumns: [emailClients.id],
    name: 'client_usage_stats_client_id_fk'
  })
}));

// System Metrics table
export const systemMetrics = pgTable('system_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  metricType: varchar('metric_type', { length: 100 }).notNull(),
  metricName: varchar('metric_name', { length: 150 }).notNull(),
  value: decimal('value', { precision: 15, scale: 6 }).notNull(),
  unit: varchar('unit', { length: 50 }),
  tags: jsonb('tags').notNull().default('{}'),
  metadata: jsonb('metadata').notNull().default('{}')
}, (table) => ({
  timestampIdx: index('system_metrics_timestamp_idx').on(table.timestamp),
  typeNameIdx: index('system_metrics_type_name_idx').on(table.metricType, table.metricName),
  tagsIdx: index('system_metrics_tags_idx').using('gin', table.tags)
}));

// Define relationships
export const renderJobsRelations = relations(renderJobs, ({ one, many }) => ({
  testResult: one(testResults, {
    fields: [renderJobs.id],
    references: [testResults.jobId]
  }),
  screenshots: many(screenshots),
  queueEntry: one(jobQueue, {
    fields: [renderJobs.id],
    references: [jobQueue.jobId]
  })
}));

export const testResultsRelations = relations(testResults, ({ one }) => ({
  job: one(renderJobs, {
    fields: [testResults.jobId],
    references: [renderJobs.id]
  })
}));

export const screenshotsRelations = relations(screenshots, ({ one }) => ({
  job: one(renderJobs, {
    fields: [screenshots.jobId],
    references: [renderJobs.id]
  }),
  client: one(emailClients, {
    fields: [screenshots.clientId],
    references: [emailClients.id]
  })
}));

export const emailClientsRelations = relations(emailClients, ({ many }) => ({
  screenshots: many(screenshots),
  usageStats: many(clientUsageStats)
}));

export const jobQueueRelations = relations(jobQueue, ({ one }) => ({
  job: one(renderJobs, {
    fields: [jobQueue.jobId],
    references: [renderJobs.id]
  })
}));

export const workerNodesRelations = relations(workerNodes, ({ one }) => ({
  currentJob: one(renderJobs, {
    fields: [workerNodes.currentJobId],
    references: [renderJobs.id]
  })
}));

export const clientUsageStatsRelations = relations(clientUsageStats, ({ one }) => ({
  client: one(emailClients, {
    fields: [clientUsageStats.clientId],
    references: [emailClients.id]
  })
}));

// Type exports for use in repositories
export type RenderJob = typeof renderJobs.$inferSelect;
export type NewRenderJob = typeof renderJobs.$inferInsert;

export type EmailClient = typeof emailClients.$inferSelect;
export type NewEmailClient = typeof emailClients.$inferInsert;

export type TestResult = typeof testResults.$inferSelect;
export type NewTestResult = typeof testResults.$inferInsert;

export type Screenshot = typeof screenshots.$inferSelect;
export type NewScreenshot = typeof screenshots.$inferInsert;

export type JobQueueEntry = typeof jobQueue.$inferSelect;
export type NewJobQueueEntry = typeof jobQueue.$inferInsert;

export type WorkerNode = typeof workerNodes.$inferSelect;
export type NewWorkerNode = typeof workerNodes.$inferInsert;

export type ClientUsageStat = typeof clientUsageStats.$inferSelect;
export type NewClientUsageStat = typeof clientUsageStats.$inferInsert;

export type SystemMetric = typeof systemMetrics.$inferSelect;
export type NewSystemMetric = typeof systemMetrics.$inferInsert;

// Migration helper for creating indexes
export const createIndexes = `
-- Additional performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS render_jobs_user_status_idx ON render_jobs(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS render_jobs_priority_queued_idx ON render_jobs(priority DESC, queued_at ASC) WHERE status = 'queued';
CREATE INDEX CONCURRENTLY IF NOT EXISTS screenshots_job_client_idx ON screenshots(job_id, client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS test_results_user_score_idx ON test_results(user_id, overall_score DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_queue_priority_position_idx ON job_queue(priority DESC, position ASC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS worker_nodes_status_type_idx ON worker_nodes(status, type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS system_metrics_time_bucket_idx ON system_metrics(date_trunc('hour', timestamp), metric_type);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS render_jobs_active_idx ON render_jobs(created_at DESC) WHERE status IN ('pending', 'queued', 'processing');
CREATE INDEX CONCURRENTLY IF NOT EXISTS screenshots_pending_idx ON screenshots(created_at) WHERE status IN ('pending', 'capturing', 'processing');
CREATE INDEX CONCURRENTLY IF NOT EXISTS worker_nodes_available_idx ON worker_nodes(last_heartbeat DESC) WHERE status = 'idle';

-- Full-text search indexes for error messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS render_jobs_error_search_idx ON render_jobs USING gin(to_tsvector('english', error_message)) WHERE error_message IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS screenshots_error_search_idx ON screenshots USING gin(to_tsvector('english', error_message)) WHERE error_message IS NOT NULL;
`;

// Views for common queries
export const createViews = `
-- View for job statistics
CREATE OR REPLACE VIEW job_statistics AS
SELECT 
  DATE(created_at) as date,
  status,
  COUNT(*) as job_count,
  AVG(actual_duration) as avg_duration,
  AVG(progress) as avg_progress,
  COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as error_count
FROM render_jobs 
GROUP BY DATE(created_at), status;

-- View for client performance
CREATE OR REPLACE VIEW client_performance AS
SELECT 
  ec.id,
  ec.display_name,
  ec.type,
  ec.platform,
  COUNT(s.id) as total_screenshots,
  COUNT(CASE WHEN s.status = 'ready' THEN 1 END) as successful_screenshots,
  COUNT(CASE WHEN s.status = 'failed' THEN 1 END) as failed_screenshots,
  AVG(s.processing_time) as avg_processing_time,
  ROUND(COUNT(CASE WHEN s.status = 'ready' THEN 1 END) * 100.0 / COUNT(s.id), 2) as success_rate
FROM email_clients ec
LEFT JOIN screenshots s ON ec.id = s.client_id
WHERE ec.is_active = true
GROUP BY ec.id, ec.display_name, ec.type, ec.platform;

-- View for queue status
CREATE OR REPLACE VIEW queue_status AS
SELECT 
  COUNT(*) as total_queued,
  AVG(EXTRACT(EPOCH FROM (NOW() - queued_at))) as avg_wait_time,
  MIN(queued_at) as oldest_job,
  MAX(priority) as highest_priority,
  COUNT(CASE WHEN assigned_worker IS NOT NULL THEN 1 END) as assigned_jobs
FROM job_queue;

-- View for system health
CREATE OR REPLACE VIEW system_health AS
SELECT 
  COUNT(CASE WHEN status = 'idle' THEN 1 END) as idle_workers,
  COUNT(CASE WHEN status = 'busy' THEN 1 END) as busy_workers,
  COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline_workers,
  COUNT(CASE WHEN last_heartbeat > NOW() - INTERVAL '5 minutes' THEN 1 END) as healthy_workers,
  SUM(current_job_count) as total_active_jobs,
  SUM(max_concurrent_jobs) as total_capacity,
  ROUND(SUM(current_job_count) * 100.0 / SUM(max_concurrent_jobs), 2) as capacity_utilization
FROM worker_nodes;
`; 