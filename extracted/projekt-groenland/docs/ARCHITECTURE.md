# Architecture Documentation

## System Overview

Project Grönland is a multi-tenant job portal platform designed for:
- High scalability
- Clean tenant isolation
- Migration from legacy Jobiqo system
- Future extensibility

## Core Principles

### Multi-Tenancy
- Every entity has `tenant_id`
- Domain-based tenant resolution
- Database-level isolation
- No shared data between tenants

### Data Flow
```
User Request → Nginx → Frontend (Next.js) → Backend API → PostgreSQL
                                              ↓
                                          Redis Cache
```

### Key Components

**Backend (Node.js/Express)**
- RESTful API
- JWT authentication
- Tenant middleware
- Business logic layer

**Frontend (Next.js)**
- Server-side rendering
- Static generation for content
- Domain-based routing
- SEO optimization

**Database (PostgreSQL)**
- Row-level security
- Full-text search
- JSONB for flexible data
- Proper indexing

## Security

- JWT tokens (24h expiry)
- Refresh tokens (7d expiry)
- Rate limiting (100 req/15min)
- CORS protection
- SQL injection prevention
- XSS protection via CSP

## Performance Targets

- API response: <200ms (p95)
- Page load: <2s
- Database queries: <50ms
- Cache hit ratio: >80%

## Scalability

- Horizontal scaling via Docker
- Database connection pooling
- Redis caching layer
- CDN for static assets
