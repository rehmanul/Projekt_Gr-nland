import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// === PRODUCTION GRADE MULTI-TENANT FOUNDATION ===

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  domain: varchar("domain", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  branding: jsonb("branding").notNull().default(sql`'{}'::jsonb`),
  settings: jsonb("settings").notNull().default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  domainIdx: index("idx_tenants_domain").on(table.domain),
}));

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // 'admin', 'employer', 'candidate'
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  tenantEmailIdx: index("idx_users_tenant_email").on(table.tenantId, table.email),
}));

export const employers = pgTable("employers", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoUrl: varchar("logo_url", { length: 500 }),
  website: varchar("website", { length: 500 }),
  industry: varchar("industry", { length: 100 }),
  size: varchar("size", { length: 50 }),
  location: varchar("location", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index("idx_employers_tenant").on(table.tenantId),
}));

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  employerId: integer("employer_id").notNull().references(() => employers.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }),
  employmentType: varchar("employment_type", { length: 50 }).notNull(),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: varchar("salary_currency", { length: 3 }).notNull().default('EUR'),
  requirements: text("requirements"),
  benefits: text("benefits"),
  remoteType: varchar("remote_type", { length: 20 }).notNull().default('on-site'), // 'on-site', 'hybrid', 'remote'
  experienceLevel: varchar("experience_level", { length: 20 }).notNull().default('mid'), // 'entry', 'mid', 'senior', 'executive'
  category: varchar("category", { length: 100 }), // Industry/category for filtering
  visibility: varchar("visibility", { length: 50 }).array().notNull().default(sql`ARRAY['primary']::varchar[]`),
  publishedAt: timestamp("published_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  applicationCount: integer("application_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index("idx_jobs_tenant").on(table.tenantId),
  tenantActiveIdx: index("idx_jobs_tenant_active").on(table.tenantId, table.isActive),
  searchIdx: index("idx_jobs_search").on(table.title, table.location),
}));

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  applicantEmail: varchar("applicant_email", { length: 255 }).notNull(),
  applicantName: varchar("applicant_name", { length: 255 }).notNull(),
  applicantPhone: varchar("applicant_phone", { length: 50 }),
  coverLetter: text("cover_letter"),
  resumeUrl: varchar("resume_url", { length: 500 }),
  status: varchar("status", { length: 50 }).notNull().default('new'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  jobIdx: index("idx_applications_job").on(table.jobId),
  tenantIdx: index("idx_applications_tenant").on(table.tenantId),
}));

// === CAMPAIGN APPROVAL WORKFLOW ===

export const campaignStatusEnum = [
  'created',
  'awaiting_assets',
  'assets_uploaded',
  'draft_in_progress',
  'draft_submitted',
  'customer_review',
  'revision_requested',
  'approved',
  'live'
] as const;

export const agencies = pgTable("agencies", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index("idx_agencies_tenant").on(table.tenantId),
  emailIdx: index("idx_agencies_email").on(table.email),
}));

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  campaignType: varchar("campaign_type", { length: 100 }).notNull(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id),
  csUserId: integer("cs_user_id").notNull().references(() => users.id),
  status: varchar("status", { length: 50 }).notNull().default('created'),
  assetDeadline: timestamp("asset_deadline").notNull(),
  goLiveDate: timestamp("go_live_date").notNull(),
  customerFeedback: text("customer_feedback"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index("idx_campaigns_tenant").on(table.tenantId),
  statusIdx: index("idx_campaigns_status").on(table.status),
  agencyIdx: index("idx_campaigns_agency").on(table.agencyId),
  csUserIdx: index("idx_campaigns_cs_user").on(table.csUserId),
}));

export const campaignAssets = pgTable("campaign_assets", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  uploadedBy: varchar("uploaded_by", { length: 50 }).notNull(), // 'customer' or 'agency'
  assetType: varchar("asset_type", { length: 50 }).notNull(), // 'asset' or 'draft'
  filename: varchar("filename", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
}, (table) => ({
  campaignIdx: index("idx_campaign_assets_campaign").on(table.campaignId),
  typeIdx: index("idx_campaign_assets_type").on(table.assetType),
}));

export const campaignActivities = pgTable("campaign_activities", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  actorType: varchar("actor_type", { length: 50 }).notNull(), // 'cs', 'customer', 'agency'
  actorEmail: varchar("actor_email", { length: 255 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  details: jsonb("details").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  campaignIdx: index("idx_campaign_activities_campaign").on(table.campaignId),
}));

export const campaignNotifications = pgTable("campaign_notifications", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  campaignIdx: index("idx_campaign_notifications_campaign").on(table.campaignId),
  recipientIdx: index("idx_campaign_notifications_recipient").on(table.recipientEmail),
  typeIdx: index("idx_campaign_notifications_type").on(table.type),
  uniqueIdx: uniqueIndex("uniq_campaign_notifications").on(table.campaignId, table.type, table.recipientEmail),
}));

