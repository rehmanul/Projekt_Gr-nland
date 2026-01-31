import type {
  Tenant,
  User,
  Employer,
  Job,
  Application,
  InsertTenant,
  InsertUser,
  InsertEmployer,
  InsertJob,
  InsertApplication,
} from "@shared/schema";
import type { IStorage } from "./storage";

let id = 0;
function nextId() {
  return ++id;
}

export class MemoryStorage implements IStorage {
  private tenants: Map<number, Tenant> = new Map();
  private tenantsByDomain: Map<string, number> = new Map();
  private users: Map<number, User> = new Map();
  private employers: Map<number, Employer> = new Map();
  private jobs: Map<number, Job> = new Map();
  private applications: Map<number, Application> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const t1 = this.createTenantSync({
      domain: "badische-jobs.de",
      name: "Badische Jobs",
      branding: { primaryColor: "#0066cc", logo: "/logos/badische-jobs.svg", favicon: "/favicon.png" },
      settings: { seo: { title: "Badische Jobs - Regionale Stellenangebote", description: "Ihr Portal für Jobs in Baden." } },
      isActive: true,
    });
    const t2 = this.createTenantSync({
      domain: "www.pfaelzer-jobs.de",
      name: "Pfälzer Jobs",
      branding: { primaryColor: "#2d5016", logo: "/logos/pfaelzer-jobs.svg", favicon: "/favicon.png" },
      settings: { seo: { title: "Pfälzer Jobs - Jobs in der Pfalz", description: "Instead of wanderlust - your next job is closer than you think." } },
      isActive: true,
    });

    const admin = this.createUserSync({
      tenantId: t1.id,
      email: "hr@badische-jobs.de",
      passwordHash: "argon2_production_hash",
      role: "admin",
      firstName: "System",
      lastName: "Administrator",
      isActive: true,
    });

