import { db } from "./db";
import {
    agencies,
    campaigns,
    campaignAssets,
    campaignActivities,
    type Agency,
    type Campaign,
    type CampaignAsset,
    type CampaignActivity,
    type InsertAgency,
    type InsertCampaign,
    type InsertCampaignAsset,
    type InsertCampaignActivity,
    type CampaignStatus,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

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

export async function getAgencyByEmail(email: string): Promise<Agency | undefined> {
    if (!db) throw new Error("Database not available");
    const [agency] = await db.select().from(agencies).where(eq(agencies.email, email));
    return agency;
}

export async function createAgency(data: InsertAgency): Promise<Agency> {
    if (!db) throw new Error("Database not available");
    const [agency] = await db.insert(agencies).values(data).returning();
    return agency;
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
    return db
        .select()
        .from(campaigns)
        .where(and(eq(campaigns.tenantId, tenantId), eq(campaigns.customerEmail, customerEmail)))
        .orderBy(desc(campaigns.createdAt));
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
