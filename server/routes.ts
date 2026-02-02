import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage as defaultStorage, initStorage, DatabaseStorage, type IStorage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertJobSchema, insertApplicationSchema, type Tenant } from "@shared/schema";
import campaignRoutes from "./campaign-routes";

function resolveTenantMiddleware(storage: IStorage) {
  return async function resolveTenant(req: Request, res: Response, next: NextFunction) {
    const rawHost = req.hostname;
    const isDevOrPreview =
      rawHost === "localhost" ||
      rawHost === "127.0.0.1" ||
      rawHost.includes("replit.app") ||
      rawHost.endsWith(".vercel.app");
    const domain = isDevOrPreview
      ? "badische-jobs.de"
      : rawHost.replace(/^www\./, "") === "pfaelzer-jobs.de"
        ? "www.pfaelzer-jobs.de"
        : rawHost;

    const tenant = await storage.getTenantByDomain(domain);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found for this domain" });
    }
    (req as any).tenant = tenant;
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
  storage: IStorage = defaultStorage
): Promise<Server> {
  // Health check endpoint (bypasses tenant middleware)
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api", resolveTenantMiddleware(storage));

  // Campaign Approval Workflow Routes
  app.use("/api", campaignRoutes);

  // === API ROUTES ===

  // Jobs
  app.get(api.jobs.list.path, async (req, res) => {
    const tenant = (req as any).tenant as Tenant;
    const input = api.jobs.list.input?.parse(req.query) || {};
    const jobsList = await storage.getJobs(tenant.id, input as any);
    res.json(jobsList);
  });

  app.get(api.jobs.get.path, async (req, res) => {
    const tenant = (req as any).tenant as Tenant;
    const job = await storage.getJob(tenant.id, Number(req.params.id));
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  });

  app.post(api.jobs.create.path, async (req, res) => {
    try {
      const tenant = (req as any).tenant as Tenant;
      const input = insertJobSchema.parse({ ...req.body, tenantId: tenant.id });
      const job = await storage.createJob(input);
      res.status(201).json(job);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Applications
  app.post(api.applications.create.path, async (req, res) => {
    try {
      const tenant = (req as any).tenant as Tenant;
      const input = insertApplicationSchema.parse({ ...req.body, tenantId: tenant.id });
      const application = await storage.createApplication(input);
      res.status(201).json(application);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Employers
  app.get(api.employers.list.path, async (req, res) => {
    const tenant = (req as any).tenant as Tenant;
    const employersList = await storage.getEmployers(tenant.id);
    res.json(employersList);
  });

  app.get(api.employers.get.path, async (req, res) => {
    const tenant = (req as any).tenant as Tenant;
    const employer = await storage.getEmployer(tenant.id, Number(req.params.id));
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }
    res.json(employer);
  });

  // Tenant
  app.get(api.tenants.current.path, async (req, res) => {
    const tenant = (req as any).tenant as Tenant;
    res.json(tenant);
  });

  if (storage instanceof DatabaseStorage) {
    await seedDatabase(storage);
  }

  return httpServer;
}

async function seedDatabase(storage: IStorage) {
  const seeds = [
    {
      domain: 'badische-jobs.de',
      name: 'Badische Jobs',
      branding: { primaryColor: '#0066cc', logo: '/logos/badische-jobs.svg', favicon: '/favicon.png' },
      settings: { seo: { title: 'Badische Jobs - Regionale Stellenangebote', description: 'Ihr Portal für Jobs in Baden. Finden Sie jetzt Ihren Traumjob.' } },
    },
    {
      domain: 'www.pfaelzer-jobs.de',
      name: 'Pfälzer Jobs',
      branding: { primaryColor: '#2d5016', logo: '/logos/pfaelzer-jobs.svg', favicon: '/favicon.png' },
      settings: { seo: { title: 'Pfälzer Jobs - Jobs in der Pfalz', description: 'Instead of wanderlust - your next job is closer than you think.' } },
    },
  ] as const;

  for (const { domain, name, branding, settings } of seeds) {
    const existingTenant = await storage.getTenantByDomain(domain);
    if (existingTenant) continue;

    console.log(`Seeding tenant: ${domain}...`);

    const tenant = await storage.createTenant({
      domain,
      name,
      branding,
      settings,
      isActive: true
    });

    // Phase 1 demo data only for badische-jobs.de
    if (domain === 'badische-jobs.de') {
      const admin = await storage.createUser({
        tenantId: tenant.id,
        email: 'hr@badische-jobs.de',
        passwordHash: 'argon2_production_hash',
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true
      });

      const companies = [
        { name: 'TechSolutions Baden GmbH', industry: 'Software Development', location: 'Karlsruhe', description: 'Inovative Softwarelösungen für den Mittelstand.' },
        { name: 'Schwarzwald Genuss AG', industry: 'Gastronomy', location: 'Freiburg', description: 'Traditionelle Küche trifft auf moderne Konzepte.' }
      ];

      for (const comp of companies) {
        const employer = await storage.createEmployer({
          tenantId: tenant.id,
          ownerId: admin.id,
          name: comp.name,
          description: comp.description,
          industry: comp.industry,
          size: '50-250',
          location: comp.location,
          isActive: true
        });
        await storage.createJob({
          tenantId: tenant.id,
          employerId: employer.id,
          title: comp.industry === 'Software Development' ? 'Fullstack Web Developer' : 'Küchenchef (m/w/d)',
          description: 'Herausfordernde Aufgaben in einem dynamischen Team.',
          location: comp.location,
          employmentType: 'full-time',
          salaryMin: comp.industry === 'Software Development' ? 65000 : 45000,
          salaryMax: comp.industry === 'Software Development' ? 85000 : 55000,
          salaryCurrency: 'EUR',
          requirements: 'Abgeschlossene Ausbildung/Studium, relevante Berufserfahrung.',
          benefits: 'Flexible Arbeitszeiten, Weiterbildungsmöglichkeiten.',
          visibility: ['primary', 'network'],
          publishedAt: new Date(),
          isActive: true
        });
      }
    }
  }

  console.log('Production foundation seeded.');
}
