import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage as defaultStorage, type IStorage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertJobSchema, insertApplicationSchema, type Tenant } from "@shared/schema";
import campaignRoutes from "./campaign-routes";
import { resolveTenantDomain } from "./tenant";
import { initRealtime } from "./realtime";

function resolveTenantMiddleware(storage: IStorage) {
  return async function resolveTenant(req: Request, res: Response, next: NextFunction) {
    const forwardedHost = req.headers["x-forwarded-host"];
    const rawHost = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host;
    const domain = resolveTenantDomain(rawHost);

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
  initRealtime(httpServer);
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
      return res.status(404).json({ message: "Job not found" });
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
          field: err.errors[0].path.join("."),
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
          field: err.errors[0].path.join("."),
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
      return res.status(404).json({ message: "Employer not found" });
    }
    res.json(employer);
  });

  // Tenant
  app.get(api.tenants.current.path, async (req, res) => {
    const tenant = (req as any).tenant as Tenant;
    res.json(tenant);
  });

  return httpServer;
}
