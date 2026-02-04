import {
  users, tenants, employers, jobs, applications,
  type User, type InsertUser,
  type Tenant, type InsertTenant,
  type Employer, type InsertEmployer,
  type Job, type InsertJob,
  type Application, type InsertApplication
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, ilike, and, or, sql, gte, lte, inArray } from "drizzle-orm";

export interface IStorage {
  // Tenant
  getTenantByDomain(domain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;

  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(tenantId: number, email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Employer
  getEmployers(tenantId: number): Promise<Employer[]>;
  getEmployer(tenantId: number, id: number): Promise<Employer | undefined>;
  createEmployer(employer: InsertEmployer): Promise<Employer>;

  // Job
  getJobs(tenantId: number, params: {
    search?: string;
    location?: string;
    employmentType?: string;
    employerId?: number
  }): Promise<(Job & { employer: Employer })[]>;
  getJob(tenantId: number, id: number): Promise<(Job & { employer: Employer }) | undefined>;
  createJob(job: InsertJob): Promise<Job>;

  // Application
  createApplication(application: InsertApplication): Promise<Application>;
}

export class DatabaseStorage implements IStorage {
  async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.domain, domain));
    return tenant;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [newTenant] = await db.insert(tenants).values(tenant).returning();
    return newTenant;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(tenantId: number, email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.tenantId, tenantId), eq(users.email, email))
    );
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getEmployers(tenantId: number): Promise<Employer[]> {
    return await db.select().from(employers).where(eq(employers.tenantId, tenantId));
  }

  async getEmployer(tenantId: number, id: number): Promise<Employer | undefined> {
    const [employer] = await db.select().from(employers).where(
      and(eq(employers.tenantId, tenantId), eq(employers.id, id))
    );
    return employer;
  }

  async createEmployer(employer: InsertEmployer): Promise<Employer> {
    const [newEmployer] = await db.insert(employers).values(employer).returning();
    return newEmployer;
  }

  async getJobs(tenantId: number, params: {
    search?: string;
    location?: string;
    employmentType?: string;
    employerId?: number;
    salaryMin?: number;
    salaryMax?: number;
    remoteType?: string;
    experienceLevel?: string;
    category?: string;
    companySize?: string;
    postedWithin?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<(Job & { employer: Employer })[]> {
    const conditions = [eq(jobs.tenantId, tenantId), eq(jobs.isActive, true)];

    // Text search
    if (params.search) {
      conditions.push(
        or(
          ilike(jobs.title, `%${params.search}%`),
          ilike(jobs.description, `%${params.search}%`)
        )!
      );
    }

    if (params.location) {
      conditions.push(ilike(jobs.location, `%${params.location}%`));
    }

    if (params.employmentType) {
      conditions.push(eq(jobs.employmentType, params.employmentType));
    }

    if (params.employerId) {
      conditions.push(eq(jobs.employerId, params.employerId));
    }

    // Salary range filter
    if (params.salaryMin) {
      conditions.push(gte(jobs.salaryMax, params.salaryMin));
    }
    if (params.salaryMax) {
      conditions.push(lte(jobs.salaryMin, params.salaryMax));
    }

    // Remote type filter (can be comma-separated)
    if (params.remoteType) {
      const types = params.remoteType.split(',').map(t => t.trim());
      if (types.length === 1) {
        conditions.push(eq(jobs.remoteType, types[0]));
      } else {
        conditions.push(inArray(jobs.remoteType, types));
      }
    }

    // Experience level filter (can be comma-separated)
    if (params.experienceLevel) {
      const levels = params.experienceLevel.split(',').map(l => l.trim());
      if (levels.length === 1) {
        conditions.push(eq(jobs.experienceLevel, levels[0]));
      } else {
        conditions.push(inArray(jobs.experienceLevel, levels));
      }
    }

    // Category filter
    if (params.category) {
      conditions.push(eq(jobs.category, params.category));
    }

    // Posted within filter
    if (params.postedWithin && params.postedWithin !== 'all') {
      const now = new Date();
      let cutoff: Date;
      switch (params.postedWithin) {
        case 'today':
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7days':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = new Date(0);
      }
      conditions.push(gte(jobs.publishedAt, cutoff));
    }

    // Company size filter (filter by employer size)
    // This will be applied after the join with employers

    // Build order by clause
    let orderByClause = sql`${jobs.publishedAt} DESC NULLS LAST`;
    const order = params.sortOrder === 'asc' ? sql`ASC` : sql`DESC`;
    switch (params.sortBy) {
      case 'date':
        orderByClause = sql`${jobs.publishedAt} ${order} NULLS LAST`;
        break;
      case 'salary':
        orderByClause = sql`${jobs.salaryMax} ${order} NULLS LAST`;
        break;
      default: // relevance - use published date desc
        orderByClause = sql`${jobs.publishedAt} DESC NULLS LAST`;
    }

    const result = await db
      .select({
        job: jobs,
        employer: employers,
      })
      .from(jobs)
      .innerJoin(employers, eq(jobs.employerId, employers.id))
      .where(and(...conditions))
      .orderBy(orderByClause);

    // Post-filter by company size if specified
    let filtered = result.map(row => ({ ...row.job, employer: row.employer }));

    if (params.companySize) {
      const sizes = params.companySize.split(',').map(s => s.trim());
      filtered = filtered.filter(job => job.employer.size && sizes.includes(job.employer.size));
    }

    return filtered;
  }

  async getJob(tenantId: number, id: number): Promise<(Job & { employer: Employer }) | undefined> {
    const [result] = await db
      .select({
        job: jobs,
        employer: employers,
      })
      .from(jobs)
      .innerJoin(employers, eq(jobs.employerId, employers.id))
      .where(and(eq(jobs.tenantId, tenantId), eq(jobs.id, id)));

    if (!result) return undefined;
    return { ...result.job, employer: result.employer };
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [newApp] = await db.insert(applications).values(application).returning();
    return newApp;
  }
}

export async function initStorage(): Promise<IStorage> {
  await pool.query("SELECT 1");
  return new DatabaseStorage();
}

export const storage = new DatabaseStorage();
