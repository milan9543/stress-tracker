/**
 * Routes index file for Stress Tracker application
 *
 * This file registers all API routes with the Fastify instance.
 */

/**
 * Register all routes with the Fastify instance
 * @param {Object} fastify - Fastify instance
 * @param {Object} _options - Plugin options (unused)
 */
async function routes(fastify, _options) {
  // Health check route
  fastify.get('/', async (_request, _reply) => {
    return {
      status: 'ok',
      message: 'Stress Tracker API is running',
      version: '1.0.0',
    };
  });

  // Auth routes
  fastify.register(require('./auth'), { prefix: '' });

  // Stress routes
  fastify.register(require('./stress'), { prefix: '/stress' });

  // Summary routes
  fastify.register(require('./summary'));

  // WebSocket routes
  fastify.register(require('./ws'));
}

module.exports = routes;
