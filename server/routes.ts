import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertJobSchema, insertApplicationSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === API ROUTES ===

  // Jobs
  app.get(api.jobs.list.path, async (req, res) => {
    const input = api.jobs.list.input?.parse(req.query) || {};
    const jobs = await storage.getJobs(input);
    res.json(jobs);
  });

  app.get(api.jobs.get.path, async (req, res) => {
    const job = await storage.getJob(Number(req.params.id));
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  });

  app.post(api.jobs.create.path, async (req, res) => {
    try {
      const input = insertJobSchema.parse(req.body);
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
      const input = insertApplicationSchema.parse(req.body);
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
    const employers = await storage.getEmployers();
    res.json(employers);
  });

  app.get(api.employers.get.path, async (req, res) => {
    const employer = await storage.getEmployer(Number(req.params.id));
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }
    res.json(employer);
  });

  // Tenant
  app.get(api.tenants.current.path, async (req, res) => {
    // For MVP, return the default tenant
    const tenant = await storage.getTenantByDomain('badische-jobs.de');
    if (!tenant) {
      // Create if missing (should be seeded, but failsafe)
      return res.status(404).json({ message: 'Tenant setup incomplete' });
    }
    res.json(tenant);
  });

  // Seed Data on startup
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingTenant = await storage.getTenantByDomain('badische-jobs.de');
  if (existingTenant) return;

  console.log('Seeding database...');

  // 1. Create Tenant
  const tenant = await storage.createTenant({
    domain: 'badische-jobs.de',
    name: 'Badische Jobs',
    branding: { primaryColor: '#0066cc', logo: '/logos/badische-jobs.svg' },
    settings: { seo: { title: 'Badische Jobs - Regionale Stellenangebote' } },
    isActive: true
  });

  // 2. Create Admin User
  const admin = await storage.createUser({
    tenantId: tenant.id,
    email: 'admin@badische-jobs.de',
    passwordHash: 'hashed_secret', // Placeholder
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true
  });

  // 3. Create Employers
  const techCorp = await storage.createEmployer({
    tenantId: tenant.id,
    ownerId: admin.id,
    name: 'TechSolutions GmbH',
    description: 'Leading provider of software solutions in the region.',
    industry: 'Technology',
    size: '50-100',
    location: 'Karlsruhe',
    website: 'https://example.com',
    isActive: true
  });

  const bakery = await storage.createEmployer({
    tenantId: tenant.id,
    ownerId: admin.id,
    name: 'Bäckerei Müller',
    description: 'Traditional family bakery since 1950.',
    industry: 'Food & Beverage',
    size: '10-50',
    location: 'Freiburg',
    website: 'https://example.com',
    isActive: true
  });

  // 4. Create Jobs
  await storage.createJob({
    tenantId: tenant.id,
    employerId: techCorp.id,
    title: 'Senior Frontend Developer',
    description: 'We are looking for an experienced React developer to join our team. Must know TypeScript and Tailwind.',
    location: 'Karlsruhe',
    employmentType: 'full-time',
    salaryMin: 60000,
    salaryMax: 80000,
    requirements: '5+ years experience, React, Node.js',
    benefits: 'Remote work, Gym membership',
    visibility: ['primary'],
    isActive: true
  });

  await storage.createJob({
    tenantId: tenant.id,
    employerId: techCorp.id,
    title: 'Backend Engineer',
    description: 'Join our backend team building scalable APIs with Node.js and PostgreSQL.',
    location: 'Remote',
    employmentType: 'full-time',
    salaryMin: 55000,
    salaryMax: 75000,
    requirements: 'Node.js, SQL, Redis',
    benefits: 'Remote work, 30 days vacation',
    visibility: ['primary'],
    isActive: true
  });

  await storage.createJob({
    tenantId: tenant.id,
    employerId: bakery.id,
    title: 'Bäcker/in (m/w/d)',
    description: 'Wir suchen Verstärkung für unsere Backstube. Frühaufsteher willkommen!',
    location: 'Freiburg',
    employmentType: 'full-time',
    salaryMin: 30000,
    salaryMax: 40000,
    requirements: 'Ausbildung als Bäcker',
    benefits: 'Mitarbeiterrabatt, Familiäres Klima',
    visibility: ['primary'],
    isActive: true
  });

  console.log('Database seeded successfully!');
}
