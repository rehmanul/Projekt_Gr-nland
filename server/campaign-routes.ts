import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import {
    AUTH_COOKIE_NAME,
    requireAuth,
    getAuthUser,
    createMagicLink,
    verifyMagicLink,
    verifyJWT,
    generateJWT,
    buildMagicLinkUrl,
    getAuthTokenFromRequest,
} from "./auth";
import * as campaignStorage from "./campaign-storage";
import * as email from "./email";
import { config } from "./config";
import { buildCampaignObjectKey, uploadFileToObjectStorage, getSignedDownloadUrl } from "./object-storage";
import { broadcastCampaignEvent } from "./realtime";
import type { Tenant, CampaignAsset } from "@shared/schema";
import type { AuthUser } from "./auth";

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
});

function getBaseUrlFromRequest(req: Request): string {
    const forwardedProto = req.headers["x-forwarded-proto"];
    const forwardedHost = req.headers["x-forwarded-host"];
    const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || req.protocol;
    const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host;
    if (!host) {
        return config.baseUrl;
    }
    return `${protocol}://${host}`;
}

function getTenantUser(req: Request, res: Response, tenant: Tenant): AuthUser | null {
    const user = getAuthUser(req);
    if (!user) {
        res.status(401).json({ message: "Authorization required" });
        return null;
    }
    if (user.tenantId !== tenant.id) {
        res.status(403).json({ message: "Invalid tenant access" });
        return null;
    }
    return user;
}

async function storeCampaignFiles(params: {
    tenantId: number;
    campaignId: number;
    assetType: "asset" | "draft";
    uploadedBy: "customer" | "agency";
    files: Express.Multer.File[];
}): Promise<CampaignAsset[]> {
    const stored: CampaignAsset[] = [];
    for (const file of params.files) {
        const key = buildCampaignObjectKey({
            tenantId: params.tenantId,
            campaignId: params.campaignId,
            assetType: params.assetType,
            filename: file.originalname,
        });
        try {
            await uploadFileToObjectStorage({
                key,
                filePath: file.path,
                contentType: file.mimetype,
            });
            const asset = await campaignStorage.createCampaignAsset({
                campaignId: params.campaignId,
                uploadedBy: params.uploadedBy,
                assetType: params.assetType,
                filename: file.originalname,
                filePath: key,
                fileSize: file.size,
                mimeType: file.mimetype,
            });
            stored.push(asset);
        } finally {
            await fs.promises.unlink(file.path).catch(() => undefined);
        }
    }
    return stored;
}

function attachDownloadUrls(campaignId: number, assets: CampaignAsset[]) {
    return assets.map((asset) => ({
        ...asset,
        downloadUrl: `/api/campaign/${campaignId}/assets/${asset.id}/download`,
    }));
}

// File upload configuration (temporary local storage before object storage upload)
const uploadDir = path.join(os.tmpdir(), "campaign-uploads");

try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (error) {
    console.warn(`Failed to create upload directory at ${uploadDir}, uploads may fail:`, error);
}

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, _file, cb) => {
            const campaignDir = path.join(uploadDir, String((req as any).campaignId));
            if (!fs.existsSync(campaignDir)) {
                fs.mkdirSync(campaignDir, { recursive: true });
            }
            cb(null, campaignDir);
        },
        filename: (_req, file, cb) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + "-" + file.originalname);
        },
    }),
    limits: {
        fileSize: config.uploads.maxMb * 1024 * 1024,
        files: config.uploads.maxFiles,
    },
    fileFilter: (_req, file, cb) => {
        if (!config.uploads.allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error("Unsupported file type"));
        }
        cb(null, true);
    },
});

// === AUTH ROUTES ===

const requestMagicLinkSchema = z.object({
    email: z.string().email(),
    portalType: z.enum(["cs", "customer", "agency"]),
    campaignId: z.coerce.number().optional(),
});

