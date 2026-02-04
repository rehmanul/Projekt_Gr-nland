import * as schema from "@shared/schema";
import * as pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { attachDatabasePool } from "@vercel/functions";
import { config } from "./config";
import { getRdsIamToken } from "./rds-iam";

const Pool =
  (pg as any).Pool ??
  (pg as any).default?.Pool ??
  (pg as any).default ??
  (pg as any);

if (typeof Pool !== "function") {
  throw new Error("Pg Pool constructor unavailable");
}

const sslConfig = config.databaseSsl ? { rejectUnauthorized: false } : undefined;
const poolConfig = config.databaseUrl
  ? {
      connectionString: config.databaseUrl,
      ssl: sslConfig,
    }
  : {
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      database: config.database.name,
      ssl: sslConfig,
      password: config.database.iamAuth ? () => getRdsIamToken() : config.database.password,
    };

let poolInstance: InstanceType<typeof Pool> | null = null;

function getPool(): InstanceType<typeof Pool> {
  if (!poolInstance) {
    poolInstance = new Pool(poolConfig);
    attachDatabasePool(poolInstance);
  }
  return poolInstance;
}

const db = drizzle(getPool(), { schema });

export { getPool, db };
