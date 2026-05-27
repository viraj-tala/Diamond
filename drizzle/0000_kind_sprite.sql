CREATE TYPE "public"."inquiry_status" AS ENUM('OPEN', 'RESPONDED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."inventory_status" AS ENUM('IN_STOCK', 'RESERVED', 'SOLD', 'LISTED');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('SENT', 'IN_PROGRESS', 'RETURNED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('SAWING', 'BRUTING', 'POLISHING', 'QC');--> statement-breakpoint
CREATE TYPE "public"."price_source" AS ENUM('RAPAPORT', 'IDEX', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."qc_result" AS ENUM('PASS', 'REWORK', 'REJECT');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'OWNER', 'PLANNER', 'SUPERVISOR', 'WORKER', 'DEALER', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."stage" AS ENUM('PLANNING', 'SAWING', 'BRUTING', 'POLISHING', 'QC', 'CERTIFICATION', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "cut_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"rough_stone_id" text NOT NULL,
	"name" text NOT NULL,
	"strategy" text NOT NULL,
	"expected_yield_pct" double precision NOT NULL,
	"est_profit" double precision NOT NULL,
	"est_revenue" double precision NOT NULL,
	"est_cost" double precision NOT NULL,
	"notes" text,
	"is_selected" boolean DEFAULT false NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incentives" (
	"id" text PRIMARY KEY NOT NULL,
	"worker_id" text NOT NULL,
	"month_year" text NOT NULL,
	"amount" double precision NOT NULL,
	"basis" text NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_phone" text,
	"message" text,
	"status" "inquiry_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" text PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"stone_id" text,
	"shape" text NOT NULL,
	"carat_weight" double precision NOT NULL,
	"color" text NOT NULL,
	"clarity" text NOT NULL,
	"cut" text,
	"polish" text,
	"symmetry" text,
	"fluorescence" text,
	"certificate_no" text,
	"cert_body" text,
	"image_url" text,
	"video_url" text,
	"price_per_ct" double precision NOT NULL,
	"total_price" double precision NOT NULL,
	"status" "inventory_status" DEFAULT 'IN_STOCK' NOT NULL,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_sku_unique" UNIQUE("sku"),
	CONSTRAINT "inventory_items_stone_id_unique" UNIQUE("stone_id")
);
--> statement-breakpoint
CREATE TABLE "job_order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"stone_id" text NOT NULL,
	"sent_weight_ct" double precision NOT NULL,
	"return_weight_ct" double precision
);
--> statement-breakpoint
CREATE TABLE "job_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"order_code" text NOT NULL,
	"vendor_id" text NOT NULL,
	"job_type" "job_type" NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_at" timestamp with time zone,
	"returned_at" timestamp with time zone,
	"total_sent_ct" double precision DEFAULT 0 NOT NULL,
	"total_return_ct" double precision DEFAULT 0 NOT NULL,
	"loss_ct" double precision DEFAULT 0 NOT NULL,
	"rate_per_ct" double precision DEFAULT 0 NOT NULL,
	"total_payment" double precision DEFAULT 0 NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"status" "job_status" DEFAULT 'SENT' NOT NULL,
	"notes" text,
	CONSTRAINT "job_orders_order_code_unique" UNIQUE("order_code")
);
--> statement-breakpoint
CREATE TABLE "marketplace_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"list_price" double precision NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_listings_item_id_unique" UNIQUE("item_id")
);
--> statement-breakpoint
CREATE TABLE "polished_outputs" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"weight_ct" double precision NOT NULL,
	"shape" text NOT NULL,
	"color" text NOT NULL,
	"clarity" text NOT NULL,
	"est_price_per_ct" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_points" (
	"id" text PRIMARY KEY NOT NULL,
	"shape" text NOT NULL,
	"carat_bucket" text NOT NULL,
	"color" text NOT NULL,
	"clarity" text NOT NULL,
	"source" "price_source" NOT NULL,
	"price_per_ct" double precision NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"stone_id" text NOT NULL,
	"inspector_id" text NOT NULL,
	"image_url" text,
	"defects_found" text,
	"defect_count" integer DEFAULT 0 NOT NULL,
	"overall_score" double precision NOT NULL,
	"recommendation" "qc_result" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rough_stones" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"weight_ct" double precision NOT NULL,
	"color" text,
	"clarity" text,
	"shape" text,
	"scan_data" jsonb,
	"cost_per_ct" double precision DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rough_stones_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "stage_events" (
	"id" text PRIMARY KEY NOT NULL,
	"stone_id" text NOT NULL,
	"stage" "stage" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"weight_before" double precision NOT NULL,
	"weight_after" double precision,
	"loss_ct" double precision,
	"worker_id" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "stones" (
	"id" text PRIMARY KEY NOT NULL,
	"qr_code" text NOT NULL,
	"rough_stone_id" text,
	"current_stage" "stage" DEFAULT 'PLANNING' NOT NULL,
	"start_weight_ct" double precision NOT NULL,
	"current_weight_ct" double precision NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stones_qr_code_unique" UNIQUE("qr_code"),
	CONSTRAINT "stones_rough_stone_id_unique" UNIQUE("rough_stone_id")
);
--> statement-breakpoint
CREATE TABLE "trace_events" (
	"id" text PRIMARY KEY NOT NULL,
	"stone_id" text NOT NULL,
	"event_type" text NOT NULL,
	"actor" text NOT NULL,
	"location" text,
	"metadata" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"prev_hash" text,
	"hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" "role" DEFAULT 'VIEWER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact" text,
	"phone" text,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "worker_daily_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"worker_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"pieces_completed" integer DEFAULT 0 NOT NULL,
	"recovery_pct" double precision DEFAULT 0 NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"machine_hours" double precision DEFAULT 0 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"employee_code" text NOT NULL,
	"department" text NOT NULL,
	"join_date" timestamp with time zone DEFAULT now() NOT NULL,
	"hourly_rate" double precision DEFAULT 0 NOT NULL,
	CONSTRAINT "workers_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "workers_employee_code_unique" UNIQUE("employee_code")
);
--> statement-breakpoint
ALTER TABLE "cut_plans" ADD CONSTRAINT "cut_plans_rough_stone_id_rough_stones_id_fk" FOREIGN KEY ("rough_stone_id") REFERENCES "public"."rough_stones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cut_plans" ADD CONSTRAINT "cut_plans_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incentives" ADD CONSTRAINT "incentives_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_stone_id_stones_id_fk" FOREIGN KEY ("stone_id") REFERENCES "public"."stones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_order_items" ADD CONSTRAINT "job_order_items_order_id_job_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."job_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_order_items" ADD CONSTRAINT "job_order_items_stone_id_stones_id_fk" FOREIGN KEY ("stone_id") REFERENCES "public"."stones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polished_outputs" ADD CONSTRAINT "polished_outputs_plan_id_cut_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."cut_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_stone_id_stones_id_fk" FOREIGN KEY ("stone_id") REFERENCES "public"."stones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_events" ADD CONSTRAINT "stage_events_stone_id_stones_id_fk" FOREIGN KEY ("stone_id") REFERENCES "public"."stones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_events" ADD CONSTRAINT "stage_events_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stones" ADD CONSTRAINT "stones_rough_stone_id_rough_stones_id_fk" FOREIGN KEY ("rough_stone_id") REFERENCES "public"."rough_stones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trace_events" ADD CONSTRAINT "trace_events_stone_id_stones_id_fk" FOREIGN KEY ("stone_id") REFERENCES "public"."stones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_daily_logs" ADD CONSTRAINT "worker_daily_logs_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "incentives_worker_month_unique" ON "incentives" USING btree ("worker_id","month_year");--> statement-breakpoint
CREATE INDEX "price_points_lookup_idx" ON "price_points" USING btree ("shape","color","clarity","carat_bucket","recorded_at");--> statement-breakpoint
CREATE INDEX "stage_events_stone_idx" ON "stage_events" USING btree ("stone_id");--> statement-breakpoint
CREATE INDEX "stage_events_stone_stage_idx" ON "stage_events" USING btree ("stone_id","stage");--> statement-breakpoint
CREATE INDEX "trace_events_stone_recorded_idx" ON "trace_events" USING btree ("stone_id","recorded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "worker_daily_logs_worker_date_unique" ON "worker_daily_logs" USING btree ("worker_id","date");