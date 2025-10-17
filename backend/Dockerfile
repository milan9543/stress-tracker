# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install necessary build tools with specific versions for consistency
RUN apk add --no-cache python3 make g++ sqlite sqlite-dev build-base

# Copy package files
COPY package*.json ./

# Clean npm cache and install dependencies with explicit build flags for better-sqlite3
RUN npm cache clean --force && \
    npm install --build-from-source --sqlite=/usr/local

# Copy the rest of the application
COPY . ./

# Rebuild better-sqlite3 explicitly to ensure compatibility
RUN cd /app && \
    npm rebuild better-sqlite3 --build-from-source

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose the API port
EXPOSE 8000

# Run the application with single-line logging
CMD ["npm", "run", "start:prod"]