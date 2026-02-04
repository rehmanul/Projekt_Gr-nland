import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import { config } from "./config";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) return s3Client;
  s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
      sessionToken: config.aws.sessionToken,
    },
  });
  return s3Client;
}

export async function uploadFileToS3(params: {
  key: string;
  filePath: string;
  contentType?: string;
}): Promise<{ key: string; bucket: string }> {
  const client = getS3Client();
  const stream = fs.createReadStream(params.filePath);
  const uploader = new Upload({
    client,
    params: {
      Bucket: config.s3.bucket,
      Key: params.key,
      Body: stream,
      ContentType: params.contentType,
    },
  });
  await uploader.done();
  return { key: params.key, bucket: config.s3.bucket };
}

export async function getSignedDownloadUrl(params: {
  key: string;
  filename: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: params.key,
    ResponseContentDisposition: `attachment; filename="${params.filename}"`,
  });
  return getSignedUrl(client, command, { expiresIn: params.expiresInSeconds ?? 600 });
}
