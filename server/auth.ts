import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { magicLinks } from "@shared/schema";
import { eq, and, gt, isNull } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "campaign-approval-poc-secret-change-in-production";
const MAGIC_LINK_EXPIRY_MINUTES = 60; // 1 hour
const JWT_EXPIRY = "7d"; // 7 days

export interface AuthUser {
    email: string;
    portalType: "cs" | "customer" | "agency";
    campaignId?: number;
}

/**
 * Generate a magic link token and store it in the database
 */
export async function createMagicLink(
    email: string,
    portalType: "cs" | "customer" | "agency",
    campaignId?: number
): Promise<string> {
    if (!db) {
        throw new Error("Database not available");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

    await db.insert(magicLinks).values({
        token,
        email,
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
    if (!db) {
        throw new Error("Database not available");
    }

    const [link] = await db
        .select()
        .from(magicLinks)
        .where(
            and(
                eq(magicLinks.token, token),
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
        portalType: link.portalType as AuthUser["portalType"],
        campaignId: link.campaignId || undefined,
    };
}

/**
 * Generate a JWT token for an authenticated user
 */
export function generateJWT(user: AuthUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRY });
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

/**
 * Express middleware to require authentication
 */
export function requireAuth(allowedPortals?: AuthUser["portalType"][]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authorization required" });
        }

        const token = authHeader.substring(7);
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