router.post("/auth/request-magic-link", authLimiter, async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const input = requestMagicLinkSchema.parse(req.body);
        let resolvedCampaignId = input.campaignId;
        let eligible = false;

        if (input.portalType === "cs") {
            const csUser = await campaignStorage.getCsUserByEmail(tenant.id, input.email);
            eligible = !!csUser && csUser.isActive;
        } else if (input.portalType === "agency") {
            const agency = await campaignStorage.getAgencyByEmail(tenant.id, input.email);
            eligible = !!agency && agency.isActive;
        } else {
            if (resolvedCampaignId) {
                const campaign = await campaignStorage.getCampaign(tenant.id, resolvedCampaignId);
                eligible = !!campaign && campaign.customerEmail === input.email;
            } else {
                const campaigns = await campaignStorage.getCampaignByCustomerEmail(tenant.id, input.email);
                if (campaigns.length > 0) {
                    eligible = true;
                    resolvedCampaignId = campaigns[0].id;
                }
            }
        }

        if (eligible) {
            const token = await createMagicLink(tenant.id, input.email, input.portalType, resolvedCampaignId);
            const baseUrl = getBaseUrlFromRequest(req);
            const loginUrl = buildMagicLinkUrl(baseUrl, token, input.portalType, resolvedCampaignId);
            await email.sendMagicLinkEmail(input.email, input.portalType, loginUrl);
        }

        res.json({ message: "If your email is registered, you will receive a login link shortly." });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        console.error("Magic link error:", err);
        res.status(500).json({ message: "Failed to create magic link" });
    }
});

router.get("/auth/verify/:token", async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = await verifyMagicLink(String(req.params.token));
        if (!user) {
            return res.status(401).json({ message: "Invalid or expired magic link" });
        }
        if (user.tenantId !== tenant.id) {
            return res.status(401).json({ message: "Invalid or expired magic link" });
        }

        if (user.portalType === "cs") {
            const csUser = await campaignStorage.getCsUserByEmail(tenant.id, user.email);
            if (!csUser || !csUser.isActive) {
                return res.status(401).json({ message: "Invalid or expired magic link" });
            }
        }
        if (user.portalType === "agency") {
            const agency = await campaignStorage.getAgencyByEmail(tenant.id, user.email);
            if (!agency || !agency.isActive) {
                return res.status(401).json({ message: "Invalid or expired magic link" });
            }
        }
        if (user.portalType === "customer") {
            if (user.campaignId) {
                const campaign = await campaignStorage.getCampaign(tenant.id, user.campaignId);
                if (!campaign || campaign.customerEmail !== user.email) {
                    return res.status(401).json({ message: "Invalid or expired magic link" });
                }
            } else {
                const campaigns = await campaignStorage.getCampaignByCustomerEmail(tenant.id, user.email);
                if (campaigns.length === 0) {
                    return res.status(401).json({ message: "Invalid or expired magic link" });
                }
            }
        }

        const jwtToken = generateJWT(user);
        res.cookie(AUTH_COOKIE_NAME, jwtToken, {
            httpOnly: true,
            secure: config.nodeEnv === "production",
            sameSite: "lax",
            maxAge: config.jwtExpiryDays * 24 * 60 * 60 * 1000,
            path: "/",
        });

        res.json({ user });
    } catch (err) {
        console.error("Verify error:", err);
        res.status(500).json({ message: "Verification failed" });
    }
});

router.get("/auth/session", async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const token = getAuthTokenFromRequest(req);
        if (!token) {
            return res.status(401).json({ message: "No active session" });
        }
        const user = verifyJWT(token);
        if (!user || user.tenantId !== tenant.id) {
            return res.status(401).json({ message: "Invalid session" });
        }

        if (user.portalType === "cs") {
            const csUser = await campaignStorage.getCsUserByEmail(tenant.id, user.email);
            if (!csUser || !csUser.isActive) {
                return res.status(401).json({ message: "Invalid session" });
            }
        }
        if (user.portalType === "agency") {
            const agency = await campaignStorage.getAgencyByEmail(tenant.id, user.email);
            if (!agency || !agency.isActive) {
                return res.status(401).json({ message: "Invalid session" });
            }
        }
        if (user.portalType === "customer") {
            if (user.campaignId) {
                const campaign = await campaignStorage.getCampaign(tenant.id, user.campaignId);
                if (!campaign || campaign.customerEmail !== user.email) {
                    return res.status(401).json({ message: "Invalid session" });
                }
            } else {
                const campaigns = await campaignStorage.getCampaignByCustomerEmail(tenant.id, user.email);
                if (campaigns.length === 0) {
                    return res.status(401).json({ message: "Invalid session" });
                }
            }
        }
        res.json({ user });
    } catch (err) {
        console.error("Session error:", err);
        res.status(500).json({ message: "Failed to load session" });
    }
});

