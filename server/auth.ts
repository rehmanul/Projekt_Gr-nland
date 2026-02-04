import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { magicLinks } from "@shared/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { config } from "./config";

const JWT_SECRET = config.jwtSecret;
const MAGIC_LINK_EXPIRY_MINUTES = config.magicLinkExpiryMinutes; // 1 hour default
const JWT_EXPIRY_SECONDS = config.jwtExpiryDays * 24 * 60 * 60;
export const AUTH_COOKIE_NAME = "campaign_auth";

export interface AuthUser {
    email: string;
    tenantId: number;
    portalType: "cs" | "customer" | "agency";
    campaignId?: number;
}

/**
 * Generate a magic link token and store it in the database
 */
export async function createMagicLink(
    tenantId: number,
    email: string,
    portalType: "cs" | "customer" | "agency",
    campaignId?: number
): Promise<string> {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

    await db.insert(magicLinks).values({
        token: tokenHash,
        email,
        tenantId,
        portalType,
        campaignId: campaignId || null,
        expiresAt,
    });

    return token;
}

/**
 * Verify a magic link token and return the user info
 */
export async function verifyMagicLink(token: string): Promise<AuthUser | null> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const [link] = await db
        .select()
        .from(magicLinks)
        .where(
            and(
                eq(magicLinks.token, tokenHash),
                isNull(magicLinks.usedAt),
                gt(magicLinks.expiresAt, new Date())
            )
        )
        .limit(1);

    if (!link) {
        return null;
    }

    // Mark as used
    await db
        .update(magicLinks)
        .set({ usedAt: new Date() })
        .where(eq(magicLinks.id, link.id));

    return {
        email: link.email,
        tenantId: link.tenantId,
        portalType: link.portalType as AuthUser["portalType"],
        campaignId: link.campaignId || undefined,
    };
}

/**
 * Generate a JWT token for an authenticated user
 */
export function generateJWT(user: AuthUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRY_SECONDS });
}

/**
 * Verify a JWT token and return the user info
 */
export function verifyJWT(token: string): AuthUser | null {
    try {
        return jwt.verify(token, JWT_SECRET) as AuthUser;
    } catch {
        return null;
    }
}

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

export function getAuthTokenFromRequest(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.substring(7);
    }
    const cookies = parseCookies(req.headers.cookie);
    return cookies[AUTH_COOKIE_NAME] || null;
}

/**
 * Express middleware to require authentication
 */
export function requireAuth(allowedPortals?: AuthUser["portalType"][]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = getAuthTokenFromRequest(req);
        if (!token) {
            return res.status(401).json({ message: "Authorization required" });
        }

        const user = verifyJWT(token);

        if (!user) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        if (allowedPortals && !allowedPortals.includes(user.portalType)) {
            return res.status(403).json({ message: "Access denied for this portal type" });
        }

        (req as any).authUser = user;
        next();
    };
}

/**
 * Get the authenticated user from request
 */
export function getAuthUser(req: Request): AuthUser | undefined {
    return (req as any).authUser;
}

/**
 * Build the magic link URL for a specific portal
 */
export function buildMagicLinkUrl(
    baseUrl: string,
    token: string,
    portalType: "cs" | "customer" | "agency",
    campaignId?: number
): string {
    const path = portalType === "cs" ? "/cs" : portalType === "customer" ? "/customer" : "/agency";
    const url = new URL(`${path}/auth/verify`, baseUrl);
    url.searchParams.set("token", token);
    if (campaignId) {
        url.searchParams.set("campaignId", String(campaignId));
    }
    return url.toString();
}
