import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import {
    requireAuth,
    getAuthUser,
    createMagicLink,
    verifyMagicLink,
    generateJWT,
    buildMagicLinkUrl,
} from "./auth";
import * as storage from "./campaign-storage";
import * as email from "./email";
import type { Tenant } from "@shared/schema";

const router = Router();

// File upload configuration
// File upload configuration
const uploadDir = process.env.VERCEL
    ? path.join("/tmp", "uploads", "campaigns")
    : path.join(process.cwd(), "uploads", "campaigns");

try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (error) {
    console.warn(`Failed to create upload directory at ${uploadDir}, uploads may fail:`, error);
}

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const campaignDir = path.join(uploadDir, String((req as any).campaignId));
            if (!fs.existsSync(campaignDir)) {
                fs.mkdirSync(campaignDir, { recursive: true });
            }
            cb(null, campaignDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + "-" + file.originalname);
        },
    }),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// === AUTH ROUTES ===

const requestMagicLinkSchema = z.object({
    email: z.string().email(),
    portalType: z.enum(["cs", "customer", "agency"]),
    campaignId: z.number().optional(),
});

router.post("/auth/request-magic-link", async (req: Request, res: Response) => {
    try {
        const input = requestMagicLinkSchema.parse(req.body);
        const token = await createMagicLink(input.email, input.portalType, input.campaignId);

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
        const loginUrl = buildMagicLinkUrl(baseUrl, token, input.portalType, input.campaignId);

        // In production, send email; for POC, return URL directly
        console.log(`[Auth] Magic link for ${input.email}: ${loginUrl}`);

        res.json({ message: "Magic link sent to your email", debug_url: loginUrl });
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
        const user = await verifyMagicLink(String(req.params.token));
        if (!user) {
            return res.status(401).json({ message: "Invalid or expired magic link" });
        }

        const jwtToken = generateJWT(user);
        res.json({ token: jwtToken, user });
    } catch (err) {
        console.error("Verify error:", err);
        res.status(500).json({ message: "Verification failed" });
    }
});

// === CS DASHBOARD ROUTES ===

const createCampaignSchema = z.object({
    customerName: z.string().min(1),
    customerEmail: z.string().email(),
    campaignType: z.string().min(1),
    agencyId: z.number(),
    assetDeadline: z.string().transform(s => new Date(s)),
    goLiveDate: z.string().transform(s => new Date(s)),
});

