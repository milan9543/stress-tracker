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

// Create Fastify instance with logging configuration
const fastify = require('fastify')({
  logger: {
    level: config.logger.level,
    transport: config.logger.prettyPrint
      ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  },
});

// Register all plugins
fastify.register(require('./plugins'));

// Register all routes
fastify.register(require('./routes'));

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
