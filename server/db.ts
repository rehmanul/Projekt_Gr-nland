import * as schema from "@shared/schema";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { attachDatabasePool } from "@vercel/functions";
import { config } from "./config";
import { getRdsIamToken } from "./rds-iam";

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

const pool = new Pool(poolConfig);
attachDatabasePool(pool);

const db = drizzle(pool, { schema });

export { pool, db };
