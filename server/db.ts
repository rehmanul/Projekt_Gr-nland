import * as schema from "@shared/schema";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "./config";

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
});

const db = drizzle(pool, { schema });

export { pool, db };
