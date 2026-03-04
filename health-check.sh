#!/bin/bash

# Promoteam Health Check Script

echo "🔍 Promoteam Health Check"
echo "========================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_service() {
    local service=$1
    local port=$2
    
    if docker-compose ps | grep -q "$service.*Up"; then
        echo -e "${GREEN}✅${NC} $service is running"
    else
        echo -e "${RED}❌${NC} $service is DOWN"
        return 1
    fi
}

check_port() {
    local service=$1
    local port=$2
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $service (port $port) is accessible"
    else
        echo -e "${RED}❌${NC} $service (port $port) is NOT accessible"
        return 1
    fi
}

echo ""
echo "Services status:"
check_service "mariadb" 3306
check_service "redis" 6379
check_service "backend" 5000
check_service "frontend" 5173
check_service "nginx" 80

echo ""
echo "Port accessibility:"
check_port "Database" 3306
check_port "Redis" 6379
check_port "Backend API" 5000
check_port "Frontend" 5173
check_port "Web (HTTP)" 80

echo ""
echo "API Health Check:"
if curl -s http://localhost:5000/health | grep -q "ok"; then
    echo -e "${GREEN}✅${NC} Backend API is healthy"
else
    echo -e "${RED}❌${NC} Backend API health check failed"
fi

echo ""
echo "Database Connection:"
if docker exec promoteam-db mysql -u promoteam -ppromoteam_pass -e "SELECT 1" promoteam >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Database connection OK"
else
    echo -e "${RED}❌${NC} Database connection FAILED"
fi

echo ""
echo "Disk Usage:"
docker exec promoteam-db du -sh /var/lib/mysql
du -sh uploads/ logs/ 2>/dev/null

echo ""
echo "Recent Errors:"
docker-compose logs --tail 5 | grep -i error || echo "No errors found"

echo ""
echo "✅ Health check complete"
