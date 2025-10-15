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
  // Register all API routes under /api prefix
  fastify.register(
    async function apiRoutes(fastify, _options) {
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
    },
    { prefix: '/api' }
  );

  // WebSocket routes - also under /api prefix
  fastify.register(require('./ws'), { prefix: '/api' });
}

module.exports = routes;
