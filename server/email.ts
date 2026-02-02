import nodemailer from "nodemailer";
import type { Campaign, Agency } from "@shared/schema";
import { createMagicLink, buildMagicLinkUrl } from "./auth";

// Configure transporter - for POC, use ethereal.email for testing
// In production, replace with actual SMTP/Resend/SendGrid config
let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
    if (transporter) return transporter;

    if (process.env.SMTP_HOST) {
        // Production SMTP config
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Development: use ethereal.email for testing
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log(`[Email] Using test account: ${testAccount.user}`);
    }

    return transporter;
}

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@campaign-approval.local";

interface EmailParams {
    to: string;
    subject: string;
    html: string;
}

async function sendEmail(params: EmailParams): Promise<void> {
    const transport = await getTransporter();
    const info = await transport.sendMail({
        from: FROM_EMAIL,
        to: params.to,
        subject: params.subject,
        html: params.html,
    });

    // Log preview URL for ethereal.email testing
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
        console.log(`[Email] Preview URL: ${previewUrl}`);
    }
}

// === CAMPAIGN NOTIFICATION EMAILS ===

export async function sendCampaignCreatedEmail(
    campaign: Campaign,
    customerEmail: string
): Promise<void> {
    const token = await createMagicLink(customerEmail, "customer", campaign.id);
    const loginUrl = buildMagicLinkUrl(BASE_URL, token, "customer", campaign.id);

    const deadlineDate = new Date(campaign.assetDeadline).toLocaleDateString("de-DE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    await sendEmail({
        to: customerEmail,
        subject: `New Campaign Created - Please Upload Your Assets`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0066cc;">New Campaign: ${campaign.campaignType}</h1>
        <p>Hello ${campaign.customerName},</p>
        <p>A new social media campaign has been created for you. Please upload your brand assets by:</p>
        <p style="font-size: 18px; font-weight: bold; color: #333;">${deadlineDate}</p>
        <p>Click the button below to access your portal and upload assets:</p>
        <a href="${loginUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Upload Assets →
        </a>
        <p style="color: #666; font-size: 12px;">This link will expire in 1 hour. If expired, you can request a new login link.</p>
      </div>
    `,
    });
}

export async function sendAssetsUploadedEmail(
    campaign: Campaign,
    agency: Agency
): Promise<void> {
    const token = await createMagicLink(agency.email, "agency", campaign.id);
    const loginUrl = buildMagicLinkUrl(BASE_URL, token, "agency", campaign.id);

    await sendEmail({
        to: agency.email,
        subject: `Assets Ready - Draft Required for ${campaign.customerName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0066cc;">Assets Ready for Review</h1>
        <p>Hello ${agency.contactName || agency.name},</p>
        <p>Customer <strong>${campaign.customerName}</strong> has uploaded their brand assets for the <strong>${campaign.campaignType}</strong> campaign.</p>
        <p>Please download the assets and create a draft for customer approval.</p>
        <a href="${loginUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          View Assets & Create Draft →
        </a>
        <p style="color: #666; font-size: 12px;">This link will expire in 1 hour.</p>
      </div>
    `,
    });
}

export async function sendDraftSubmittedEmail(
    campaign: Campaign,
    customerEmail: string
): Promise<void> {
    const token = await createMagicLink(customerEmail, "customer", campaign.id);
    const loginUrl = buildMagicLinkUrl(BASE_URL, token, "customer", campaign.id);

    await sendEmail({
        to: customerEmail,
        subject: `Draft Ready for Your Review`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0066cc;">Your Draft is Ready!</h1>
        <p>Hello ${campaign.customerName},</p>
        <p>The agency has submitted a draft for your <strong>${campaign.campaignType}</strong> campaign.</p>
        <p>Please review and either approve or request changes.</p>
        <a href="${loginUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Review Draft →
        </a>
        <p style="color: #666; font-size: 12px;">This link will expire in 1 hour.</p>
      </div>
    `,
    });
}

