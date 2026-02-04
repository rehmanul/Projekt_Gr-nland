import { config } from "./config";
import * as campaignStorage from "./campaign-storage";
import * as email from "./email";
import { campaigns } from "@shared/schema";
import { db } from "./db";
import { and, inArray } from "drizzle-orm";

const REMINDER_INTERVAL_MS = 60 * 60 * 1000;

function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

async function sendNotification(params: {
  campaignId: number;
  recipientEmail: string;
  type: string;
  send: () => Promise<void>;
}) {
  const notification = await campaignStorage.createCampaignNotification({
    campaignId: params.campaignId,
    recipientEmail: params.recipientEmail,
    type: params.type,
    status: "pending",
  });

  if (!notification) {
    return;
  }

  try {
    await params.send();
    await campaignStorage.markCampaignNotificationSent(notification.id);
    await campaignStorage.logCampaignActivity({
      campaignId: params.campaignId,
      actorType: "system",
      actorEmail: params.recipientEmail,
      action: `notification_${params.type}`,
      details: { recipient: params.recipientEmail },
    });
  } catch (err: any) {
    await campaignStorage.markCampaignNotificationFailed(notification.id, err?.message ?? "Send failed");
    throw err;
  }
}

async function processAssetReminders() {
  const activeStatuses = ["created", "awaiting_assets"] as const;
  const activeCampaigns = await db
    .select()
    .from(campaigns)
    .where(and(inArray(campaigns.status, activeStatuses as any)));

  for (const campaign of activeCampaigns) {
    const days = daysUntil(new Date(campaign.assetDeadline));
    for (const threshold of config.reminders.assetDays) {
      if (days === threshold) {
        await sendNotification({
          campaignId: campaign.id,
          recipientEmail: campaign.customerEmail,
          type: `asset_reminder_${threshold}d`,
          send: () => email.sendDeadlineReminderEmail(campaign, campaign.customerEmail, "customer", threshold, "asset"),
        });
      }
    }

    if (days < 0 && Math.abs(days) >= config.reminders.escalateAfterDays) {
      const csUser = await campaignStorage.getCsUserById(campaign.tenantId, campaign.csUserId);
      if (csUser && csUser.isActive) {
        await sendNotification({
          campaignId: campaign.id,
          recipientEmail: csUser.email,
          type: "asset_overdue_escalation",
          send: () => email.sendEscalationEmail(campaign, csUser.email, "asset_deadline_overdue", Math.abs(days)),
        });
      }
    }
  }
}

async function processDraftReminders() {
  const activeStatuses = ["assets_uploaded", "draft_in_progress", "revision_requested"] as const;
  const activeCampaigns = await db
    .select()
    .from(campaigns)
    .where(and(inArray(campaigns.status, activeStatuses as any)));

  for (const campaign of activeCampaigns) {
    const days = daysUntil(new Date(campaign.goLiveDate));
    const agency = await campaignStorage.getAgency(campaign.tenantId, campaign.agencyId);
    if (!agency || !agency.isActive) continue;

    for (const threshold of config.reminders.draftDays) {
      if (days === threshold) {
        await sendNotification({
          campaignId: campaign.id,
          recipientEmail: agency.email,
          type: `draft_reminder_${threshold}d`,
          send: () => email.sendDeadlineReminderEmail(campaign, agency.email, "agency", threshold, "draft"),
        });
      }
    }

    if (days < 0 && Math.abs(days) >= config.reminders.escalateAfterDays) {
      const csUser = await campaignStorage.getCsUserById(campaign.tenantId, campaign.csUserId);
      if (csUser && csUser.isActive) {
        await sendNotification({
          campaignId: campaign.id,
          recipientEmail: csUser.email,
          type: "draft_overdue_escalation",
          send: () => email.sendEscalationEmail(campaign, csUser.email, "draft_overdue", Math.abs(days)),
        });
      }
    }
  }
}

export function initReminders() {
  const run = async () => {
    try {
      await processAssetReminders();
      await processDraftReminders();
    } catch (err) {
      console.error("Reminder processing error:", err);
    }
  };

  run();
  setInterval(run, REMINDER_INTERVAL_MS);
}
