import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db, getPool } from "./db";
import { config } from "./config";
import { tenants, users, employers } from "@shared/schema";
import { readFile, readdir } from "fs/promises";
import path from "path";
import { migrations as embeddedMigrations } from "./migrations";
import { sendTestEmail } from "./email";

const router = Router();

function getAdminKey(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const headerKey = req.headers["x-admin-key"];
  if (typeof headerKey === "string") return headerKey.trim();
  return null;
}

function requireAdmin(req: Request, res: Response): boolean {
  if (!config.adminApiKey) {
    res.status(503).json({ message: "Admin API disabled" });
    return false;
  }
  const provided = getAdminKey(req);
  if (!provided || provided !== config.adminApiKey) {
    res.status(401).json({ message: "Invalid admin credentials" });
    return false;
  }
  return true;
}

const tenantSchema = z.object({
  domain: z.string().min(1),
  name: z.string().min(1),
});

const ownerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const employerSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  location: z.string().optional(),
});

const bootstrapSchema = z.object({
  tenant: tenantSchema,
  owner: ownerSchema,
  employer: employerSchema,
});

router.post("/admin/bootstrap", async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;
    const input = bootstrapSchema.parse(req.body);
    const domain = input.tenant.domain.trim().toLowerCase();

    let [tenant] = await db.select().from(tenants).where(eq(tenants.domain, domain));
    let createdTenant = false;

    if (!tenant) {
      [tenant] = await db
        .insert(tenants)
        .values({
          domain,
          name: input.tenant.name.trim(),
          branding: {},
          settings: {},
          isActive: true,
        })
        .returning();
      createdTenant = true;
    }

    let [owner] = await db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, tenant.id), eq(users.email, input.owner.email)));

    let createdOwner = false;
    if (!owner) {
      const passwordHash = crypto.randomBytes(32).toString("hex");
      [owner] = await db
        .insert(users)
        .values({
          tenantId: tenant.id,
          email: input.owner.email,
          passwordHash,
          role: "employer",
          firstName: input.owner.firstName ?? null,
          lastName: input.owner.lastName ?? null,
          isActive: true,
        })
        .returning();
      createdOwner = true;
    }

    let [employer] = await db
      .select()
      .from(employers)
      .where(and(eq(employers.tenantId, tenant.id), eq(employers.name, input.employer.name)));

    let createdEmployer = false;
    if (!employer) {
      [employer] = await db
        .insert(employers)
        .values({
          tenantId: tenant.id,
          ownerId: owner.id,
          name: input.employer.name,
          description: input.employer.description ?? null,
          logoUrl: input.employer.logoUrl ?? null,
          website: input.employer.website ?? null,
          industry: input.employer.industry ?? null,
          size: input.employer.size ?? null,
          location: input.employer.location ?? null,
          isActive: true,
        })
        .returning();
      createdEmployer = true;
    }

    res.json({
      tenant,
      owner,
      employer,
      created: {
        tenant: createdTenant,
        owner: createdOwner,
        employer: createdEmployer,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error("Admin bootstrap error:", err);
    res.status(500).json({ message: "Failed to bootstrap tenant", error: (err as Error)?.message ?? "Unknown error" });
  }
});

const createEmployerSchema = z.object({
  tenantDomain: z.string().min(1),
  owner: ownerSchema,
  employer: employerSchema,
});

const createCsUserSchema = z.object({
  tenantDomain: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["cs", "admin"]).optional(),
});

