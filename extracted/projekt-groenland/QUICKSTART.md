# Quick Start Guide - Project Grönland

## Prerequisites
- Docker & Docker Compose
- Node.js 20+
- PostgreSQL 15+

## 1. Clone & Install

```bash
cd projekt-groenland
npm install
```

## 2. Environment Setup

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your settings

# Frontend
cd ../frontend
cp .env.example .env.local
# Edit .env.local
```

## 3. Start Services

```bash
# From project root
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 4000
- Frontend on port 3000
- Nginx on port 80

## 4. Initialize Database

```bash
# Run migrations
cd database
psql $DATABASE_URL < migrations/001_initial_schema.sql
psql $DATABASE_URL < migrations/002_products_and_publishing.sql
```

## 5. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Health: http://localhost:4000/health

## 6. Development

```bash
# Backend (with hot reload)
cd backend && npm run dev

# Frontend (with hot reload)
cd frontend && npm run dev
```

## Next Steps

1. Review `/docs/ARCHITECTURE.md` for system design
2. Check `/docs/API.md` for API documentation
3. See `/docs/DEPLOYMENT.md` for production setup
4. Run tests: `npm test`

## Common Issues

**Port already in use:**
```bash
docker-compose down
# Change ports in docker-compose.yml
```

**Database connection failed:**
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running: `docker-compose ps`

**Frontend can't reach backend:**
- Verify NEXT_PUBLIC_API_URL in .env.local
- Check backend is running: `curl http://localhost:4000/health`
