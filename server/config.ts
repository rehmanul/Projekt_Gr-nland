import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  HOST: z.string().optional(),
  PORT: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DATABASE_SSL: z.string().optional(),
  DATABASE_IAM_AUTH: z.string().optional(),
  PGHOST: z.string().optional(),
  PGPORT: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
  PGDATABASE: z.string().optional(),
  PGSSLMODE: z.string().optional(),
  BASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY_DAYS: z.string().optional(),
  MAGIC_LINK_EXPIRY_MINUTES: z.string().optional(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_AUTH_MODE: z.enum(["login", "none"]).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().min(1),
  STORAGE_PROVIDER: z.enum(["gcs", "s3"]).default("gcs"),
  GCP_PROJECT_ID: z.string().optional(),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  GCP_CREDENTIALS_JSON: z.string().optional(),
  GCS_BUCKET: z.string().optional(),
  GCS_PREFIX: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_DEFAULT_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_SESSION_TOKEN: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_PREFIX: z.string().optional(),
  UPLOAD_MAX_MB: z.string().optional(),
  UPLOAD_MAX_FILES: z.string().optional(),
  ALLOWED_MIME_TYPES: z.string().optional(),
  TENANT_DOMAIN_OVERRIDE: z.string().optional(),
  REMINDER_ASSET_DAYS: z.string().optional(),
  REMINDER_DRAFT_DAYS: z.string().optional(),
  REMINDER_ESCALATE_AFTER_DAYS: z.string().optional(),
  ADMIN_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

const env = parsed.data;
const storageProvider = env.STORAGE_PROVIDER ?? "gcs";
const databaseIamAuth = env.DATABASE_IAM_AUTH === "true";
const pgHost = env.PGHOST;
const pgPort = env.PGPORT ? parseInt(env.PGPORT, 10) : 5432;
const pgUser = env.PGUSER;
const pgPassword = env.PGPASSWORD;
const pgDatabase = env.PGDATABASE;
const smtpAuthMode = env.SMTP_AUTH_MODE ?? "login";
const gcpProjectId = env.GCP_PROJECT_ID ?? env.GOOGLE_CLOUD_PROJECT;
const resolvedAwsRegion = env.AWS_REGION ?? env.AWS_DEFAULT_REGION ?? "";

if (smtpAuthMode === "login") {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS are required when SMTP_AUTH_MODE=login");
  }
}

if (storageProvider === "gcs") {
  if (!gcpProjectId) {
    throw new Error("GCP_PROJECT_ID or GOOGLE_CLOUD_PROJECT is required for GCS storage");
  }
  if (!env.GCS_BUCKET) {
    throw new Error("GCS_BUCKET is required for GCS storage");
  }
}

if (storageProvider === "s3") {
  if (!resolvedAwsRegion || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS_REGION (or AWS_DEFAULT_REGION), AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY are required for S3 storage");
  }
  if (!env.S3_BUCKET) {
    throw new Error("S3_BUCKET is required for S3 storage");
  }
}

const resolvedDbSsl =
  env.DATABASE_SSL === "true" || env.PGSSLMODE === "require" || env.PGSSLMODE === "verify-full";

if (!env.DATABASE_URL) {
  if (!pgHost || !pgUser || !pgDatabase) {
    throw new Error("DATABASE_URL or PGHOST/PGUSER/PGDATABASE must be provided");
  }
  if (!databaseIamAuth && !pgPassword) {
    throw new Error("PGPASSWORD is required unless DATABASE_IAM_AUTH=true");
  }
}

if (databaseIamAuth && !resolvedAwsRegion) {
  throw new Error("AWS_REGION or AWS_DEFAULT_REGION is required for DATABASE_IAM_AUTH");
}

let gcpCredentials: Record<string, unknown> | undefined;
if (env.GCP_CREDENTIALS_JSON) {
  try {
    gcpCredentials = JSON.parse(env.GCP_CREDENTIALS_JSON);
  } catch (error) {
    throw new Error("GCP_CREDENTIALS_JSON must be valid JSON");
  }
}

export const config = {
  nodeEnv: env.NODE_ENV,
  host: env.HOST,
  port: env.PORT ? parseInt(env.PORT, 10) : 5000,
  databaseUrl: env.DATABASE_URL ?? "",
  databaseSsl: resolvedDbSsl,
  database: {
    host: pgHost ?? "",
    port: pgPort,
    user: pgUser ?? "",
    password: pgPassword ?? "",
    name: pgDatabase ?? "",
    sslMode: env.PGSSLMODE ?? "",
    iamAuth: databaseIamAuth,
  },
  baseUrl: env.BASE_URL,
  jwtSecret: env.JWT_SECRET,
  jwtExpiryDays: env.JWT_EXPIRY_DAYS ? parseInt(env.JWT_EXPIRY_DAYS, 10) : 7,
  magicLinkExpiryMinutes: env.MAGIC_LINK_EXPIRY_MINUTES
    ? parseInt(env.MAGIC_LINK_EXPIRY_MINUTES, 10)
    : 60,
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : 587,
    secure: env.SMTP_SECURE === "true",
    authMode: smtpAuthMode,
    user: env.SMTP_USER ?? "",
    pass: env.SMTP_PASS ?? "",
    fromEmail: env.FROM_EMAIL,
  },
  storage: {
    provider: storageProvider,
    bucket: storageProvider === "gcs" ? env.GCS_BUCKET ?? "" : env.S3_BUCKET ?? "",
    prefix: storageProvider === "gcs" ? env.GCS_PREFIX ?? "" : env.S3_PREFIX ?? "",
  },
  gcp: {
    projectId: gcpProjectId ?? "",
    credentials: gcpCredentials,
  },
  gcs: {
    bucket: env.GCS_BUCKET ?? "",
    prefix: env.GCS_PREFIX ?? "",
  },
  aws: {
    region: resolvedAwsRegion,
    accessKeyId: env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? "",
    sessionToken: env.AWS_SESSION_TOKEN,
  },
  s3: {
    bucket: env.S3_BUCKET ?? "",
    prefix: env.S3_PREFIX ?? "",
  },
  uploads: {
    maxMb: env.UPLOAD_MAX_MB ? parseInt(env.UPLOAD_MAX_MB, 10) : 50,
    maxFiles: env.UPLOAD_MAX_FILES ? parseInt(env.UPLOAD_MAX_FILES, 10) : 10,
    allowedMimeTypes: env.ALLOWED_MIME_TYPES
      ? env.ALLOWED_MIME_TYPES.split(",").map((t) => t.trim()).filter(Boolean)
      : [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "video/mp4",
        "video/quicktime",
      ],
  },
  tenantDomainOverride: env.TENANT_DOMAIN_OVERRIDE,
  reminders: {
    assetDays: env.REMINDER_ASSET_DAYS
      ? env.REMINDER_ASSET_DAYS.split(",").map((d) => parseInt(d.trim(), 10)).filter((d) => !Number.isNaN(d))
      : [7, 3, 1],
    draftDays: env.REMINDER_DRAFT_DAYS
      ? env.REMINDER_DRAFT_DAYS.split(",").map((d) => parseInt(d.trim(), 10)).filter((d) => !Number.isNaN(d))
      : [7, 3, 1],
    escalateAfterDays: env.REMINDER_ESCALATE_AFTER_DAYS
      ? parseInt(env.REMINDER_ESCALATE_AFTER_DAYS, 10)
      : 1,
  },
  adminApiKey: env.ADMIN_API_KEY ?? "",
} as const;
