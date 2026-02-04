#!/bin/bash
# Silverwind EC2 Deployment Script
# This script is executed on the EC2 instance to deploy new containers

set -e

echo "=========================================="
echo "Silverwind Deployment Script"
echo "=========================================="
echo "Timestamp: $(date)"
echo "Docker Registry: ${DOCKER_REGISTRY}"
echo "Image Tag: ${IMAGE_TAG:-latest}"
echo ""

# Configuration
COMPOSE_FILE="/home/ec2-user/silverwind/docker-compose.prod.yml"
ENV_FILE="/home/ec2-user/silverwind/.env"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: Environment file not found at $ENV_FILE"
    echo "Please create the .env file with required environment variables."
    exit 1
fi

# Source environment variables
set -a
source "$ENV_FILE"
set +a

# Export additional deployment variables
export IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "Step 1: Logging into Docker registry..."
if [ -n "$DOCKER_CREDENTIALS" ]; then
    echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" -u "$DOCKER_USERNAME" --password-stdin
fi

echo "Step 2: Pulling latest images..."
docker-compose -f "$COMPOSE_FILE" pull

echo "Step 3: Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down --remove-orphans || true

echo "Step 4: Starting new containers..."
docker-compose -f "$COMPOSE_FILE" up -d

echo "Step 5: Waiting for services to be healthy..."
sleep 10

# Health check
echo "Step 6: Checking service health..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null || echo "000")
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health 2>/dev/null || echo "000")

echo "Backend health: $BACKEND_HEALTH"
echo "Frontend health: $FRONTEND_HEALTH"

if [ "$BACKEND_HEALTH" = "200" ] && [ "$FRONTEND_HEALTH" = "200" ]; then
    echo ""
    echo "=========================================="
    echo "Deployment SUCCESSFUL!"
    echo "=========================================="
    echo "Backend: http://$(hostname):8080"
    echo "Frontend: http://$(hostname)"
else
    echo ""
    echo "=========================================="
    echo "Deployment WARNING: Health check failed"
    echo "=========================================="
    echo "Please check the container logs:"
    echo "  docker-compose -f $COMPOSE_FILE logs backend"
    echo "  docker-compose -f $COMPOSE_FILE logs frontend"
fi

# Cleanup old images
echo ""
echo "Step 7: Cleaning up old images..."
docker image prune -f

echo ""
echo "Deployment completed at $(date)"
