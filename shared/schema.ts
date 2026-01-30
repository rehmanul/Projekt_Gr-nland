import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
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

// === API CONTRACT TYPES ===

export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmployerSchema = createInsertSchema(employers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, viewCount: true, applicationCount: true, createdAt: true, updatedAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, createdAt: true, updatedAt: true });

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Employer = typeof employers.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Application = typeof applications.$inferSelect;

export type CreateJobRequest = z.infer<typeof insertJobSchema>;
export type UpdateJobRequest = Partial<CreateJobRequest>;
export type CreateApplicationRequest = z.infer<typeof insertApplicationSchema>;