router.post("/auth/logout", async (_req: Request, res: Response) => {
    res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
    res.json({ message: "Logged out" });
});

// === CS DASHBOARD ROUTES ===

const createCampaignSchema = z.object({
    customerName: z.string().min(1),
    customerEmail: z.string().email(),
    campaignType: z.string().min(1),
    agencyId: z.coerce.number(),
    assetDeadline: z.string().transform((s) => new Date(s)),
    goLiveDate: z.string().transform((s) => new Date(s)),
}).refine((data) => data.assetDeadline <= data.goLiveDate, {
    message: "Asset deadline must be on or before go-live date",
    path: ["assetDeadline"],
}).refine((data) => !Number.isNaN(data.assetDeadline.getTime()), {
    message: "Invalid asset deadline",
    path: ["assetDeadline"],
}).refine((data) => !Number.isNaN(data.goLiveDate.getTime()), {
    message: "Invalid go-live date",
    path: ["goLiveDate"],
});

router.get("/cs/campaigns", requireAuth(["cs"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;
        const campaigns = await campaignStorage.getCampaigns(tenant.id);

        // Enrich with overdue status
        const enriched = campaigns.map(c => ({
            ...c,
            isOverdue: campaignStorage.isOverdue(c),
            daysUntilDeadline: campaignStorage.getDaysUntilDeadline(c),
        }));

        res.json(enriched);
    } catch (err) {
        console.error("Get campaigns error:", err);
        res.status(500).json({ message: "Failed to fetch campaigns" });
    }
});

router.post("/cs/campaigns", requireAuth(["cs"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;
        const input = createCampaignSchema.parse(req.body);

        const csUser = await campaignStorage.getCsUserByEmail(tenant.id, user.email);
        if (!csUser || !csUser.isActive) {
            return res.status(403).json({ message: "CS user not authorized" });
        }
        const csUserId = csUser.id;

        const agency = await campaignStorage.getAgency(tenant.id, input.agencyId);
        if (!agency || !agency.isActive) {
            return res.status(400).json({ message: "Invalid agency selection" });
        }

        const campaign = await campaignStorage.createCampaign({
            tenantId: tenant.id,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            campaignType: input.campaignType,
            agencyId: input.agencyId,
            csUserId,
            assetDeadline: input.assetDeadline,
            goLiveDate: input.goLiveDate,
            status: "awaiting_assets",
        });

        // Log activity
        await campaignStorage.logCampaignActivity({
            campaignId: campaign.id,
            actorType: "cs",
            actorEmail: user.email,
            action: "campaign_created",
            details: { campaignType: input.campaignType },
        });

        // Send email to customer
        await email.sendCampaignCreatedEmail(campaign, input.customerEmail);

        broadcastCampaignEvent({
            tenantId: tenant.id,
            campaignId: campaign.id,
            eventType: "campaign_created",
            payload: { status: campaign.status },
        });

        res.status(201).json(campaign);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        console.error("Create campaign error:", err);
        res.status(500).json({ message: "Failed to create campaign" });
    }
});

