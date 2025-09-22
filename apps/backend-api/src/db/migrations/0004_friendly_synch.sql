CREATE TABLE IF NOT EXISTS "api_registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	"base_url" text NOT NULL,
	"api_key" text NOT NULL,
	"configuration_id" text NOT NULL,
	"system_prompt_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_registrations" ADD CONSTRAINT "api_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_registrations" ADD CONSTRAINT "api_registrations_configuration_id_ai_configurations_id_fk" FOREIGN KEY ("configuration_id") REFERENCES "public"."ai_configurations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_registrations" ADD CONSTRAINT "api_registrations_system_prompt_id_system_prompts_id_fk" FOREIGN KEY ("system_prompt_id") REFERENCES "public"."system_prompts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_registrations_user_id_idx" ON "api_registrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_registrations_name_idx" ON "api_registrations" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_registrations_configuration_id_idx" ON "api_registrations" USING btree ("configuration_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_registrations_active_idx" ON "api_registrations" USING btree ("is_active");