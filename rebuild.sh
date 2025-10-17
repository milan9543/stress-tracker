#!/bin/bash

# Stop existing containers
echo "Stopping existing containers..."
docker compose down

# Remove node_modules from backend to ensure clean build
echo "Removing node_modules..."
rm -rf backend/node_modules

# Rebuild the containers with no cache to ensure clean build
echo "Rebuilding containers..."
docker compose build --no-cache

# Start the containers
echo "Starting containers..."
docker compose up -d

# Show logs
echo "Showing logs..."
docker compose logs -f