router.get("/cs/campaigns/:id", requireAuth(["cs"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;
        const campaign = await campaignStorage.getCampaign(tenant.id, Number(req.params.id));

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const [assets, activities, agency] = await Promise.all([
            campaignStorage.getCampaignAssets(campaign.id),
            campaignStorage.getCampaignActivities(campaign.id),
            campaignStorage.getAgency(tenant.id, campaign.agencyId),
        ]);

        res.json({
            ...campaign,
            assets: attachDownloadUrls(campaign.id, assets),
            activities,
            agency,
            isOverdue: campaignStorage.isOverdue(campaign),
            daysUntilDeadline: campaignStorage.getDaysUntilDeadline(campaign),
        });
    } catch (err) {
        console.error("Get campaign error:", err);
        res.status(500).json({ message: "Failed to fetch campaign" });
    }
});

router.get("/cs/agencies", requireAuth(["cs"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;
        const agencies = await campaignStorage.getAgencies(tenant.id);
        res.json(agencies);
    } catch (err) {
        console.error("Get agencies error:", err);
        res.status(500).json({ message: "Failed to fetch agencies" });
    }
});

// === CUSTOMER PORTAL ROUTES ===

router.get("/customer/campaigns", requireAuth(["customer"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;

        const campaigns = await campaignStorage.getCampaignByCustomerEmail(tenant.id, user.email);
        const enriched = campaigns.map(c => ({
            ...c,
            isOverdue: campaignStorage.isOverdue(c),
            daysUntilDeadline: campaignStorage.getDaysUntilDeadline(c),
        }));
        res.json(enriched);
    } catch (err) {
        console.error("Get customer campaigns error:", err);
        res.status(500).json({ message: "Failed to fetch campaigns" });
    }
});

const createAgencySchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    contactName: z.string().optional(),
});

router.post("/cs/agencies", requireAuth(["cs"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;

        const csUser = await campaignStorage.getCsUserByEmail(tenant.id, user.email);
        if (!csUser || !csUser.isActive) {
            return res.status(403).json({ message: "CS user not authorized" });
        }

        const input = createAgencySchema.parse(req.body);
        const agency = await campaignStorage.createAgency({
            tenantId: tenant.id,
            name: input.name,
            email: input.email,
            contactName: input.contactName ?? null,
            isActive: true,
        });

        res.status(201).json(agency);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        console.error("Create agency error:", err);
        res.status(500).json({ message: "Failed to create agency" });
    }
});

router.get("/customer/campaign/:id", requireAuth(["customer"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;
        const campaign = await campaignStorage.getCampaign(tenant.id, Number(req.params.id));

        if (!campaign || campaign.customerEmail !== user.email) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const [assets, activities] = await Promise.all([
            campaignStorage.getCampaignAssets(campaign.id),
            campaignStorage.getCampaignActivities(campaign.id),
        ]);

        res.json({
            ...campaign,
            assets: attachDownloadUrls(campaign.id, assets),
            activities,
            daysUntilDeadline: campaignStorage.getDaysUntilDeadline(campaign),
        });
    } catch (err) {
        console.error("Get customer campaign error:", err);
        res.status(500).json({ message: "Failed to fetch campaign" });
    }
});

router.post(
    "/customer/campaign/:id/assets",
    requireAuth(["customer"]),
    (req, res, next) => {
        (req as any).campaignId = req.params.id;
        next();
    },
    upload.array("files", config.uploads.maxFiles),
    async (req: Request, res: Response) => {
        try {
            const tenant = (req as any).tenant as Tenant;
            const user = getTenantUser(req, res, tenant);
            if (!user) return;
            const campaign = await campaignStorage.getCampaign(tenant.id, Number(req.params.id));

            if (!campaign || campaign.customerEmail !== user.email) {
                return res.status(404).json({ message: "Campaign not found" });
            }

            const files = req.files as Express.Multer.File[];
            if (!files || files.length === 0) {
                return res.status(400).json({ message: "No files uploaded" });
            }
            const assets = await storeCampaignFiles({
                tenantId: tenant.id,
                campaignId: campaign.id,
                assetType: "asset",
                uploadedBy: "customer",
                files,
            });

            // Update status
            await campaignStorage.updateCampaignStatus(campaign.id, "assets_uploaded");

            // Log activity
            await campaignStorage.logCampaignActivity({
                campaignId: campaign.id,
                actorType: "customer",
                actorEmail: user.email,
                action: "assets_uploaded",
                details: { fileCount: files.length },
            });

            // Notify agency
            const agency = await campaignStorage.getAgency(tenant.id, campaign.agencyId);
            if (agency) {
                await email.sendAssetsUploadedEmail(campaign, agency);
            }

            broadcastCampaignEvent({
                tenantId: tenant.id,
                campaignId: campaign.id,
                eventType: "assets_uploaded",
                payload: { fileCount: assets.length },
            });

            res.json({ assets: attachDownloadUrls(campaign.id, assets) });
        } catch (err) {
            console.error("Upload assets error:", err);
            res.status(500).json({ message: "Failed to upload assets" });
        }
    }
);

