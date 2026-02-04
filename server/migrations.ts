export const migrations = [
  {
    filename: "0000_colossal_impossible_man.sql",
    sql: `CREATE TABLE "agencies" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"tenant_id" integer NOT NULL,
\t"name" varchar(255) NOT NULL,
\t"email" varchar(255) NOT NULL,
\t"contact_name" varchar(255),
\t"is_active" boolean DEFAULT true NOT NULL,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"tenant_id" integer NOT NULL,
\t"job_id" integer NOT NULL,
\t"applicant_email" varchar(255) NOT NULL,
\t"applicant_name" varchar(255) NOT NULL,
\t"applicant_phone" varchar(50),
\t"cover_letter" text,
\t"resume_url" varchar(500),
\t"status" varchar(50) DEFAULT 'new' NOT NULL,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_activities" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"campaign_id" integer NOT NULL,
\t"actor_type" varchar(50) NOT NULL,
\t"actor_email" varchar(255) NOT NULL,
\t"action" varchar(100) NOT NULL,
\t"details" jsonb DEFAULT '{}'::jsonb,
\t"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_assets" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"campaign_id" integer NOT NULL,
\t"uploaded_by" varchar(50) NOT NULL,
\t"asset_type" varchar(50) NOT NULL,
\t"filename" varchar(255) NOT NULL,
\t"file_path" varchar(500) NOT NULL,
\t"file_size" integer,
\t"mime_type" varchar(100),
\t"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"tenant_id" integer NOT NULL,
\t"customer_name" varchar(255) NOT NULL,
\t"customer_email" varchar(255) NOT NULL,
\t"campaign_type" varchar(100) NOT NULL,
\t"agency_id" integer NOT NULL,
\t"cs_user_id" integer NOT NULL,
\t"status" varchar(50) DEFAULT 'created' NOT NULL,
\t"asset_deadline" timestamp NOT NULL,
\t"go_live_date" timestamp NOT NULL,
\t"customer_feedback" text,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employers" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"tenant_id" integer NOT NULL,
\t"owner_id" integer NOT NULL,
\t"name" varchar(255) NOT NULL,
\t"description" text,
\t"logo_url" varchar(500),
\t"website" varchar(500),
\t"industry" varchar(100),
\t"size" varchar(50),
\t"location" varchar(255),
\t"is_active" boolean DEFAULT true NOT NULL,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"tenant_id" integer NOT NULL,
\t"employer_id" integer NOT NULL,
\t"title" varchar(255) NOT NULL,
\t"description" text NOT NULL,
\t"location" varchar(255),
\t"employment_type" varchar(50) NOT NULL,
\t"salary_min" integer,
\t"salary_max" integer,
\t"salary_currency" varchar(3) DEFAULT 'EUR' NOT NULL,
\t"requirements" text,
\t"benefits" text,
\t"visibility" varchar(50)[] DEFAULT ARRAY['primary']::varchar[] NOT NULL,
\t"published_at" timestamp,
\t"expires_at" timestamp,
\t"is_active" boolean DEFAULT true NOT NULL,
\t"view_count" integer DEFAULT 0 NOT NULL,
\t"application_count" integer DEFAULT 0 NOT NULL,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_links" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"token" varchar(255) NOT NULL,
\t"email" varchar(255) NOT NULL,
\t"portal_type" varchar(50) NOT NULL,
\t"campaign_id" integer,
\t"expires_at" timestamp NOT NULL,
\t"used_at" timestamp,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\tCONSTRAINT "magic_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"domain" varchar(255) NOT NULL,
\t"name" varchar(255) NOT NULL,
\t"branding" jsonb DEFAULT '{}'::jsonb NOT NULL,
\t"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
\t"is_active" boolean DEFAULT true NOT NULL,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL,
\tCONSTRAINT "tenants_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "users" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"tenant_id" integer NOT NULL,
\t"email" varchar(255) NOT NULL,
\t"password_hash" varchar(255) NOT NULL,
\t"role" varchar(50) NOT NULL,
\t"first_name" varchar(100),
\t"last_name" varchar(100),
\t"is_active" boolean DEFAULT true NOT NULL,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_activities" ADD CONSTRAINT "campaign_activities_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_assets" ADD CONSTRAINT "campaign_assets_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_cs_user_id_users_id_fk" FOREIGN KEY ("cs_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employers" ADD CONSTRAINT "employers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employers" ADD CONSTRAINT "employers_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employer_id_employers_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magic_links" ADD CONSTRAINT "magic_links_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agencies_tenant" ON "agencies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_agencies_email" ON "agencies" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_applications_job" ON "applications" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_applications_tenant" ON "applications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_activities_campaign" ON "campaign_activities" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_assets_campaign" ON "campaign_assets" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_assets_type" ON "campaign_assets" USING btree ("asset_type");--> statement-breakpoint
CREATE INDEX "idx_campaigns_tenant" ON "campaigns" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_campaigns_status" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_campaigns_agency" ON "campaigns" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_campaigns_cs_user" ON "campaigns" USING btree ("cs_user_id");--> statement-breakpoint
CREATE INDEX "idx_employers_tenant" ON "employers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_tenant" ON "jobs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_tenant_active" ON "jobs" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_jobs_search" ON "jobs" USING btree ("title","location");--> statement-breakpoint
CREATE INDEX "idx_magic_links_token" ON "magic_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_magic_links_email" ON "magic_links" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_tenants_domain" ON "tenants" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_users_tenant_email" ON "users" USING btree ("tenant_id","email");`,
  },
  {
    filename: "0001_campaign_notifications.sql",
    sql: `CREATE TABLE "campaign_notifications" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"campaign_id" integer NOT NULL,
\t"notification_type" varchar(100) NOT NULL,
\t"recipient_type" varchar(50) NOT NULL,
\t"recipient_email" varchar(255) NOT NULL,
\t"status" varchar(50) DEFAULT 'pending' NOT NULL,
\t"sent_at" timestamp,
\t"error_message" text,
\t"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_notifications" ADD CONSTRAINT "campaign_notifications_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_campaign_notifications_campaign" ON "campaign_notifications" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_notifications_status" ON "campaign_notifications" USING btree ("status");`,
  },
];
