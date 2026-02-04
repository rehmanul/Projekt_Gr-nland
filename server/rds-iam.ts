import { Signer } from "@aws-sdk/rds-signer";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { config } from "./config";

let cachedToken: { value: string; expiresAt: number } | null = null;

function resolveCredentialsProvider() {
  if (process.env.VERCEL && config.aws.roleArn) {
    return awsCredentialsProvider({
      roleArn: config.aws.roleArn,
      clientConfig: { region: config.aws.region },
    });
  }
  return defaultProvider();
}

export async function getRdsIamToken(): Promise<string> {
  if (!config.database.iamAuth) {
    return config.database.password;
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) {
    return cachedToken.value;
  }

  const signer = new Signer({
    hostname: config.database.host,
    port: config.database.port,
    username: config.database.user,
    region: config.aws.region,
    credentials: resolveCredentialsProvider(),
  });

  const token = await signer.getAuthToken();
  cachedToken = {
    value: token,
    expiresAt: now + 14 * 60 * 1000,
  };

  return token;
}
