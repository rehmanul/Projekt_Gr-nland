import crypto from "crypto";
import path from "path";
import { config } from "./config";
import { uploadFileToS3, getSignedDownloadUrl as getS3SignedDownloadUrl } from "./s3";
import { uploadFileToGcs, getSignedDownloadUrl as getGcsSignedDownloadUrl } from "./gcs";

function sanitizeFilename(filename: string): string {
  const base = path.basename(filename).replace(/[^A-Za-z0-9._-]/g, "_");
  return base.length > 0 ? base : "file";
}

export function buildCampaignObjectKey(params: {
  tenantId: number;
  campaignId: number;
  assetType: "asset" | "draft";
  filename: string;
}): string {
  const safeName = sanitizeFilename(params.filename);
  const ext = path.extname(safeName);
  const name = path.basename(safeName, ext);
  const unique = crypto.randomUUID();
  const prefix = config.storage.prefix ? config.storage.prefix.replace(/\/+$/, "") + "/" : "";
  return `${prefix}tenants/${params.tenantId}/campaigns/${params.campaignId}/${params.assetType}/${name}-${unique}${ext}`;
}

export async function uploadFileToObjectStorage(params: {
  key: string;
  filePath: string;
  contentType?: string;
}): Promise<{ key: string; bucket: string }> {
  if (config.storage.provider === "gcs") {
    return uploadFileToGcs(params);
  }
  return uploadFileToS3(params);
}

export async function getSignedDownloadUrl(params: {
  key: string;
  filename: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const safeName = sanitizeFilename(params.filename);
  if (config.storage.provider === "gcs") {
    return getGcsSignedDownloadUrl({ ...params, filename: safeName });
  }
  return getS3SignedDownloadUrl({ ...params, filename: safeName });
}
