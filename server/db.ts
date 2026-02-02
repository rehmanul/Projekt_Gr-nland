import * as schema from "@shared/schema";

let pool: any = null;
let db: any = null;

if (process.env.DATABASE_URL) {
  try {
    // Dynamically require pg and drizzle only if database is configured
    // This prevents Vercel serverless crashes due to pg native module binding issues
    // when running in in-memory mode (which is the default on fresh deployments)
    const pg = require("pg");
    const { drizzle } = require("drizzle-orm/node-postgres");

    const { Pool } = pg;
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
  } catch (err) {
    console.warn("Failed to initialize PostgreSQL connection, falling back to in-memory:", err);
  }
}

export { pool, db };
