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
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Final stage
FROM node:18-alpine
WORKDIR /app

# Copy backend from backend builder
COPY --from=backend-builder /app/backend /app/backend

# Copy frontend build artifacts from frontend builder
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Set working directory to backend
WORKDIR /app/backend

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose the API port
EXPOSE 8000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000
ENV DB_PATH=/app/data/stress-tracker.db

# Run the application
CMD ["node", "src/index.js"]