CREATE TABLE "devices" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"token_hash" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_events" (
	"id" text PRIMARY KEY NOT NULL,
	"stone_id" text NOT NULL,
	"device_id" text,
	"user_id" text,
	"scan_code" text NOT NULL,
	"from_stage" "stage" NOT NULL,
	"to_stage" "stage" NOT NULL,
	"weight_after" double precision,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scan_events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "stones" ADD COLUMN "rfid_tag" text;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_stone_id_stones_id_fk" FOREIGN KEY ("stone_id") REFERENCES "public"."stones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scan_events_stone_idx" ON "scan_events" USING btree ("stone_id");--> statement-breakpoint
CREATE INDEX "scan_events_device_idx" ON "scan_events" USING btree ("device_id");--> statement-breakpoint
ALTER TABLE "stones" ADD CONSTRAINT "stones_rfid_tag_unique" UNIQUE("rfid_tag");