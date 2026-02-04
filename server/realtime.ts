import { WebSocketServer, WebSocket } from "ws";
import type { Server, IncomingMessage } from "http";
import { AUTH_COOKIE_NAME, verifyJWT, type AuthUser } from "./auth";
import { resolveTenantDomain } from "./tenant";
import { storage } from "./storage";
import * as campaignStorage from "./campaign-storage";

type ClientContext = {
  ws: WebSocket;
  user: AuthUser;
  tenantId: number;
  subscriptions: Set<number>;
};

type CampaignEvent = {
  tenantId: number;
  campaignId: number;
  eventType: string;
  payload?: Record<string, unknown>;
};

let wss: WebSocketServer | null = null;
const clients = new Set<ClientContext>();

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const idx = part.indexOf("=");
      if (idx === -1) return acc;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function getTokenFromRequest(req: IncomingMessage): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[AUTH_COOKIE_NAME] || null;
}

async function canAccessCampaign(user: AuthUser, tenantId: number, campaignId: number): Promise<boolean> {
  if (user.portalType === "cs") return true;
  const campaign = await campaignStorage.getCampaign(tenantId, campaignId);
  if (!campaign) return false;
  if (user.portalType === "customer") {
    return campaign.customerEmail === user.email;
  }
  if (user.portalType === "agency") {
    const agency = await campaignStorage.getAgencyByEmail(tenantId, user.email);
    return !!agency && agency.id === campaign.agencyId;
  }
  return false;
}

export function initRealtime(server: Server) {
  if (wss) return;
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws, req) => {
    try {
      const token = getTokenFromRequest(req);
      if (!token) {
        ws.close(4001, "Unauthorized");
        return;
      }
      const user = verifyJWT(token);
      if (!user) {
        ws.close(4001, "Unauthorized");
        return;
      }

      const forwardedHost = req.headers["x-forwarded-host"];
      const rawHost = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host;
      const domain = resolveTenantDomain(rawHost);
      const tenant = await storage.getTenantByDomain(domain);
      if (!tenant || tenant.id !== user.tenantId) {
        ws.close(4003, "Tenant mismatch");
        return;
      }

      const client: ClientContext = {
        ws: ws as unknown as WebSocket,
        user,
        tenantId: tenant.id,
        subscriptions: new Set<number>(),
      };

      clients.add(client);

      ws.on("message", async (message) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed?.type === "subscribe" && typeof parsed.campaignId === "number") {
            const allowed = await canAccessCampaign(user, tenant.id, parsed.campaignId);
            if (allowed) {
              client.subscriptions.add(parsed.campaignId);
              ws.send(JSON.stringify({ type: "subscribed", campaignId: parsed.campaignId }));
            } else {
              ws.send(JSON.stringify({ type: "error", message: "Not authorized" }));
            }
          }
          if (parsed?.type === "unsubscribe" && typeof parsed.campaignId === "number") {
            client.subscriptions.delete(parsed.campaignId);
            ws.send(JSON.stringify({ type: "unsubscribed", campaignId: parsed.campaignId }));
          }
        } catch {
          ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
        }
      });

      ws.on("close", () => {
        clients.delete(client);
      });

      ws.send(JSON.stringify({ type: "connected" }));
    } catch {
      ws.close(1011, "Server error");
    }
  });
}

export function broadcastCampaignEvent(event: CampaignEvent) {
  clients.forEach((client) => {
    if (client.tenantId !== event.tenantId) return;
    if (client.user.portalType === "cs" || client.subscriptions.has(event.campaignId)) {
      try {
        client.ws.send(JSON.stringify({ type: "campaign_event", ...event }));
      } catch {
        // ignore send errors
      }
    }
  });
}
