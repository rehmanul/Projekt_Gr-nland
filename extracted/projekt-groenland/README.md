# Project Grönland - Multi-Tenant Job Portal Platform

## Architecture Overview

Production-ready multi-tenant job portal platform built for migration from Jobiqo to proprietary system.

### Tech Stack

**Backend:**
- Node.js 20 LTS + Express
- PostgreSQL 15+ (multi-tenant with tenant_id)
- JWT Authentication
- REST API (versioned)

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Server-side rendering + Static generation

**CMS:**
- Strapi 4.x (Headless CMS)
- Self-hosted, tenant-aware

**Infrastructure:**
- Docker + Docker Compose
- Nginx reverse proxy
- Redis (caching + sessions)
- AWS deployment ready

## Project Structure

```
projekt-groenland/
├── backend/              # Node.js REST API
├── frontend/             # Next.js application
├── cms/                  # Strapi headless CMS
├── infrastructure/       # Docker, nginx, deployment
├── database/            # PostgreSQL migrations & seeds
├── docs/                # Technical documentation
└── scripts/             # Migration & deployment scripts
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- PostgreSQL 15+
- pnpm (recommended) or npm

### Development Setup

```bash
# Clone and install
git clone <repository>
cd projekt-groenland
pnpm install

# Start infrastructure
docker-compose up -d

# Run migrations
cd database && pnpm migrate

# Start services
pnpm dev
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- CMS: http://localhost:1337
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Environment Configuration

Copy `.env.example` to `.env` in each service directory and configure:

### Backend (.env)
```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://groenland:password@localhost:5432/groenland
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_CMS_URL=http://localhost:1337
```

### CMS (.env)
```
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=groenland_cms
DATABASE_USERNAME=groenland
DATABASE_PASSWORD=password
```

## Multi-Tenant Architecture

### Tenant Isolation
- Every entity has `tenant_id`
- Domain-based tenant resolution
- Row-level security in PostgreSQL
- Isolated search indices per tenant

### Portal Configuration
```typescript
// Each portal is a tenant with:
{
  domain: "badische-jobs.de",
  branding: { colors, logo, fonts },
  settings: { features, seo, analytics }
}
```

## Migration from Jobiqo

### Phase 1: badische-jobs.de (Q1 2026)
```bash
# Export Jobiqo data
pnpm migration:export --portal badische

# Import to Grönland
pnpm migration:import --portal badische --validate

# Parallel operation mode
pnpm migration:parallel --enable
```

### Data Mapping
- Jobs → jobs table (tenant-aware)
- Employers → employer_profiles
- Applications → applications + tracking
- Users → users + roles

## Key Features

### Phase 1 (Q1 2026) - Foundation
- ✅ Multi-tenant architecture
- ✅ Job posting & management
- ✅ Employer profiles
- ✅ Search (Elasticsearch/PostgreSQL FTS)
- ✅ SEO optimization
- ✅ Analytics tracking
- ✅ Migration tools

### Phase 2 (Q2 2026) - HR Core
- 🔄 Application Tracking System (ATS)
- 🔄 Candidate management
- 🔄 HR workflows

### Phase 3+ (2027) - Scale & Monetization
- 📋 Payment integration
- 📋 Self-service portal
- 📋 Portal factory
- 📋 Advanced HR services

## API Documentation

### Authentication
```bash
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/refresh
```

### Jobs
```bash
GET    /api/v1/jobs              # List jobs (tenant-filtered)
GET    /api/v1/jobs/:id          # Get job details
POST   /api/v1/jobs              # Create job (requires auth)
PUT    /api/v1/jobs/:id          # Update job
DELETE /api/v1/jobs/:id          # Delete job
```

### Employers
```bash
GET    /api/v1/employers
GET    /api/v1/employers/:id
POST   /api/v1/employers
PUT    /api/v1/employers/:id
```

## Testing

```bash
# Run all tests
pnpm test

# Backend unit tests
cd backend && pnpm test

# Frontend tests
cd frontend && pnpm test

# E2E tests
pnpm test:e2e

# Load testing
pnpm test:load
```

## Deployment

### Production Build
```bash
# Build all services
pnpm build

# Deploy to AWS
pnpm deploy:production
```

### AWS Infrastructure
- ECS/Fargate for containers
- RDS PostgreSQL (Multi-AZ)
- ElastiCache Redis
- CloudFront CDN
- Route53 DNS
- S3 for media storage

## Monitoring

- Application logs → CloudWatch
- Metrics → Prometheus + Grafana
- Error tracking → Sentry
- Uptime monitoring → Pingdom

## Security

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- SQL injection prevention (parameterized queries)
- XSS protection (CSP headers)
- Rate limiting (Redis)
- HTTPS only in production
- Tenant isolation at DB level

## Performance

- Response time < 200ms (p95)
- Database queries optimized with indices
- Redis caching for hot data
- CDN for static assets
- Image optimization (Next.js)
- Lazy loading & code splitting

## Support

For issues or questions:
- Technical: rehman.shoj@gmail.com
- Documentation: /docs
- Issue tracker: GitHub Issues

## License

Proprietary - Recruiting NOW GmbH
