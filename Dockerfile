# Multi-stage build for the Stress Tracker application

# Build stage for frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

# Accept build arguments
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY frontend/ ./
RUN npm run build

# Build stage for backend
FROM node:18-alpine as backend-builder
WORKDIR /app/backend

# Install necessary build tools
RUN apk add --no-cache python3 make g++ sqlite-dev

COPY backend/package*.json ./
# Install dependencies with --build-from-source flag for better-sqlite3
RUN npm install --build-from-source
COPY backend/ ./

# Final stage
FROM node:18-alpine
WORKDIR /app

# Copy backend from backend builder
COPY --from=backend-builder /app/backend /app/backend

# Copy frontend build artifacts from frontend builder
COPY --from=frontend-builder /app/frontend/build /app/frontend/dist

# Set working directory to backend
WORKDIR /app/backend

# Install necessary build tools for native modules
RUN apk add --no-cache python3 make g++ sqlite-dev

# Rebuild better-sqlite3 for the current architecture
RUN npm rebuild better-sqlite3 --build-from-source

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose the API port
EXPOSE 8000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000
ENV DB_PATH=/app/data/stress-tracker.db
ENV LOG_LEVEL=info
ENV SESSION_SECRET=change-this-in-production
ENV SESSION_EXPIRY=86400000
ENV STRESS_COOLDOWN_MS=300000
ENV SUPERSTRESS_COOLDOWN_MS=10800000
# OpenAI API key should be set at runtime

# Run the application with single-line logging
CMD ["npm", "run", "start:prod"]