export const magicLinks = pgTable("magic_links", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).unique().notNull(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  email: varchar("email", { length: 255 }).notNull(),
  portalType: varchar("portal_type", { length: 50 }).notNull(), // 'cs', 'customer', 'agency'
  campaignId: integer("campaign_id").references(() => campaigns.id),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  tokenIdx: index("idx_magic_links_token").on(table.token),
  emailIdx: index("idx_magic_links_email").on(table.email),
  tenantIdx: index("idx_magic_links_tenant").on(table.tenantId),
}));

// === RELATIONS ===

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  employers: many(employers),
  jobs: many(jobs),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

export const employersRelations = relations(employers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [employers.tenantId],
    references: [tenants.id],
  }),
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [jobs.tenantId],
    references: [tenants.id],
  }),
  employer: one(employers, {
    fields: [jobs.employerId],
    references: [employers.id],
  }),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  tenant: one(tenants, {
    fields: [applications.tenantId],
    references: [tenants.id],
  }),
}));

export const agenciesRelations = relations(agencies, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [agencies.tenantId],
    references: [tenants.id],
  }),
  campaigns: many(campaigns),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [campaigns.tenantId],
    references: [tenants.id],
  }),
  agency: one(agencies, {
    fields: [campaigns.agencyId],
    references: [agencies.id],
  }),
  csUser: one(users, {
    fields: [campaigns.csUserId],
    references: [users.id],
  }),
  assets: many(campaignAssets),
  activities: many(campaignActivities),
}));

export const campaignAssetsRelations = relations(campaignAssets, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignAssets.campaignId],
    references: [campaigns.id],
  }),
}));

export const campaignActivitiesRelations = relations(campaignActivities, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignActivities.campaignId],
    references: [campaigns.id],
  }),
}));

export const campaignNotificationsRelations = relations(campaignNotifications, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignNotifications.campaignId],
    references: [campaigns.id],
  }),
}));

export const magicLinksRelations = relations(magicLinks, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [magicLinks.campaignId],
    references: [campaigns.id],
  }),
  tenant: one(tenants, {
    fields: [magicLinks.tenantId],
    references: [tenants.id],
  }),
}));

// === API CONTRACT TYPES ===

export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmployerSchema = createInsertSchema(employers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, viewCount: true, applicationCount: true, createdAt: true, updatedAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, createdAt: true, updatedAt: true });

// Campaign Approval Schemas
export const insertAgencySchema = createInsertSchema(agencies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCampaignAssetSchema = createInsertSchema(campaignAssets).omit({ id: true, uploadedAt: true });
export const insertCampaignActivitySchema = createInsertSchema(campaignActivities).omit({ id: true, createdAt: true });
export const insertCampaignNotificationSchema = createInsertSchema(campaignNotifications).omit({ id: true, createdAt: true, sentAt: true });
export const insertMagicLinkSchema = createInsertSchema(magicLinks).omit({ id: true, createdAt: true });

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Employer = typeof employers.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Application = typeof applications.$inferSelect;

// Campaign Approval Types
export type Agency = typeof agencies.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type CampaignAsset = typeof campaignAssets.$inferSelect;
export type CampaignActivity = typeof campaignActivities.$inferSelect;
export type CampaignNotification = typeof campaignNotifications.$inferSelect;
export type MagicLink = typeof magicLinks.$inferSelect;
export type CampaignStatus = typeof campaignStatusEnum[number];

export type CreateJobRequest = z.infer<typeof insertJobSchema>;
export type UpdateJobRequest = Partial<CreateJobRequest>;
export type CreateApplicationRequest = z.infer<typeof insertApplicationSchema>;

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertEmployer = z.infer<typeof insertEmployerSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertAgency = z.infer<typeof insertAgencySchema>;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type InsertCampaignAsset = z.infer<typeof insertCampaignAssetSchema>;
export type InsertCampaignActivity = z.infer<typeof insertCampaignActivitySchema>;
export type InsertCampaignNotification = z.infer<typeof insertCampaignNotificationSchema>;
export type InsertMagicLink = z.infer<typeof insertMagicLinkSchema>;

export type JobsQueryParams = {
  search?: string;
  location?: string;
  employmentType?: string;
  employerId?: number;
  // Advanced filters
  salaryMin?: number;
  salaryMax?: number;
  remoteType?: string; // 'on-site' | 'hybrid' | 'remote' or comma-separated
  experienceLevel?: string; // 'entry' | 'mid' | 'senior' | 'executive' or comma-separated
  category?: string;
  companySize?: string; // Employer size filter
  postedWithin?: string; // 'today' | '7days' | '30days' | 'all'
  sortBy?: string; // 'relevance' | 'date' | 'salary'
  sortOrder?: 'asc' | 'desc';
};
