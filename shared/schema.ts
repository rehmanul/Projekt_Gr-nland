import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  domain: varchar("domain", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  branding: jsonb("branding").default('{}'),
  settings: jsonb("settings").default('{}'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // 'admin', 'employer', 'candidate'
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employers = pgTable("employers", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  ownerId: integer("owner_id").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoUrl: varchar("logo_url", { length: 500 }),
  website: varchar("website", { length: 500 }),
  industry: varchar("industry", { length: 100 }),
  size: varchar("size", { length: 50 }),
  location: varchar("location", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  employerId: integer("employer_id").references(() => employers.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }),
  employmentType: varchar("employment_type", { length: 50 }).notNull(), // 'full-time', 'part-time', etc.
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: varchar("salary_currency", { length: 3 }).default('EUR'),
  requirements: text("requirements"),
  benefits: text("benefits"),
  // Drizzle array support for PG
  visibility: varchar("visibility", { length: 50 }).array().default(['primary']), 
  publishedAt: timestamp("published_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  viewCount: integer("view_count").default(0),
  applicationCount: integer("application_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  jobId: integer("job_id").references(() => jobs.id),
  applicantEmail: varchar("applicant_email", { length: 255 }).notNull(),
  applicantName: varchar("applicant_name", { length: 255 }).notNull(),
  applicantPhone: varchar("applicant_phone", { length: 50 }),
  coverLetter: text("cover_letter"),
  resumeUrl: varchar("resume_url", { length: 500 }),
  status: varchar("status", { length: 50 }).default('new'), // 'new', 'reviewed', 'rejected', 'hired'
  createdAt: timestamp("created_at").defaultNow(),
});

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
}));

// === INFER TYPES ===

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Employer = typeof employers.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Application = typeof applications.$inferSelect;

// === INSERT SCHEMAS ===

export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertEmployerSchema = createInsertSchema(employers).omit({ id: true, createdAt: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, viewCount: true, applicationCount: true, createdAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, createdAt: true });

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertEmployer = z.infer<typeof insertEmployerSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

// === API CONTRACT TYPES ===

export type CreateJobRequest = InsertJob;
export type UpdateJobRequest = Partial<InsertJob>;
export type CreateApplicationRequest = InsertApplication;

export interface JobsQueryParams {
  search?: string;
  location?: string;
  employmentType?: string;
  employerId?: number;
}
