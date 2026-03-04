#!/bin/bash

# Promoteam Development Setup

echo "🚀 Promoteam Development Setup"
echo "=============================="

# Create directories
mkdir -p uploads/{proofs,temp}
mkdir -p logs
mkdir -p database/backups
mkdir -p certbot/{conf,www}

# Copy env
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env from .env.example"
    echo "⚠️  Edit .env with your configuration"
fi

# Start containers
echo ""
echo "Starting Docker containers..."
docker-compose up -d

echo ""
echo "✅ Setup complete!"
echo ""
echo "Services:"
echo "  - Frontend:  http://localhost:5173"
echo "  - Backend:   http://localhost:5000"
echo "  - Database:  localhost:3306"
echo "  - Redis:     localhost:6379"
echo "  - Nginx:     http://localhost"
echo ""
echo "Admin credentials:"
echo "  - Email:    admin@promoteam.sauroraa.be"
echo "  - Password: admin123"
echo ""
echo "View logs: docker-compose logs -f"
