# Google Cloud Deployment (Cloud Run + Cloud SQL + GCS + Workspace SMTP)

This guide sets up the campaign approval system on Google Cloud with real production services: Cloud Run, Cloud SQL (Postgres), Google Cloud Storage, and Google Workspace SMTP relay.

## 1) Prerequisites

- A Google Cloud project with billing enabled.
- `gcloud` CLI installed and authenticated.
- A Google Workspace domain with SMTP relay enabled.

## 2) Create Cloud SQL (Postgres)

1. Create a Postgres instance (private IP recommended).
2. Create a database (example: `groenland`).
3. Create a user with a strong password.

Build your `DATABASE_URL`:

```
postgresql://DB_USER:DB_PASS@/DB_NAME?host=/cloudsql/PROJECT:REGION:INSTANCE
```

Set `DATABASE_SSL=false` when using the Cloud SQL Unix socket.

## 3) Create a GCS bucket

Create a bucket (example: `yourapp-assets`) in the same region as Cloud Run for lowest latency.

## 4) Service account & permissions

Create a service account for Cloud Run with these roles:

- `Cloud SQL Client`
- `Storage Object Admin` (or more restrictive object permissions if preferred)

Attach this service account to your Cloud Run service.

## 5) Google Workspace SMTP relay

In the Google Admin console:

1. Enable SMTP relay.
2. Allow the Cloud Run egress IP range or require SMTP authentication.
3. If using authentication, create an app password for the Workspace account.

Recommended SMTP settings:

- `SMTP_HOST=smtp-relay.gmail.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_AUTH_MODE=login`
- `SMTP_USER=workspace-user@your-domain.example`
- `SMTP_PASS=app-password`
- `FROM_EMAIL=workspace-user@your-domain.example`

If you use IP-allowlisted relay without auth, set `SMTP_AUTH_MODE=none` and leave `SMTP_USER`/`SMTP_PASS` unset.

## 6) Environment variables (Cloud Run)

Set all required env vars in Cloud Run (no placeholders):

- `BASE_URL=https://your-domain.example`
- `JWT_SECRET=...` (32+ chars)
- `DATABASE_URL=...`
- `DATABASE_SSL=false`
- `STORAGE_PROVIDER=gcs`
- `GCP_PROJECT_ID=your-gcp-project`
- `GCS_BUCKET=yourapp-assets`
- `GCS_PREFIX=campaigns`
- SMTP vars from section 5
- `TENANT_DOMAIN_OVERRIDE=your-domain.example`
- Reminder vars (optional): `REMINDER_ASSET_DAYS`, `REMINDER_DRAFT_DAYS`, `REMINDER_ESCALATE_AFTER_DAYS`
- `PORT=8080`

If you need local credentials outside Cloud Run, set:

- `GCP_CREDENTIALS_JSON=<service-account-json>`

## 7) Build & deploy

This repo includes a production Dockerfile and Cloud Build config.

### Cloud Build (recommended)

```
gcloud builds submit --config cloudbuild.yaml
```

Update the substitutions in `cloudbuild.yaml` for service name and region before running.

### Direct Cloud Run deploy

```
gcloud run deploy projekt-gronland \
  --image gcr.io/$PROJECT_ID/projekt-gronland:latest \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account your-service-account@your-project.iam.gserviceaccount.com \
  --set-env-vars PORT=8080
```

## 8) Database schema & bootstrap

Apply the schema and create the initial tenant + CS user:

```
npm run db:push

BOOTSTRAP_TENANT_DOMAIN=your-domain.example \
BOOTSTRAP_TENANT_NAME="Your Tenant Name" \
BOOTSTRAP_CS_EMAIL=cs@your-domain.example \
npm run bootstrap
```

## 9) Validate end-to-end

Use `CLIENT_TESTING_GUIDE.md` to run a full production flow. All emails must arrive via Workspace SMTP and all uploads must be in GCS, not local disk.
