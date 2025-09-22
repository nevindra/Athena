CREATE TABLE IF NOT EXISTS "api_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"registration_id" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"method" text NOT NULL,
	"endpoint" text NOT NULL,
	"status_code" integer NOT NULL,
	"response_time_ms" integer NOT NULL,
	"request_size_bytes" integer,
	"response_size_bytes" integer,
	"error_message" text,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_metrics" ADD CONSTRAINT "api_metrics_registration_id_api_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."api_registrations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_metrics_registration_id_idx" ON "api_metrics" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_metrics_timestamp_idx" ON "api_metrics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_metrics_registration_timestamp_idx" ON "api_metrics" USING btree ("registration_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_metrics_status_code_idx" ON "api_metrics" USING btree ("status_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_metrics_registration_status_idx" ON "api_metrics" USING btree ("registration_id","status_code");