router.post("/customer/campaign/:id/approve", requireAuth(["customer"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;
        const campaign = await campaignStorage.getCampaign(tenant.id, Number(req.params.id));

        if (!campaign || campaign.customerEmail !== user.email) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.status !== "draft_submitted" && campaign.status !== "customer_review") {
            return res.status(400).json({ message: "Campaign not ready for approval" });
        }

        await campaignStorage.updateCampaignStatus(campaign.id, "approved");

        await campaignStorage.logCampaignActivity({
            campaignId: campaign.id,
            actorType: "customer",
            actorEmail: user.email,
            action: "draft_approved",
        });

        // Notify CS and agency
        const agency = await campaignStorage.getAgency(tenant.id, campaign.agencyId);
        if (agency) {
            const csUser = await campaignStorage.getCsUserById(tenant.id, campaign.csUserId);
            if (csUser && csUser.isActive) {
                await email.sendCampaignApprovedEmail(campaign, agency, csUser.email);
            }
        }

        broadcastCampaignEvent({
            tenantId: tenant.id,
            campaignId: campaign.id,
            eventType: "campaign_approved",
            payload: { status: "approved" },
        });

        res.json({ message: "Campaign approved" });
    } catch (err) {
        console.error("Approve error:", err);
        res.status(500).json({ message: "Failed to approve campaign" });
    }
});

const requestChangesSchema = z.object({
    feedback: z.string().min(1),
});

router.post("/customer/campaign/:id/request-changes", requireAuth(["customer"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;
        const input = requestChangesSchema.parse(req.body);
        const campaign = await campaignStorage.getCampaign(tenant.id, Number(req.params.id));

        if (!campaign || campaign.customerEmail !== user.email) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        await campaignStorage.updateCampaignStatus(campaign.id, "revision_requested", input.feedback);

        await campaignStorage.logCampaignActivity({
            campaignId: campaign.id,
            actorType: "customer",
            actorEmail: user.email,
            action: "revision_requested",
            details: { feedback: input.feedback },
        });

        // Notify agency
        const agency = await campaignStorage.getAgency(tenant.id, campaign.agencyId);
        if (agency) {
            await email.sendRevisionRequestedEmail(campaign, agency, input.feedback);
        }

        broadcastCampaignEvent({
            tenantId: tenant.id,
            campaignId: campaign.id,
            eventType: "revision_requested",
            payload: { feedback: input.feedback },
        });

        res.json({ message: "Revision requested" });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        console.error("Request changes error:", err);
        res.status(500).json({ message: "Failed to request changes" });
    }
});

// === AGENCY PORTAL ROUTES ===

router.get("/agency/campaigns", requireAuth(["agency"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;

        const agency = await campaignStorage.getAgencyByEmail(tenant.id, user.email);
        if (!agency) {
            return res.status(404).json({ message: "Agency not found" });
        }

        const campaigns = await campaignStorage.getCampaignsByAgencyId(tenant.id, agency.id);

        const enriched = campaigns.map(c => ({
            ...c,
            isOverdue: campaignStorage.isOverdue(c),
            daysUntilDeadline: campaignStorage.getDaysUntilDeadline(c),
        }));

        res.json(enriched);
    } catch (err) {
        console.error("Get agency campaigns error:", err);
        res.status(500).json({ message: "Failed to fetch campaigns" });
    }
});

