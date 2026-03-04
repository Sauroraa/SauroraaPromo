#!/bin/bash

# Promoteam Deployment Script for Production

set -e

echo "🚀 Promoteam Production Deployment"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DOMAIN="promoteam.sauroraa.be"
PROJECT_PATH="/opt/promoteam"
BACKUP_PATH="/backup/promoteam"

echo -e "${YELLOW}[1/6]${NC} Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker not found${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Docker Compose not found${NC}"; exit 1; }

echo -e "${YELLOW}[2/6]${NC} Creating backup..."
mkdir -p $BACKUP_PATH
docker exec promoteam-db mysqldump -u promoteam -p$MYSQL_PASSWORD promoteam | gzip > $BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S).sql.gz

echo -e "${YELLOW}[3/6]${NC} Pulling latest changes..."
cd $PROJECT_PATH
git pull origin main

echo -e "${YELLOW}[4/6]${NC} Building images..."
docker-compose build --no-cache

echo -e "${YELLOW}[5/6]${NC} Starting services..."
docker-compose up -d

echo -e "${YELLOW}[6/6]${NC} Verifying deployment..."
sleep 10

if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "Services running:"
    docker-compose ps
    echo ""
    echo "🌐 Access: https://$DOMAIN"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    docker-compose logs
    exit 1
fi
