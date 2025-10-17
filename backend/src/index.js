/**
 * Main entry point for Stress Tracker backend application
 *
 * This file initializes the Fastify server with all plugins and routes.
 */

// Load environment variables based on NODE_ENV
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
});

const config = require('./config');
const { requestSerializer, setupRequestLogging } = require('./utils/logging');

// Create Fastify instance with logging configuration
const fastify = require('fastify')({
  // Tell Fastify to trust the proxy headers (for Docker environment)
  trustProxy: config.server.trustProxy,

  logger: {
    level: config.logger.level,
    serializers: {
      ...config.logger.serializers,
      // Add our custom request serializer that includes IP address
      req: requestSerializer,
    },
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        singleLine: true,
        minimumLevel: config.logger.level,
        errorLikeObjectKeys: ['err', 'error'],
      },
    },
  },
});

// Register all plugins
fastify.register(require('./plugins'));

// Register all routes
fastify.register(require('./routes'));

// Setup request logging with IP address
setupRequestLogging(fastify);

// Start the server
const start = async () => {
  try {
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });
    fastify.log.info(`Server listening on ${config.server.host}:${config.server.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGINT', async () => {
  fastify.log.info('SIGINT received, shutting down gracefully');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('SIGTERM received, shutting down gracefully');
  await fastify.close();
  process.exit(0);
});

// Start the server
start();
