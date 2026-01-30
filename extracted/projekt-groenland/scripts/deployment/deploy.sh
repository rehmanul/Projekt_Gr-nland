#!/bin/bash

set -e

echo "Starting production deployment..."

# Build Docker images
echo "Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# Run database migrations
echo "Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend npm run migrate

# Deploy to production
echo "Deploying services..."
docker-compose -f docker-compose.prod.yml up -d

echo "Deployment completed successfully"
