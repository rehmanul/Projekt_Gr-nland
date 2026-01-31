# Requirements & alignment — Projekt Grönland

Checklist to ensure the codebase and rollout stay aligned with the target architecture and roadmap.

---

## Must-have architecture

### Multi-tenant foundation

- [x] **Tenant as first-class concept** — `tenants` table; domain identity per portal.
- [x] **Every tenant-specific entity has `tenant_id`** — `users`, `employers`, `jobs`, `applications` (see `shared/schema.ts`).
- [x] **Server-side tenant resolution** — by domain/host (e.g. `server/routes.ts` `resolveTenant`).
- [x] **No data or rights mixing** — all queries scoped by tenant; indices/constraints consider `tenant_id`.
- [ ] **Phase 1: 1 portal live** (e.g. badische-jobs.de); Phase 2+: further portals as additional tenants.

### API & backend

- [x] **REST/JSON API** — versioned, API-first; frontend consumes only the API.
- [x] **No direct DB access from frontend** — all read/write via backend API.
- [x] **Business and publishing rules in backend** — enforcement and validation server-side.
- [ ] **Product-based publishing** — subscription or single ad; publishing only with valid product (to be extended).

### Frontend

- [x] **Single frontend codebase** for all portals.
- [x] **Assignment by domain or host** — no separate code fork per portal.
- [x] **Central configuration** controls portal-specific differences (tenant branding, settings).
- [ ] **Next.js LTS** in reference stack (see `extracted/projekt-groenland/frontend`); this repo uses Vite+React as client.

### Domain, branding, visibility

- [x] **Domain controls portal identity** — one domain per tenant; extensible without hard-coded domains.
- [x] **Branding per tenant** — `tenants.branding` (e.g. primaryColor, logo, favicon).
- [x] **Visibility rules** — e.g. `jobs.visibility` (primary, network); every job has primary portal and unique owner.
- [ ] **Landing pages / CMS** — tenant-aware content; headless CMS (e.g. Strapi or Directus) for content/SEO.

### Employer profile

- [x] **Employer profiles tenant-aware** — `employers.tenantId`; same employer can appear on multiple portals.
- [x] **SEO-safe assignment per portal** — employer data scoped by tenant.

### Data & search

- [x] **PostgreSQL** — stable, easy to test; recommendation for platform data (jobs, employers, users, applications).
- [x] **Indices/constraints** — e.g. `idx_jobs_tenant`, `idx_jobs_tenant_active`, `idx_jobs_search`; tenant-safe search.
- [ ] **Search tenant-safe and extensible** — isolated indexes per portal when moving to dedicated search.

### Operations & quality

- [ ] **Separate Dev, Test, Prod** environments.
- [ ] **Versioned deployments and rollback** — releasable releases.
- [ ] **Monitoring and error analysis** — proactive quality.
- [ ] **Reproducible delivery** — automated build and deployment.

### Monetization (roadmap; not in scope for Phase 1)

- [ ] **Service bundles** (e.g. HR + reach).
- [ ] **Payment Service Provider integration** — connected, but payment function not part of Phase 1 “Jobigo Basic”.
- [ ] **Transparent billing, add-on & upsell logic** — from Q1 2027 onward.
- [ ] **KPI transparency** — ARPU, churn, level of automation (Q3 2027).

---

## Domains & deployment (reference)

- **Pfalzer Jobs:** `www.pfaelzer-jobs.de` (no SSL yet; use `www.` without `https` in URL bar).
- **NDEV MVP frontend ELB:** http://frontend-2023547862.eu-central-1.elb.amazonaws.com/
- **Phase 1 (Q1 2026):** Exact 1:1 copy of badische-jobs.de including migration, no functional extensions (“Jobigo Basic”).

---

## Scope (from decision note)

- **In scope:** Function A, Integration B; 1:1 copy of badische-jobs.de including migration; multi-tenant foundation; API-first; tenant_id on all relevant entities.
- **Not in scope (Phase 1):** Redesign of legacy module; payment function (only integration prep); unnecessary functional or architectural overdevelopment.

---

## How to use this document

- Use the checkboxes to track implementation and rollout.
- Align backlog and epics with [ROADMAP.md](./ROADMAP.md) (quarterly goals and key areas).
- When adding features, ensure they respect tenant isolation, API-first access, and product-based publishing (when implemented).
