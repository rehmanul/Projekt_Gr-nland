# Campaign Approval System - Production Validation Guide (Google Cloud)

## Portals

| Portal | URL | Role |
|--------|-----|------|
| **CS Dashboard** | `/cs/login` | Create & monitor campaigns |
| **Customer Portal** | `/customer/login` | Upload assets, approve drafts |
| **Agency Portal** | `/agency/login` | Download assets, submit drafts |

---

## End-to-End Flow (Production)

### Step 1: Login as CS User
1. Go to `/cs/login`
2. Enter a CS user email that exists in the database
3. Click "Send Magic Link"
4. Use the emailed link to log in

### Step 2: Create a Campaign
1. Click "New Campaign"
2. Fill in customer details, select agency
3. Set deadlines and click Create
4. Customer receives a magic-link email

### Step 3: Customer Uploads Assets
1. Customer opens the magic link in their email
2. Uploads files
3. Agency receives a magic-link email

### Step 4: Agency Submits Draft
1. Agency opens the magic link in their email
2. Downloads customer assets
3. Uploads a draft
4. Customer receives a magic-link email

### Step 5: Customer Approves or Requests Changes
1. Customer reviews the draft
2. Approves or requests revisions
3. CS + agency receive notifications upon approval

---

## Verification Checklist

1. Real emails sent via Google Workspace SMTP relay
2. GCS storage used for uploads (no local file persistence)
3. Realtime updates visible across portals without manual refresh
4. Activity timeline shows all actions with timestamps and actors
5. Reminder and escalation emails sent based on deadlines

---

## Notes

- This system requires real Workspace SMTP, GCS, and Postgres credentials.
- Magic links are one-time and expire after the configured TTL.
- Uploads are streamed to GCS and delivered via signed URLs.
