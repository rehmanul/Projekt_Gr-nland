import { Signer } from "@aws-sdk/rds-signer";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { config } from "./config";

let cachedToken: { value: string; expiresAt: number } | null = null;

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
    credentials: defaultProvider(),
  });

  const token = await signer.getAuthToken();
  cachedToken = {
    value: token,
    expiresAt: now + 14 * 60 * 1000,
  };

  return token;
}
