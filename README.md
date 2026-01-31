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
