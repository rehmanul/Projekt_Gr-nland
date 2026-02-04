ALTER TABLE "magic_links" ADD COLUMN "tenant_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "magic_links" ADD CONSTRAINT "magic_links_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_magic_links_tenant" ON "magic_links" USING btree ("tenant_id");
--> statement-breakpoint
CREATE TABLE "campaign_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_notifications" ADD CONSTRAINT "campaign_notifications_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_campaign_notifications_campaign" ON "campaign_notifications" USING btree ("campaign_id");
--> statement-breakpoint
CREATE INDEX "idx_campaign_notifications_recipient" ON "campaign_notifications" USING btree ("recipient_email");
--> statement-breakpoint
CREATE INDEX "idx_campaign_notifications_type" ON "campaign_notifications" USING btree ("type");
--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_campaign_notifications" ON "campaign_notifications" USING btree ("campaign_id","type","recipient_email");
