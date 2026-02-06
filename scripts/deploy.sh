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
DEPLOY_DIR="$(pwd)"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env"

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
if [[ "$DOCKER_REGISTRY" == *"amazonaws.com"* ]]; then
    # Extract region from registry URL (e.g., 123456789012.dkr.ecr.eu-north-1.amazonaws.com)
    ECR_REGION=$(echo "$DOCKER_REGISTRY" | cut -d'.' -f4)
    echo "Logging into AWS ECR in region $ECR_REGION..."
    aws ecr get-login-password --region "$ECR_REGION" | docker login --username AWS --password-stdin "$DOCKER_REGISTRY"
elif [ -n "$DOCKER_CREDENTIALS" ]; then
    echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" -u "$DOCKER_USERNAME" --password-stdin
fi

echo "Step 2: Pulling latest images..."
docker-compose -f "$COMPOSE_FILE" pull

echo "Step 3: Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down --remove-orphans || true

echo "Step 4: Starting new containers..."
docker-compose -f "$COMPOSE_FILE" up -d

echo "Step 5: Waiting for services to be healthy..."
# Retry loop: wait up to 120 seconds (24 retries * 5s)
for i in {1..24}; do
    BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' silverwind-backend 2>/dev/null || echo "not_found")
    FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' silverwind-frontend 2>/dev/null || echo "not_found")
    
    echo "Attempt $i/24 - Backend: $BACKEND_HEALTH, Frontend: $FRONTEND_HEALTH"
    
    if [ "$BACKEND_HEALTH" = "healthy" ] && [ "$FRONTEND_HEALTH" = "healthy" ]; then
        echo "All services are healthy!"
        break
    fi
    sleep 5
done

# Health check
echo "Step 6: Final service health check..."
BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' silverwind-backend 2>/dev/null || echo "not_found")
FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' silverwind-frontend 2>/dev/null || echo "not_found")

echo "Backend health: $BACKEND_HEALTH"
echo "Frontend health: $FRONTEND_HEALTH"

if [ "$BACKEND_HEALTH" = "healthy" ] && [ "$FRONTEND_HEALTH" = "healthy" ]; then
    echo ""
    echo "=========================================="
    echo "Deployment SUCCESSFUL!"
    echo "=========================================="
    echo "Backend: http://$(hostname):9090"
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
