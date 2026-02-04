# Projekt Grönland

Multi-tenant job portal platform (Talent Management Platform for SMEs). Built as the technical nucleus for the full Greenland platform—not a prototype.

## Quick links

| Resource | Description |
|----------|-------------|
| [ROADMAP.md](./ROADMAP.md) | Quarterly roadmap 2026–2027, key areas, outcomes |
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Architecture & alignment checklist (tenant, API, domain, bundles) |
| [extracted/projekt-groenland/](./extracted/projekt-groenland/) | Reference implementation (Next.js frontend, Express backend, docs) |

## Domains & deployment

- **Domain (Pfalzer Jobs):** `www.pfaelzer-jobs.de` — enter in URL bar with `www.` without `https` (no SSL purchased yet).
- **Frontend ELB (NDEV MVP):** http://frontend-2023547862.eu-central-1.elb.amazonaws.com/

## Repo structure

| Path | Purpose |
|------|---------|
| `client/` | React + Vite frontend (consumer of backend API) |
| `server/` | Express backend, REST API, tenant resolution |
| `shared/` | Drizzle schema, API routes, types (single codebase for all portals) |
| `script/` | Build tooling |
| `extracted/projekt-groenland/` | Reference backend/frontend, migrations, docs |

## Run locally

```bash
npm install
npm run db:push   # apply schema
npm run dev       # server + Vite dev
```

## Campaign approval system (production setup)

1. Copy `.env.example` to `.env` and set all required production values (Google Workspace SMTP relay, GCS, JWT secret, BASE_URL, etc.).
2. Apply schema:

```bash
npm run db:push
```

3. Bootstrap the first tenant + CS user:

```bash
BOOTSTRAP_TENANT_DOMAIN=your-domain.example \
BOOTSTRAP_TENANT_NAME="Your Tenant Name" \
BOOTSTRAP_CS_EMAIL=cs@your-domain.example \
npm run bootstrap
```

4. Start the server:

```bash
npm run dev
```

CS users, agencies, and customers authenticate via magic links. Campaign creation and approvals run end-to-end with real email delivery, GCS file storage, audit logging, and realtime updates.

## Live site tenant/employer setup

The public job portal requires a tenant that matches the live domain and at least one employer. Use the admin bootstrap endpoint (protected by `ADMIN_API_KEY`) to create production data.

Example (replace values with real production data):

```bash
curl -X POST https://projekt-gr-nland.vercel.app/api/admin/bootstrap \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant": {
      "domain": "projekt-gr-nland.vercel.app",
      "name": "Projekt Grönland"
    },
    "owner": {
      "email": "owner@your-domain.example",
      "firstName": "Owner",
      "lastName": "User"
    },
    "employer": {
      "name": "Your Company",
      "website": "https://your-company.example",
      "industry": "Technology",
      "size": "51-200",
      "location": "Karlsruhe"
    }
  }'
```

To add additional employers later:

```bash
curl -X POST https://projekt-gr-nland.vercel.app/api/admin/employers \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantDomain": "projekt-gr-nland.vercel.app",
    "owner": {
      "email": "owner@your-domain.example",
      "firstName": "Owner",
      "lastName": "User"
    },
    "employer": {
      "name": "Second Company",
      "website": "https://second-company.example",
      "industry": "Retail",
      "size": "11-50",
      "location": "Mannheim"
    }
  }'
```

Ensure the Vercel project env vars include:

- `ADMIN_API_KEY` (strong random secret)
- `TENANT_DOMAIN_OVERRIDE=projekt-gr-nland.vercel.app` (optional if host headers match)

### Using AWS RDS IAM auth (Vercel-managed Aurora)

If your Vercel project provides `PGHOST`, `PGUSER`, `PGDATABASE` and an IAM role (no password), set:

- `DATABASE_IAM_AUTH=true`
- `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`, `PGSSLMODE=require`
- `AWS_REGION` (or `AWS_DEFAULT_REGION`)

The app will generate RDS IAM auth tokens on each connection. Do not set `PGPASSWORD` in this mode.

## Google Cloud deployment

Production deployment on Google Cloud (Cloud Run + Cloud SQL + GCS + Google Workspace SMTP relay) is supported. See `DEPLOY_GCP.md` for a full, production-grade setup checklist and deployment steps.

## Architecture (summary)

- **Multi-tenant foundation:** Tenant as first-class concept; all entities carry `tenant_id`; domain-based resolution.
- **API-first:** All read/write via versioned REST/JSON API; frontend has no direct DB access.
- **Single frontend codebase** for all portals; assignment by domain/host.
- **PostgreSQL** (Drizzle), optional headless CMS for landing pages (tenant-aware).

See [REQUIREMENTS.md](./REQUIREMENTS.md) and [extracted/projekt-groenland/docs/ARCHITECTURE.md](./extracted/projekt-groenland/docs/ARCHITECTURE.md) for details.

## Goals (from roadmap)

- **2026 – Foundation & transition:** Safe migration of existing customers, technological independence, migration & parallel-run logic.
- **2027 – Monetization & scale:** Service bundles (e.g. HR + reach), scalable SaaS revenue, HR hub, portal factory, readiness & optimization.

Timeline and key areas are in [ROADMAP.md](./ROADMAP.md).

## License

See [extracted/projekt-groenland/LICENSE](./extracted/projekt-groenland/LICENSE) if present.
