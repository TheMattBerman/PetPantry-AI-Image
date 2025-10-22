CREATE TABLE "pet_transformations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"pet_name" text NOT NULL,
	"pet_breed" text,
	"theme" text NOT NULL,
	"traits" jsonb DEFAULT '[]'::jsonb,
	"gender" text,
	"original_image_url" text,
	"transformed_image_url" text,
	"stats" jsonb DEFAULT '{"likes": 0, "shares": 0, "downloads": 0}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prompt_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"base_prompt" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prompt_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"prompt" text NOT NULL,
	"success_rate" real DEFAULT 0,
	"times_used" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "site_metrics" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"transforms" integer DEFAULT 128 NOT NULL,
	"shares" integer DEFAULT 340 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "pet_transformations" ADD CONSTRAINT "pet_transformations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_variants" ADD CONSTRAINT "prompt_variants_template_id_prompt_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."prompt_templates"("id") ON DELETE no action ON UPDATE no action;