router.get("/cs/campaigns", requireAuth(["cs"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const campaigns = await storage.getCampaigns(tenant.id);

        // Enrich with overdue status
        const enriched = campaigns.map(c => ({
            ...c,
            isOverdue: storage.isOverdue(c),
            daysUntilDeadline: storage.getDaysUntilDeadline(c),
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
        const user = getAuthUser(req)!;
        const input = createCampaignSchema.parse(req.body);

        // Get CS user ID (simplified - in production would look up by email)
        const csUserId = 1; // Placeholder

        const campaign = await storage.createCampaign({
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
        await storage.logCampaignActivity({
            campaignId: campaign.id,
            actorType: "cs",
            actorEmail: user.email,
            action: "campaign_created",
            details: { campaignType: input.campaignType },
        });

        // Send email to customer
        await email.sendCampaignCreatedEmail(campaign, input.customerEmail);

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
        const campaign = await storage.getCampaign(tenant.id, Number(req.params.id));

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const [assets, activities, agency] = await Promise.all([
            storage.getCampaignAssets(campaign.id),
            storage.getCampaignActivities(campaign.id),
            storage.getAgency(tenant.id, campaign.agencyId),
        ]);

        res.json({
            ...campaign,
            assets,
            activities,
            agency,
            isOverdue: storage.isOverdue(campaign),
            daysUntilDeadline: storage.getDaysUntilDeadline(campaign),
        });
    } catch (err) {
        console.error("Get campaign error:", err);
        res.status(500).json({ message: "Failed to fetch campaign" });
    }
});

router.get("/cs/agencies", requireAuth(["cs"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const agencies = await storage.getAgencies(tenant.id);
        res.json(agencies);
    } catch (err) {
        console.error("Get agencies error:", err);
        res.status(500).json({ message: "Failed to fetch agencies" });
    }
});

// === CUSTOMER PORTAL ROUTES ===

router.get("/customer/campaign/:id", requireAuth(["customer"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getAuthUser(req)!;
        const campaign = await storage.getCampaign(tenant.id, Number(req.params.id));

        if (!campaign || campaign.customerEmail !== user.email) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const [assets, activities] = await Promise.all([
            storage.getCampaignAssets(campaign.id),
            storage.getCampaignActivities(campaign.id),
        ]);

        res.json({
            ...campaign,
            assets,
            activities,
            daysUntilDeadline: storage.getDaysUntilDeadline(campaign),
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
    upload.array("files", 10),
    async (req: Request, res: Response) => {
        try {
            const tenant = (req as any).tenant as Tenant;
            const user = getAuthUser(req)!;
            const campaign = await storage.getCampaign(tenant.id, Number(req.params.id));

            if (!campaign || campaign.customerEmail !== user.email) {
                return res.status(404).json({ message: "Campaign not found" });
            }

            const files = req.files as Express.Multer.File[];
            const assets = await Promise.all(
                files.map(file =>
                    storage.createCampaignAsset({
                        campaignId: campaign.id,
                        uploadedBy: "customer",
                        assetType: "asset",
                        filename: file.originalname,
                        filePath: file.path,
                        fileSize: file.size,
                        mimeType: file.mimetype,
                    })
                )
            );

            // Update status
            await storage.updateCampaignStatus(campaign.id, "assets_uploaded");

            // Log activity
            await storage.logCampaignActivity({
                campaignId: campaign.id,
                actorType: "customer",
                actorEmail: user.email,
                action: "assets_uploaded",
                details: { fileCount: files.length },
            });

            // Notify agency
            const agency = await storage.getAgency(tenant.id, campaign.agencyId);
            if (agency) {
                await email.sendAssetsUploadedEmail(campaign, agency);
            }

            res.json({ assets });
        } catch (err) {
            console.error("Upload assets error:", err);
            res.status(500).json({ message: "Failed to upload assets" });
        }
    }
);

router.post("/customer/campaign/:id/approve", requireAuth(["customer"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getAuthUser(req)!;
        const campaign = await storage.getCampaign(tenant.id, Number(req.params.id));

        if (!campaign || campaign.customerEmail !== user.email) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.status !== "draft_submitted" && campaign.status !== "customer_review") {
            return res.status(400).json({ message: "Campaign not ready for approval" });
        }

        await storage.updateCampaignStatus(campaign.id, "approved");

        await storage.logCampaignActivity({
            campaignId: campaign.id,
            actorType: "customer",
            actorEmail: user.email,
            action: "draft_approved",
        });

        // Notify CS and agency
        const agency = await storage.getAgency(tenant.id, campaign.agencyId);
        if (agency) {
            // Get CS email (simplified)
            const csEmail = "cs@example.com";
            await email.sendCampaignApprovedEmail(campaign, agency, csEmail);
        }

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
        const user = getAuthUser(req)!;
        const input = requestChangesSchema.parse(req.body);
        const campaign = await storage.getCampaign(tenant.id, Number(req.params.id));

        if (!campaign || campaign.customerEmail !== user.email) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        await storage.updateCampaignStatus(campaign.id, "revision_requested", input.feedback);

        await storage.logCampaignActivity({
            campaignId: campaign.id,
            actorType: "customer",
            actorEmail: user.email,
            action: "revision_requested",
            details: { feedback: input.feedback },
        });

        // Notify agency
        const agency = await storage.getAgency(tenant.id, campaign.agencyId);
        if (agency) {
            await email.sendRevisionRequestedEmail(campaign, agency, input.feedback);
        }

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
        const user = getAuthUser(req)!;

        const agency = await storage.getAgencyByEmail(user.email);
        if (!agency) {
            return res.status(404).json({ message: "Agency not found" });
        }

        const campaigns = await storage.getCampaignsByAgencyId(tenant.id, agency.id);

        const enriched = campaigns.map(c => ({
            ...c,
            isOverdue: storage.isOverdue(c),
            daysUntilDeadline: storage.getDaysUntilDeadline(c),
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
        const user = getAuthUser(req)!;
        const campaign = await storage.getCampaign(tenant.id, Number(req.params.id));

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const agency = await storage.getAgencyByEmail(user.email);
        if (!agency || campaign.agencyId !== agency.id) {
            return res.status(403).json({ message: "Not authorized for this campaign" });
        }

        const [assets, activities] = await Promise.all([
            storage.getCampaignAssets(campaign.id),
            storage.getCampaignActivities(campaign.id),
        ]);

        res.json({
            ...campaign,
            assets,
            activities,
            daysUntilDeadline: storage.getDaysUntilDeadline(campaign),
        });
    } catch (err) {
        console.error("Get agency campaign error:", err);
        res.status(500).json({ message: "Failed to fetch campaign" });
    }
});

router.get("/agency/campaign/:id/assets", requireAuth(["agency"]), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const user = getAuthUser(req)!;
        const campaign = await storage.getCampaign(tenant.id, Number(req.params.id));

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const agency = await storage.getAgencyByEmail(user.email);
        if (!agency || campaign.agencyId !== agency.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const assets = await storage.getCampaignAssets(campaign.id, "asset");
        res.json(assets);
    } catch (err) {
        console.error("Get assets error:", err);
        res.status(500).json({ message: "Failed to fetch assets" });
    }
});

router.post(
    "/agency/campaign/:id/draft",
    requireAuth(["agency"]),
    (req, res, next) => {
        (req as any).campaignId = req.params.id;
        next();
    },
    upload.array("files", 10),
    async (req: Request, res: Response) => {
        try {
            const tenant = (req as any).tenant as Tenant;
            const user = getAuthUser(req)!;
            const campaign = await storage.getCampaign(tenant.id, Number(req.params.id));

            if (!campaign) {
                return res.status(404).json({ message: "Campaign not found" });
            }

            const agency = await storage.getAgencyByEmail(user.email);
            if (!agency || campaign.agencyId !== agency.id) {
                return res.status(403).json({ message: "Not authorized" });
            }

            const files = req.files as Express.Multer.File[];
            const drafts = await Promise.all(
                files.map(file =>
                    storage.createCampaignAsset({
                        campaignId: campaign.id,
                        uploadedBy: "agency",
                        assetType: "draft",
                        filename: file.originalname,
                        filePath: file.path,
                        fileSize: file.size,
                        mimeType: file.mimetype,
                    })
                )
            );

            await storage.updateCampaignStatus(campaign.id, "draft_submitted");

            await storage.logCampaignActivity({
                campaignId: campaign.id,
                actorType: "agency",
                actorEmail: user.email,
                action: "draft_submitted",
                details: { fileCount: files.length },
            });

            // Notify customer
            await email.sendDraftSubmittedEmail(campaign, campaign.customerEmail);

            res.json({ drafts });
        } catch (err) {
            console.error("Upload draft error:", err);
            res.status(500).json({ message: "Failed to upload draft" });
        }
    }
);

// === SHARED ROUTES ===

router.get("/campaign/:id/timeline", requireAuth(), async (req: Request, res: Response) => {
    try {
        const tenant = (req as any).tenant as Tenant;
        const campaign = await storage.getCampaign(tenant.id, Number(req.params.id));

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const activities = await storage.getCampaignActivities(campaign.id);
        res.json(activities);
    } catch (err) {
        console.error("Get timeline error:", err);
        res.status(500).json({ message: "Failed to fetch timeline" });
    }
});

export default router;
