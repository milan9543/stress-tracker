# Docker Setup for Stress Tracker

This project uses Docker Compose to run the application with separate frontend and backend services.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Make sure ports 3000 and 8000 are available on your host

## Environment Configuration

The application uses the following environment files:

- `.env` - Used by Docker Compose for environment variables
- `backend/.env.production` - Backend-specific configuration for production

## Running the Application with Docker

1. Build and start the containers:

```bash
docker-compose up -d
```

2. Access the application:

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

3. View logs:

```bash
docker-compose logs -f
```

4. Stop the application:

```bash
docker-compose down
```

## Development vs Production

This setup is designed for production use. For development, you should run the frontend and backend separately using their respective development commands.

## Persistent Data

The SQLite database is stored in a Docker volume named `stress-tracker-data` to ensure data persistence between container restarts.
