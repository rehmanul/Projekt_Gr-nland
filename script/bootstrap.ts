import "dotenv/config";
import crypto from "crypto";
import { db } from "../server/db";
import { tenants, users } from "../shared/schema";
import { eq } from "drizzle-orm";

const tenantDomain = process.env.BOOTSTRAP_TENANT_DOMAIN;
const tenantName = process.env.BOOTSTRAP_TENANT_NAME;
const csEmail = process.env.BOOTSTRAP_CS_EMAIL;

if (!tenantDomain || !tenantName || !csEmail) {
  console.error("Missing BOOTSTRAP_TENANT_DOMAIN, BOOTSTRAP_TENANT_NAME, or BOOTSTRAP_CS_EMAIL");
  process.exit(1);
}

async function main() {
  const [existingTenant] = await db.select().from(tenants).where(eq(tenants.domain, tenantDomain));
  const tenant =
    existingTenant ??
    (await db
      .insert(tenants)
      .values({
        domain: tenantDomain,
        name: tenantName,
        branding: {},
        settings: {},
        isActive: true,
      })
      .returning()
      .then((rows) => rows[0]));

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, csEmail));

  if (!existingUser) {
    await db.insert(users).values({
      tenantId: tenant.id,
      email: csEmail,
      passwordHash: crypto.randomBytes(32).toString("hex"),
      role: "cs",
      firstName: "CS",
      lastName: "User",
      isActive: true,
    });
  }

  console.log(`Bootstrap complete for tenant ${tenant.domain}`);
}

main().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
