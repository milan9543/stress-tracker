/**
 * Server configuration for the Stress Tracker application
 *
 * This file centralizes configuration settings used throughout the application.
 * Values are read from environment variables with sensible defaults.
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 8000,
    host: process.env.HOST || '0.0.0.0',
    trustProxy: process.env.TRUST_PROXY === 'true' || true,
  },

  // CORS configuration
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests, or WebSockets)
      if (!origin) return callback(null, true);

      // Define allowed origins (from env var or defaults)
      const allowedOrigins = process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',')
        : [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:8000',
            'http://kod-mac:3000',
            'http://kod-mac:5173',
            'http://kod-mac:8000',
          ];

      // Log the origin for debugging
      // Use fastify.log instead of console.log in the actual routes
      // This will be properly logged by the configured pino logger

      // Always allow WebSocket connections
      if (origin && (origin.startsWith('ws://') || origin.startsWith('wss://'))) {
        callback(null, true);
        return;
      }

      // In development, allow any origin for easier debugging
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
        return;
      }

      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },

  // Cookie configuration
  cookie: {
    secret: process.env.COOKIE_SECRET || 'stress-tracker-secret-key-change-in-production',
    session: {
      cookieName: 'session',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    },
  },

  // Rate limiting configuration
  rateLimit: {
    stressUpdate: {
      timeWindow: 5 * 60 * 1000, // 5 minutes in milliseconds
      maxRequests: 1,
    },
    superstress: {
      // Rate limiting for superstress is handled at the application level
      // (once per day, checked in the database)
    },
  },

  // Cooldown configuration
  cooldown: {
    stressEntry: parseInt(process.env.STRESS_COOLDOWN_MS) || 5 * 60 * 1000, // 5 minutes in milliseconds
    superstress: parseInt(process.env.SUPERSTRESS_COOLDOWN_MS) || 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },

  // Database configuration
  database: {
    path: process.env.DB_PATH || './data/stress-tracker.db',
  },

  // Logging configuration
  logger: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    prettyPrint: false, // Always use compact, single-line logs
    serializers: {
      // Add custom serializers to prevent large objects from expanding into multi-line logs
      err: (err) => ({
        type: err.type,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
      }),
      // The req serializer will be set in the index.js file using our custom requestSerializer
      // This ensures we always include IP address in the logs
    },
  },
};
