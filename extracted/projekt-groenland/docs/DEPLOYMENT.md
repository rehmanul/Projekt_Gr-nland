# Deployment Guide

## Local Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Production Deployment

### Prerequisites
- AWS account
- Docker installed
- Terraform (for infrastructure)

### Steps

1. **Configure environment**
```bash
cp .env.example .env
# Edit .env with production values
```

2. **Build images**
```bash
docker-compose -f docker-compose.prod.yml build
```

3. **Run migrations**
```bash
docker-compose -f docker-compose.prod.yml run backend npm run migrate
```

4. **Deploy**
```bash
./scripts/deployment/deploy.sh
```

### AWS Infrastructure

- **ECS/Fargate**: Container orchestration
- **RDS PostgreSQL**: Multi-AZ database
- **ElastiCache**: Redis cluster
- **CloudFront**: CDN
- **Route53**: DNS management
- **S3**: Media storage

### Monitoring

- CloudWatch Logs
- Application metrics
- Error tracking (Sentry)
- Uptime monitoring

### Rollback Procedure

```bash
# Rollback to previous version
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```
