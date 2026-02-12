import { db } from "./db";
import {
    agencies,
    campaigns,
    campaignAssets,
    campaignActivities,
    campaignNotifications,
    users,
    type Agency,
    type Campaign,
    type CampaignAsset,
    type CampaignActivity,
    type CampaignNotification,
    type InsertAgency,
    type InsertCampaign,
    type InsertCampaignAsset,
    type InsertCampaignActivity,
    type InsertCampaignNotification,
    type CampaignStatus,
    type User,
} from "@shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { emailsMatch, normalizeEmailAddress } from "./email-normalization";

// === AGENCY OPERATIONS ===

export async function getAgencies(tenantId: number): Promise<Agency[]> {
    if (!db) throw new Error("Database not available");
    return db.select().from(agencies).where(eq(agencies.tenantId, tenantId));
}

export async function getAgency(tenantId: number, id: number): Promise<Agency | undefined> {
    if (!db) throw new Error("Database not available");
    const [agency] = await db
        .select()
        .from(agencies)
        .where(and(eq(agencies.tenantId, tenantId), eq(agencies.id, id)));
    return agency;
}

export async function getAgencyByEmail(tenantId: number, email: string): Promise<Agency | undefined> {
    if (!db) throw new Error("Database not available");
    const normalizedEmail = normalizeEmailAddress(email);
    const allAgencies = await db.select().from(agencies).where(eq(agencies.tenantId, tenantId));
    return allAgencies.find((agency) => emailsMatch(agency.email, normalizedEmail));
}

export async function createAgency(data: InsertAgency): Promise<Agency> {
    if (!db) throw new Error("Database not available");
    const [agency] = await db.insert(agencies).values(data).returning();
    return agency;
}

// === CS USER OPERATIONS ===

const CS_ROLES = ["cs", "admin"] as const;

export async function getCsUserByEmail(tenantId: number, email: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    const normalizedEmail = normalizeEmailAddress(email);
    const csUsers = await db
        .select()
        .from(users)
        .where(and(eq(users.tenantId, tenantId), inArray(users.role, CS_ROLES as any)));
    return csUsers.find((user) => emailsMatch(user.email, normalizedEmail));
}

export async function getCsUserById(tenantId: number, id: number): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.tenantId, tenantId), eq(users.id, id), inArray(users.role, CS_ROLES as any)));
    return user;
}

// === CAMPAIGN OPERATIONS ===

export async function getCampaigns(tenantId: number, filters?: {
    status?: CampaignStatus;
    agencyId?: number;
    csUserId?: number;
}): Promise<Campaign[]> {
    if (!db) throw new Error("Database not available");

    let query = db.select().from(campaigns).where(eq(campaigns.tenantId, tenantId));

    // Note: More complex filtering would need a query builder approach
    const results = await query.orderBy(desc(campaigns.createdAt));

    if (filters) {
        return results.filter(c => {
            if (filters.status && c.status !== filters.status) return false;
            if (filters.agencyId && c.agencyId !== filters.agencyId) return false;
            if (filters.csUserId && c.csUserId !== filters.csUserId) return false;
            return true;
        });
    }

    return results;
}

export async function getCampaign(tenantId: number, id: number): Promise<Campaign | undefined> {
    if (!db) throw new Error("Database not available");
    const [campaign] = await db
        .select()
        .from(campaigns)
        .where(and(eq(campaigns.tenantId, tenantId), eq(campaigns.id, id)));
    return campaign;
}

export async function getCampaignByCustomerEmail(
    tenantId: number,
    customerEmail: string
): Promise<Campaign[]> {
    if (!db) throw new Error("Database not available");
    const normalizedEmail = normalizeEmailAddress(customerEmail);
    const tenantCampaigns = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.tenantId, tenantId))
        .orderBy(desc(campaigns.createdAt));

    return tenantCampaigns.filter((campaign) => emailsMatch(campaign.customerEmail, normalizedEmail));
}

