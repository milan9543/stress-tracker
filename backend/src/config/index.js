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
  },

  // CORS configuration
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
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
    prettyPrint: process.env.NODE_ENV !== 'production', // Controls whether to use pino-pretty or not
  },
};