router.get("/agency/campaign/:id", requireAuth(["agency"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;
        const campaign = await campaignStorage.getCampaign(tenant.id, Number(req.params.id));

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const agency = await campaignStorage.getAgencyByEmail(tenant.id, user.email);
        if (!agency || campaign.agencyId !== agency.id) {
            return res.status(403).json({ message: "Not authorized for this campaign" });
        }

        const [assets, activities] = await Promise.all([
            campaignStorage.getCampaignAssets(campaign.id),
            campaignStorage.getCampaignActivities(campaign.id),
        ]);

        res.json({
            ...campaign,
            assets: attachDownloadUrls(campaign.id, assets),
            activities,
            daysUntilDeadline: campaignStorage.getDaysUntilDeadline(campaign),
        });
    } catch (err) {
        console.error("Get agency campaign error:", err);
        res.status(500).json({ message: "Failed to fetch campaign" });
    }
});

router.get("/agency/campaign/:id/assets", requireAuth(["agency"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;
        const campaign = await campaignStorage.getCampaign(tenant.id, Number(req.params.id));

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const agency = await campaignStorage.getAgencyByEmail(tenant.id, user.email);
        if (!agency || campaign.agencyId !== agency.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const assets = await campaignStorage.getCampaignAssets(campaign.id, "asset");
        res.json(attachDownloadUrls(campaign.id, assets));
    } catch (err) {
        console.error("Get assets error:", err);
        res.status(500).json({ message: "Failed to fetch assets" });
    }
});

router.post("/agency/campaign/:id/start-draft", requireAuth(["agency"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;

        const campaign = await campaignStorage.getCampaign(tenant.id, Number(req.params.id));
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const agency = await campaignStorage.getAgencyByEmail(tenant.id, user.email);
        if (!agency || campaign.agencyId !== agency.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (!["assets_uploaded", "revision_requested"].includes(campaign.status)) {
            return res.status(400).json({ message: "Campaign not ready to start draft" });
        }

        await campaignStorage.updateCampaignStatus(campaign.id, "draft_in_progress");
        await campaignStorage.logCampaignActivity({
            campaignId: campaign.id,
            actorType: "agency",
            actorEmail: user.email,
            action: "draft_started",
        });

        broadcastCampaignEvent({
            tenantId: tenant.id,
            campaignId: campaign.id,
            eventType: "draft_in_progress",
            payload: { status: "draft_in_progress" },
        });

        res.json({ message: "Draft started" });
    } catch (err) {
        console.error("Start draft error:", err);
        res.status(500).json({ message: "Failed to start draft" });
    }
});

router.post(
    "/agency/campaign/:id/draft",
    requireAuth(["agency"]),
    (req, res, next) => {
        (req as any).campaignId = req.params.id;
        next();
    },
    upload.array("files", config.uploads.maxFiles),
    async (req: Request, res: Response) => {
        try {
            const tenant = (req as any).tenant as Tenant;
            const user = getTenantUser(req, res, tenant);
            if (!user) return;
            const campaign = await campaignStorage.getCampaign(tenant.id, Number(req.params.id));

            if (!campaign) {
                return res.status(404).json({ message: "Campaign not found" });
            }

            const agency = await campaignStorage.getAgencyByEmail(tenant.id, user.email);
            if (!agency || campaign.agencyId !== agency.id) {
                return res.status(403).json({ message: "Not authorized" });
            }

            const files = req.files as Express.Multer.File[];
            if (!files || files.length === 0) {
                return res.status(400).json({ message: "No files uploaded" });
            }
            const drafts = await storeCampaignFiles({
                tenantId: tenant.id,
                campaignId: campaign.id,
                assetType: "draft",
                uploadedBy: "agency",
                files,
            });

            await campaignStorage.updateCampaignStatus(campaign.id, "draft_submitted");

            await campaignStorage.logCampaignActivity({
                campaignId: campaign.id,
                actorType: "agency",
                actorEmail: user.email,
                action: "draft_submitted",
                details: { fileCount: files.length },
            });

            // Notify customer
            await email.sendDraftSubmittedEmail(campaign, campaign.customerEmail);

            broadcastCampaignEvent({
                tenantId: tenant.id,
                campaignId: campaign.id,
                eventType: "draft_submitted",
                payload: { fileCount: drafts.length },
            });

            res.json({ drafts: attachDownloadUrls(campaign.id, drafts) });
        } catch (err) {
            console.error("Upload draft error:", err);
            res.status(500).json({ message: "Failed to upload draft" });
        }
    }
);

// === SHARED ROUTES ===

router.get("/campaign/:id/assets/:assetId/download", requireAuth(), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;

        const campaign = await campaignStorage.getCampaign(tenant.id, Number(req.params.id));
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (user.portalType === "customer" && campaign.customerEmail !== user.email) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (user.portalType === "agency") {
            const agency = await campaignStorage.getAgencyByEmail(tenant.id, user.email);
            if (!agency || agency.id !== campaign.agencyId) {
                return res.status(403).json({ message: "Not authorized" });
            }
        }

        const asset = await campaignStorage.getCampaignAssetById(campaign.id, Number(req.params.assetId));
        if (!asset) {
            return res.status(404).json({ message: "Asset not found" });
        }

        const url = await getSignedDownloadUrl({
            key: asset.filePath,
            filename: asset.filename,
        });

        res.json({ url });
    } catch (err) {
        console.error("Download asset error:", err);
        res.status(500).json({ message: "Failed to generate download link" });
    }
});

