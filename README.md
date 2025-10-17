# Stress Tracker

A real-time web application that allows users to track and share their stress levels. The application enables users to record their stress levels on a scale of 0-200, view historical data, and receive live updates when other users update their stress levels.

## Features

- **Simple Authentication**: Username-only login system with one active session per IP
- **Stress Recording**: Track stress levels (0-200) with a 5-minute cooldown between updates
- **Superstress Button**: Record maximum stress level (200) once per day
- **Historical Data**: View your stress levels over time as a line graph
- **Real-time Updates**: See live updates when any user records their stress level
- **Public Summary**: View all users' latest stress levels and overall average stress

## Tech Stack

| Layer         | Technology                           | Notes                                            |
| ------------- | ------------------------------------ | ------------------------------------------------ |
| **Backend**   | Node.js + Fastify                    | Handles API, auth, rate limits                   |
| **Database**  | SQLite                               | Local embedded DB (via `better-sqlite3`)         |
| **Frontend**  | React + Vite + Tailwind CSS          | Modern lightweight SPA                           |
| **Charting**  | Chart.js (`react-chartjs-2`)         | Displays stress over time                        |
| **Real-time** | WebSocket (via `@fastify/websocket`) | Provides live updates of stress levels           |
| **Container** | Docker + Nginx                       | Separate containers for frontend and backend     |
| **Logging**   | Pino + pino-pretty                   | Single-line, structured logging with IP tracking |

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development)

### Running with Docker

1. Clone this repository
2. Set up the environment file:

```bash
cp .env.template .env
```

3. Edit the `.env` file to update environment variables, especially:

   - `SESSION_SECRET`: Change to a secure random string
   - `OPENAI_API_KEY`: Add your OpenAI API key
   - `FRONTEND_URL`: Update if needed
   - `VITE_API_URL`: Set to match your host/domain

4. Build and start the application using the host network mode:

```bash
docker-compose up --build
```

If you encounter architecture-related errors (especially on ARM-based Macs like M1/M2/M3):

```bash
# For Docker Compose V2
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker compose up --build

# For Docker Compose V1
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker-compose up --build
```

5. Access the application at http://localhost:8000

### Development Setup

#### Backend

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The backend will be available at http://localhost:3000

#### Frontend

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Access the frontend at http://localhost:5173

## API Endpoints

### Authentication

- `POST /login` - User login
- `GET /me` - Get current user info
- `POST /logout` - User logout

### Stress Management

- `POST /stress` - Record stress level (with 5-minute rate limiting)
- `POST /stress/superstress` - Record superstress (with daily limit)
- `GET /stress/history` - Get stress history data
- `GET /stress/average` - Get average stress level
- `GET /summary` - Public endpoint showing all users' latest stress levels and average

### WebSockets

- `/ws` - Authenticated WebSocket endpoint for real-time updates
- `/ws/summary` - Public WebSocket endpoint for summary updates

## Testing

Various test scripts are available in the backend directory:

- `test-auth.js` - Test authentication functionality
- `test-cooldown.js` - Test rate limiting cooldown
- `test-ip-username.js` - Test IP-username associations
- `test-websocket.js` - Test WebSocket functionality

## Deployment

The application is containerized using Docker and can be deployed to any environment that supports Docker containers. The Docker setup includes:

- Multi-stage builds for optimized image sizes
- Separate containers for frontend and backend
- Volume for SQLite database persistence
- Health check for container monitoring
- Nginx proxy for frontend with proper IP forwarding
- Trusted proxy configuration for accurate client IP detection

### Client IP Detection in Docker

The application correctly tracks client IP addresses even in a containerized environment by:

1. Using host network mode for containers to access the host's network directly
2. Setting `trustProxy: true` in Fastify configuration
3. Configuring Nginx to forward client IPs via X-Forwarded-For headers
4. Using intelligent IP detection that prioritizes real client IPs over Docker's internal network IPs
5. Logging both the detected real IP and the raw IP for troubleshooting

The host network mode ensures that containers receive the actual client IPs instead of Docker's internal network addresses, which is crucial for the authentication system which associates usernames with IP addresses.

## License

This project is licensed under the MIT License.