export async function getCampaignsByAgencyId(
    tenantId: number,
    agencyId: number
): Promise<Campaign[]> {
    if (!db) throw new Error("Database not available");
    return db
        .select()
        .from(campaigns)
        .where(and(eq(campaigns.tenantId, tenantId), eq(campaigns.agencyId, agencyId)))
        .orderBy(desc(campaigns.createdAt));
}

export async function createCampaign(data: InsertCampaign): Promise<Campaign> {
    if (!db) throw new Error("Database not available");
    const [campaign] = await db.insert(campaigns).values({
        ...data,
        status: "awaiting_assets",
    }).returning();
    return campaign;
}

export async function updateCampaignStatus(
    id: number,
    status: CampaignStatus,
    feedback?: string
): Promise<Campaign | undefined> {
    if (!db) throw new Error("Database not available");
    const updates: Partial<Campaign> = { status, updatedAt: new Date() };
    if (feedback !== undefined) {
        updates.customerFeedback = feedback;
    }
    const [campaign] = await db
        .update(campaigns)
        .set(updates)
        .where(eq(campaigns.id, id))
        .returning();
    return campaign;
}

// === CAMPAIGN ASSETS ===

export async function getCampaignAssets(campaignId: number, assetType?: "asset" | "draft"): Promise<CampaignAsset[]> {
    if (!db) throw new Error("Database not available");

    if (assetType) {
        return db
            .select()
            .from(campaignAssets)
            .where(and(eq(campaignAssets.campaignId, campaignId), eq(campaignAssets.assetType, assetType)))
            .orderBy(desc(campaignAssets.uploadedAt));
    }

    return db
        .select()
        .from(campaignAssets)
        .where(eq(campaignAssets.campaignId, campaignId))
        .orderBy(desc(campaignAssets.uploadedAt));
}

export async function createCampaignAsset(data: InsertCampaignAsset): Promise<CampaignAsset> {
    if (!db) throw new Error("Database not available");
    const [asset] = await db.insert(campaignAssets).values(data).returning();
    return asset;
}

export async function getCampaignAssetById(campaignId: number, assetId: number): Promise<CampaignAsset | undefined> {
    if (!db) throw new Error("Database not available");
    const [asset] = await db
        .select()
        .from(campaignAssets)
        .where(and(eq(campaignAssets.campaignId, campaignId), eq(campaignAssets.id, assetId)));
    return asset;
}

// === CAMPAIGN ACTIVITIES (AUDIT LOG) ===

export async function getCampaignActivities(campaignId: number): Promise<CampaignActivity[]> {
    if (!db) throw new Error("Database not available");
    return db
        .select()
        .from(campaignActivities)
        .where(eq(campaignActivities.campaignId, campaignId))
        .orderBy(desc(campaignActivities.createdAt));
}

export async function logCampaignActivity(data: InsertCampaignActivity): Promise<CampaignActivity> {
    if (!db) throw new Error("Database not available");
    const [activity] = await db.insert(campaignActivities).values(data).returning();
    return activity;
}

// === CAMPAIGN NOTIFICATIONS ===

export async function createCampaignNotification(data: InsertCampaignNotification): Promise<CampaignNotification | null> {
    if (!db) throw new Error("Database not available");
    const [notification] = await db
        .insert(campaignNotifications)
        .values(data)
        .onConflictDoNothing()
        .returning();
    return notification ?? null;
}

export async function markCampaignNotificationSent(id: number): Promise<void> {
    if (!db) throw new Error("Database not available");
    await db
        .update(campaignNotifications)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(campaignNotifications.id, id));
}

export async function markCampaignNotificationFailed(id: number, error: string): Promise<void> {
    if (!db) throw new Error("Database not available");
    await db
        .update(campaignNotifications)
        .set({ status: "failed", error })
        .where(eq(campaignNotifications.id, id));
}

// === HELPER FUNCTIONS ===

export function isOverdue(campaign: Campaign): boolean {
    const now = new Date();
    const deadline = new Date(campaign.assetDeadline);
    return now > deadline && !["approved", "live"].includes(campaign.status);
}

export function getDaysUntilDeadline(campaign: Campaign): number {
    const now = new Date();
    const deadline = new Date(campaign.assetDeadline);
    const diff = deadline.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