router.post("/customer/campaign/:id/start-review", requireAuth(["customer"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;

        const campaign = await campaignStorage.getCampaign(tenant.id, Number(req.params.id));
        if (!campaign || campaign.customerEmail !== user.email) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.status !== "draft_submitted") {
            return res.status(400).json({ message: "Campaign not ready for review" });
        }

        await campaignStorage.updateCampaignStatus(campaign.id, "customer_review");
        await campaignStorage.logCampaignActivity({
            campaignId: campaign.id,
            actorType: "customer",
            actorEmail: user.email,
            action: "review_started",
        });

        broadcastCampaignEvent({
            tenantId: tenant.id,
            campaignId: campaign.id,
            eventType: "customer_review",
            payload: { status: "customer_review" },
        });

        res.json({ message: "Review started" });
    } catch (err) {
        console.error("Start review error:", err);
        res.status(500).json({ message: "Failed to start review" });
    }
});

router.post("/cs/campaigns/:id/mark-live", requireAuth(["cs"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;

        const campaign = await campaignStorage.getCampaign(tenant.id, Number(req.params.id));
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.status !== "approved") {
            return res.status(400).json({ message: "Campaign must be approved before going live" });
        }

        const today = new Date();
        const goLiveDate = new Date(campaign.goLiveDate);
        if (goLiveDate > today) {
            return res.status(400).json({ message: "Go-live date has not been reached yet" });
        }

        await campaignStorage.updateCampaignStatus(campaign.id, "live");
        await campaignStorage.logCampaignActivity({
            campaignId: campaign.id,
            actorType: "cs",
            actorEmail: user.email,
            action: "marked_live",
        });

        broadcastCampaignEvent({
            tenantId: tenant.id,
            campaignId: campaign.id,
            eventType: "campaign_live",
            payload: { status: "live" },
        });

        res.json({ message: "Campaign marked live" });
    } catch (err) {
        console.error("Mark live error:", err);
        res.status(500).json({ message: "Failed to mark campaign live" });
    }
});

router.get("/campaign/:id/timeline", requireAuth(), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getTenantUser(req, res, tenant);
        if (!user) return;
        const campaign = await campaignStorage.getCampaign(tenant.id, Number(req.params.id));

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const activities = await campaignStorage.getCampaignActivities(campaign.id);
        res.json(activities);
    } catch (err) {
        console.error("Get timeline error:", err);
        res.status(500).json({ message: "Failed to fetch timeline" });
    }
});

export default router;