export async function sendRevisionRequestedEmail(
    campaign: Campaign,
    agency: Agency,
    feedback: string
): Promise<void> {
    const token = await createMagicLink(agency.email, "agency", campaign.id);
    const loginUrl = buildMagicLinkUrl(BASE_URL, token, "agency", campaign.id);

    await sendEmail({
        to: agency.email,
        subject: `Revision Requested - ${campaign.customerName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e67e22;">Changes Requested</h1>
        <p>Hello ${agency.contactName || agency.name},</p>
        <p>Customer <strong>${campaign.customerName}</strong> has requested changes to the <strong>${campaign.campaignType}</strong> campaign draft.</p>
        <div style="background: #f9f9f9; padding: 16px; border-left: 4px solid #e67e22; margin: 16px 0;">
          <strong>Feedback:</strong>
          <p style="margin: 8px 0 0 0;">${feedback}</p>
        </div>
        <a href="${loginUrl}" style="display: inline-block; background: #e67e22; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          View Feedback & Revise →
        </a>
        <p style="color: #666; font-size: 12px;">This link will expire in 1 hour.</p>
      </div>
    `,
    });
}

export async function sendCampaignApprovedEmail(
    campaign: Campaign,
    agency: Agency,
    csEmail: string
): Promise<void> {
    const goLiveDate = new Date(campaign.goLiveDate).toLocaleDateString("de-DE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Notify CS
    const csToken = await createMagicLink(csEmail, "cs", campaign.id);
    const csUrl = buildMagicLinkUrl(BASE_URL, csToken, "cs", campaign.id);

    await sendEmail({
        to: csEmail,
        subject: `Campaign Approved - ${campaign.customerName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #27ae60;">🎉 Campaign Approved!</h1>
        <p>Campaign for <strong>${campaign.customerName}</strong> has been approved!</p>
        <p>Go-live target: <strong>${goLiveDate}</strong></p>
        <a href="${csUrl}" style="display: inline-block; background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          View Campaign →
        </a>
      </div>
    `,
    });

    // Notify Agency
    const agencyToken = await createMagicLink(agency.email, "agency", campaign.id);
    const agencyUrl = buildMagicLinkUrl(BASE_URL, agencyToken, "agency", campaign.id);

    await sendEmail({
        to: agency.email,
        subject: `Campaign Approved - Ready for Go-Live`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #27ae60;">🎉 Campaign Approved!</h1>
        <p>Hello ${agency.contactName || agency.name},</p>
        <p>Great news! The campaign for <strong>${campaign.customerName}</strong> has been approved.</p>
        <p>Go-live target: <strong>${goLiveDate}</strong></p>
        <a href="${agencyUrl}" style="display: inline-block; background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          View Details →
        </a>
      </div>
    `,
    });
}

export async function sendDeadlineReminderEmail(
    campaign: Campaign,
    recipientEmail: string,
    portalType: "customer" | "agency",
    daysRemaining: number,
    reminderType: "asset" | "draft"
): Promise<void> {
    const token = await createMagicLink(recipientEmail, portalType, campaign.id);
    const loginUrl = buildMagicLinkUrl(BASE_URL, token, portalType, campaign.id);

    const urgency = daysRemaining <= 1 ? "🚨 URGENT" : daysRemaining <= 3 ? "⚠️ Reminder" : "📅 Reminder";
    const action = reminderType === "asset" ? "upload your assets" : "submit your draft";

    await sendEmail({
        to: recipientEmail,
        subject: `${urgency}: ${daysRemaining} day(s) left to ${action}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${daysRemaining <= 1 ? '#e74c3c' : '#e67e22'};">${urgency}</h1>
        <p>You have <strong>${daysRemaining} day(s)</strong> remaining to ${action} for the <strong>${campaign.campaignType}</strong> campaign.</p>
        <a href="${loginUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Take Action Now →
        </a>
        <p style="color: #666; font-size: 12px;">This link will expire in 1 hour.</p>
      </div>
    `,
    });
}
