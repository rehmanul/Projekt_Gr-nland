import { config } from "./config";

export function resolveTenantDomain(rawHost: string | undefined): string {
  if (config.tenantDomainOverride) {
    return config.tenantDomainOverride;
  }

  if (!rawHost) {
    throw new Error("Missing host header for tenant resolution");
  }

  const host = rawHost.split(",")[0].trim();
  const hostWithoutPort = host.replace(/:\d+$/, "");
  return hostWithoutPort.toLowerCase();
}

