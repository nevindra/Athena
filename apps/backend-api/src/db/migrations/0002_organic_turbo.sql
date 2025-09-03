CREATE TABLE IF NOT EXISTS "system_prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"json_schema" json,
	"json_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "system_prompts" ADD CONSTRAINT "system_prompts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_prompts_user_id_idx" ON "system_prompts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_prompts_category_idx" ON "system_prompts" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_prompts_title_idx" ON "system_prompts" USING btree ("title");