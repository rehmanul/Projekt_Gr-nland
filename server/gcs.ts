import { Storage } from "@google-cloud/storage";
import { config } from "./config";

let storageClient: Storage | null = null;

function getStorageClient(): Storage {
  if (storageClient) return storageClient;
  const options: ConstructorParameters<typeof Storage>[0] = {
    projectId: config.gcp.projectId,
  };
  if (config.gcp.credentials) {
    options.credentials = config.gcp.credentials;
  }
  storageClient = new Storage(options);
  return storageClient;
}

export async function uploadFileToGcs(params: {
  key: string;
  filePath: string;
  contentType?: string;
}): Promise<{ key: string; bucket: string }> {
  const client = getStorageClient();
  const bucket = client.bucket(config.gcs.bucket);
  await bucket.upload(params.filePath, {
    destination: params.key,
    contentType: params.contentType,
    resumable: false,
  });
  return { key: params.key, bucket: config.gcs.bucket };
}

export async function getSignedDownloadUrl(params: {
  key: string;
  filename: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const client = getStorageClient();
  const file = client.bucket(config.gcs.bucket).file(params.key);
  const expires = Date.now() + (params.expiresInSeconds ?? 600) * 1000;
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires,
    responseDisposition: `attachment; filename="${params.filename}"`,
  });
  return url;
}