    const companies = [
      { name: "TechSolutions Baden GmbH", industry: "Software Development", location: "Karlsruhe", description: "Inovative Softwarelösungen für den Mittelstand." },
      { name: "Schwarzwald Genuss AG", industry: "Gastronomy", location: "Freiburg", description: "Traditionelle Küche trifft auf moderne Konzepte." },
    ];
    for (const comp of companies) {
      const employer = this.createEmployerSync({
        tenantId: t1.id,
        ownerId: admin.id,
        name: comp.name,
        description: comp.description,
        industry: comp.industry,
        size: "50-250",
        location: comp.location,
        isActive: true,
      });
      this.createJobSync({
        tenantId: t1.id,
        employerId: employer.id,
        title: comp.industry === "Software Development" ? "Fullstack Web Developer" : "Küchenchef (m/w/d)",
        description: "Herausfordernde Aufgaben in einem dynamischen Team.",
        location: comp.location,
        employmentType: "full-time",
        salaryMin: comp.industry === "Software Development" ? 65000 : 45000,
        salaryMax: comp.industry === "Software Development" ? 85000 : 55000,
        salaryCurrency: "EUR",
        requirements: "Abgeschlossene Ausbildung/Studium, relevante Berufserfahrung.",
        benefits: "Flexible Arbeitszeiten, Weiterbildungsmöglichkeiten.",
        visibility: ["primary", "network"],
        publishedAt: new Date(),
        isActive: true,
      });
    }
  }

  private createTenantSync(t: InsertTenant): Tenant {
    const id = nextId();
    const tenant: Tenant = {
      id,
      domain: t.domain,
      name: t.name,
      branding: t.branding ?? {},
      settings: t.settings ?? {},
      isActive: t.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tenants.set(id, tenant);
    this.tenantsByDomain.set(t.domain, id);
    return tenant;
  }

  private createUserSync(u: InsertUser): User {
    const id = nextId();
    const user: User = {
      id,
      tenantId: u.tenantId,
      email: u.email,
      passwordHash: u.passwordHash,
      role: u.role,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      isActive: u.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  private createEmployerSync(e: InsertEmployer): Employer {
    const id = nextId();
    const employer: Employer = {
      id,
      tenantId: e.tenantId,
      ownerId: e.ownerId,
      name: e.name,
      description: e.description ?? null,
      logoUrl: e.logoUrl ?? null,
      website: e.website ?? null,
      industry: e.industry ?? null,
      size: e.size ?? null,
      location: e.location ?? null,
      isActive: e.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.employers.set(id, employer);
    return employer;
  }

  private createJobSync(j: InsertJob): Job {
    const id = nextId();
    const job: Job = {
      id,
      tenantId: j.tenantId,
      employerId: j.employerId,
      title: j.title,
      description: j.description,
      location: j.location ?? null,
      employmentType: j.employmentType,
      salaryMin: j.salaryMin ?? null,
      salaryMax: j.salaryMax ?? null,
      salaryCurrency: j.salaryCurrency ?? "EUR",
      requirements: j.requirements ?? null,
      benefits: j.benefits ?? null,
      visibility: j.visibility ?? ["primary"],
      publishedAt: j.publishedAt ?? null,
      expiresAt: j.expiresAt ?? null,
      isActive: j.isActive ?? true,
      viewCount: 0,
      applicationCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(id, job);
    return job;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
    const id = this.tenantsByDomain.get(domain);
    return id ? this.tenants.get(id) : undefined;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    if (this.tenantsByDomain.has(tenant.domain)) {
      const id = this.tenantsByDomain.get(tenant.domain)!;
      return this.tenants.get(id)!;
    }
    return this.createTenantSync(tenant);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(tenantId: number, email: string): Promise<User | undefined> {
    return [...this.users.values()].find((u) => u.tenantId === tenantId && u.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.createUserSync(user);
  }

  async getEmployers(tenantId: number): Promise<Employer[]> {
    return [...this.employers.values()].filter((e) => e.tenantId === tenantId);
  }

  async getEmployer(tenantId: number, id: number): Promise<Employer | undefined> {
    const e = this.employers.get(id);
    return e?.tenantId === tenantId ? e : undefined;
  }

  async createEmployer(employer: InsertEmployer): Promise<Employer> {
    const e = this.createEmployerSync(employer);
    this.employers.set(e.id, e);
    return e;
  }

  async getJobs(
    tenantId: number,
    params: { search?: string; location?: string; employmentType?: string; employerId?: number }
  ): Promise<(Job & { employer: Employer })[]> {
    let list = [...this.jobs.values()]
      .filter((j) => j.tenantId === tenantId && j.isActive)
      .map((job) => {
        const employer = this.employers.get(job.employerId)!;
        return { ...job, employer };
      });
    if (params.search) {
      const s = params.search.toLowerCase();
      list = list.filter((j) => j.title.toLowerCase().includes(s) || j.description.toLowerCase().includes(s));
    }
    if (params.location) {
      const s = params.location.toLowerCase();
      list = list.filter((j) => j.location?.toLowerCase().includes(s));
    }
    if (params.employmentType) list = list.filter((j) => j.employmentType === params.employmentType);
    if (params.employerId != null) list = list.filter((j) => j.employerId === params.employerId);
    list.sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
    return list;
  }

  async getJob(tenantId: number, id: number): Promise<(Job & { employer: Employer }) | undefined> {
    const job = this.jobs.get(id);
    if (!job || job.tenantId !== tenantId) return undefined;
    const employer = this.employers.get(job.employerId);
    return employer ? { ...job, employer } : undefined;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const j = this.createJobSync(job);
    this.jobs.set(j.id, j);
    return j;
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const id = nextId();
    const app: Application = {
      id,
      tenantId: application.tenantId,
      jobId: application.jobId,
      applicantEmail: application.applicantEmail,
      applicantName: application.applicantName,
      applicantPhone: application.applicantPhone ?? null,
      coverLetter: application.coverLetter ?? null,
      resumeUrl: application.resumeUrl ?? null,
      status: application.status ?? "new",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.applications.set(id, app);
    return app;
  }
}
