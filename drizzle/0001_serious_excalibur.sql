CREATE TABLE "client_usage_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar(100) NOT NULL,
	"date" timestamp NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"average_render_time" integer DEFAULT 0 NOT NULL,
	"total_render_time" integer DEFAULT 0 NOT NULL,
	"screenshot_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_clients" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(150) NOT NULL,
	"vendor" varchar(100) NOT NULL,
	"version" varchar(50),
	"type" varchar(20) NOT NULL,
	"platform" varchar(50) NOT NULL,
	"rendering_engine" varchar(50) NOT NULL,
	"market_share" numeric(5, 2),
	"capabilities" jsonb NOT NULL,
	"test_config" jsonb NOT NULL,
	"automation_config" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"priority" integer NOT NULL,
	"queued_at" timestamp DEFAULT now() NOT NULL,
	"assigned_worker" varchar(255),
	"assigned_at" timestamp,
	"estimated_start_time" timestamp,
	"position" integer,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	CONSTRAINT "job_queue_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "render_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"template_id" uuid,
	"subject" varchar(255),
	"preheader" varchar(255),
	"html_content" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 2 NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"config" jsonb NOT NULL,
	"estimated_duration" integer,
	"actual_duration" integer,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"queued_at" timestamp,
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "screenshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"client_id" varchar(100) NOT NULL,
	"client_name" varchar(150) NOT NULL,
	"viewport" jsonb NOT NULL,
	"dark_mode" boolean DEFAULT false NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"image_metadata" jsonb,
	"storage_info" jsonb,
	"capture_config" jsonb NOT NULL,
	"comparison_results" jsonb DEFAULT '[]' NOT NULL,
	"processing_time" integer,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"captured_at" timestamp,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metric_type" varchar(100) NOT NULL,
	"metric_name" varchar(150) NOT NULL,
	"value" numeric(15, 6) NOT NULL,
	"unit" varchar(50),
	"tags" jsonb DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"overall_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"overall_score" integer DEFAULT 0 NOT NULL,
	"total_clients" integer NOT NULL,
	"passed_clients" integer DEFAULT 0 NOT NULL,
	"failed_clients" integer DEFAULT 0 NOT NULL,
	"summary" jsonb NOT NULL,
	"client_results" jsonb DEFAULT '[]' NOT NULL,
	"accessibility_result" jsonb,
	"performance_result" jsonb,
	"spam_result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "worker_nodes" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'idle' NOT NULL,
	"capabilities" jsonb NOT NULL,
	"current_job_id" uuid,
	"max_concurrent_jobs" integer DEFAULT 1 NOT NULL,
	"current_job_count" integer DEFAULT 0 NOT NULL,
	"total_jobs_processed" integer DEFAULT 0 NOT NULL,
	"average_job_duration" integer DEFAULT 0 NOT NULL,
	"last_heartbeat" timestamp DEFAULT now() NOT NULL,
	"configuration" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_usage_stats" ADD CONSTRAINT "client_usage_stats_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."email_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_queue" ADD CONSTRAINT "job_queue_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."render_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."render_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."email_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."render_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_usage_stats_client_date_idx" ON "client_usage_stats" USING btree ("client_id","date");--> statement-breakpoint
CREATE INDEX "client_usage_stats_date_idx" ON "client_usage_stats" USING btree ("date");--> statement-breakpoint
CREATE INDEX "email_clients_type_idx" ON "email_clients" USING btree ("type");--> statement-breakpoint
CREATE INDEX "email_clients_platform_idx" ON "email_clients" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "email_clients_vendor_idx" ON "email_clients" USING btree ("vendor");--> statement-breakpoint
CREATE INDEX "email_clients_active_idx" ON "email_clients" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "email_clients_market_share_idx" ON "email_clients" USING btree ("market_share");--> statement-breakpoint
CREATE INDEX "job_queue_priority_queued_at_idx" ON "job_queue" USING btree ("priority","queued_at");--> statement-breakpoint
CREATE INDEX "job_queue_assigned_worker_idx" ON "job_queue" USING btree ("assigned_worker");--> statement-breakpoint
CREATE INDEX "job_queue_position_idx" ON "job_queue" USING btree ("position");--> statement-breakpoint
CREATE INDEX "render_jobs_user_id_idx" ON "render_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "render_jobs_status_idx" ON "render_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "render_jobs_priority_idx" ON "render_jobs" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "render_jobs_created_at_idx" ON "render_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "render_jobs_queued_at_idx" ON "render_jobs" USING btree ("queued_at");--> statement-breakpoint
CREATE INDEX "screenshots_job_id_idx" ON "screenshots" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "screenshots_client_id_idx" ON "screenshots" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "screenshots_status_idx" ON "screenshots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "screenshots_dark_mode_idx" ON "screenshots" USING btree ("dark_mode");--> statement-breakpoint
CREATE INDEX "screenshots_captured_at_idx" ON "screenshots" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "system_metrics_timestamp_idx" ON "system_metrics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "system_metrics_type_name_idx" ON "system_metrics" USING btree ("metric_type","metric_name");--> statement-breakpoint
CREATE INDEX "system_metrics_tags_idx" ON "system_metrics" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "test_results_job_id_idx" ON "test_results" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "test_results_user_id_idx" ON "test_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "test_results_status_idx" ON "test_results" USING btree ("overall_status");--> statement-breakpoint
CREATE INDEX "test_results_score_idx" ON "test_results" USING btree ("overall_score");--> statement-breakpoint
CREATE INDEX "test_results_completed_at_idx" ON "test_results" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "worker_nodes_status_idx" ON "worker_nodes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "worker_nodes_type_idx" ON "worker_nodes" USING btree ("type");--> statement-breakpoint
CREATE INDEX "worker_nodes_heartbeat_idx" ON "worker_nodes" USING btree ("last_heartbeat");--> statement-breakpoint
CREATE INDEX "worker_nodes_current_job_idx" ON "worker_nodes" USING btree ("current_job_id");