router.post("/admin/employers", async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;
    const input = createEmployerSchema.parse(req.body);
    const domain = input.tenantDomain.trim().toLowerCase();

    const [tenant] = await db.select().from(tenants).where(eq(tenants.domain, domain));
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found for domain" });
    }

    let [owner] = await db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, tenant.id), eq(users.email, input.owner.email)));

    if (!owner) {
      const passwordHash = crypto.randomBytes(32).toString("hex");
      [owner] = await db
        .insert(users)
        .values({
          tenantId: tenant.id,
          email: input.owner.email,
          passwordHash,
          role: "employer",
          firstName: input.owner.firstName ?? null,
          lastName: input.owner.lastName ?? null,
          isActive: true,
        })
        .returning();
    }

    const [existingEmployer] = await db
      .select()
      .from(employers)
      .where(and(eq(employers.tenantId, tenant.id), eq(employers.name, input.employer.name)));

    if (existingEmployer) {
      return res.status(409).json({ message: "Employer already exists for tenant" });
    }

    const [employer] = await db
      .insert(employers)
      .values({
        tenantId: tenant.id,
        ownerId: owner.id,
        name: input.employer.name,
        description: input.employer.description ?? null,
        logoUrl: input.employer.logoUrl ?? null,
        website: input.employer.website ?? null,
        industry: input.employer.industry ?? null,
        size: input.employer.size ?? null,
        location: input.employer.location ?? null,
        isActive: true,
      })
      .returning();

    res.status(201).json({ employer, owner, tenant });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error("Create employer error:", err);
    res.status(500).json({ message: "Failed to create employer", error: (err as Error)?.message ?? "Unknown error" });
  }
});

router.post("/admin/cs-users", async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;
    const input = createCsUserSchema.parse(req.body);
    const domain = input.tenantDomain.trim().toLowerCase();

    const [tenant] = await db.select().from(tenants).where(eq(tenants.domain, domain));
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found for domain" });
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, tenant.id), eq(users.email, input.email)));

    if (existingUser) {
      return res.status(409).json({ message: "User already exists for tenant" });
    }

    const passwordHash = crypto.randomBytes(32).toString("hex");
    const [user] = await db
      .insert(users)
      .values({
        tenantId: tenant.id,
        email: input.email,
        passwordHash,
        role: input.role ?? "cs",
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        isActive: true,
      })
      .returning();

    res.status(201).json({ user, tenant });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error("Create CS user error:", err);
    res.status(500).json({ message: "Failed to create CS user", error: (err as Error)?.message ?? "Unknown error" });
  }
});

router.post("/admin/migrate", async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;
    const pool = getPool();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_migrations (
        id serial PRIMARY KEY,
        filename varchar(255) UNIQUE NOT NULL,
        applied_at timestamp DEFAULT now() NOT NULL
      );
    `);

    let migrationsDir = path.resolve(process.cwd(), "migrations");
    let files: string[] = [];
    let useEmbedded = false;
    try {
      files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
    } catch (err) {
      try {
        migrationsDir = path.resolve(process.cwd(), "dist", "migrations");
        files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
      } catch (err2) {
        useEmbedded = true;
        files = embeddedMigrations.map((m) => m.filename);
      }
    }

    const appliedRows = await pool.query("SELECT filename FROM app_migrations");
    const applied = new Set(appliedRows.rows.map((row: { filename: string }) => row.filename));

    const executed: string[] = [];

    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = useEmbedded
        ? embeddedMigrations.find((m) => m.filename === file)?.sql ?? ""
        : await readFile(path.join(migrationsDir, file), "utf8");
      if (!sql) {
        throw new Error(`Missing SQL for migration ${file}`);
      }
      const statements = sql
        .split("--> statement-breakpoint")
        .map((stmt) => stmt.trim())
        .filter(Boolean);

      await pool.query("BEGIN");
      try {
        for (const stmt of statements) {
          await pool.query(stmt);
        }
        await pool.query("INSERT INTO app_migrations (filename) VALUES ($1)", [file]);
        await pool.query("COMMIT");
      } catch (err) {
        await pool.query("ROLLBACK");
        throw err;
      }

      executed.push(file);
    }

    res.json({ executed, total: files.length });
  } catch (err) {
    console.error("Migration error:", err);
    res.status(500).json({ message: "Failed to run migrations", error: (err as Error)?.message ?? "Unknown error" });
  }
});

router.post("/admin/test-email", async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;
    const schema = z.object({
      to: z.string().email(),
      subject: z.string().optional(),
    });
    const input = schema.parse(req.body);
    await sendTestEmail(input.to, input.subject ?? "Test Email");
    res.json({ message: "Email sent" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error("Test email error:", err);
    res.status(500).json({ message: "Failed to send email", error: (err as Error)?.message ?? "Unknown error" });
  }
});

export default router;
