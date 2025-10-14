/**
 * Authentication plugin for Fastify
 *
 * This plugin handles user authentication, session management,
 * and security-related decorators and hooks.
 */

const fp = require('fastify-plugin');

/**
 * Authentication plugin for Fastify
 * @param {Object} fastify - Fastify instance
 * @param {Object} _options - Plugin options (unused)
 */
async function authPlugin(fastify, _options) {
  // Decorator to get the current user from the request
  fastify.decorateRequest('user', null);
  fastify.decorateRequest('session', null);

  // Decorator to check if request is authenticated
  fastify.decorateRequest('isAuthenticated', function () {
    return Boolean(this.user);
  });

  // Clean up expired sessions periodically
  const cleanupInterval = setInterval(() => {
    try {
      const result = fastify.models.Session.deleteExpired();
      if (result.changes > 0) {
        fastify.log.info(`Cleaned up ${result.changes} expired sessions`);
      }
    } catch (error) {
      fastify.log.error(`Error cleaning up sessions: ${error.message}`);
    }
  }, 60 * 60 * 1000); // Run every hour

  // Clean up on server shutdown
  fastify.addHook('onClose', (instance, done) => {
    clearInterval(cleanupInterval);
    done();
  });

  // Hook to extract user from session token in cookie
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      // Skip auth check for public routes
      if (isPublicRoute(request.routerPath)) {
        return;
      }

      // Get session token from cookie
      const token = request.cookies.session;

      if (!token) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Find session by token
      const session = fastify.models.Session.findByToken(token);

      if (!session) {
        // Clear invalid session cookie
        reply.clearCookie('session');
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired session',
        });
      }

      // Check if this session belongs to this IP address
      if (session.ip_address !== request.ip) {
        fastify.log.warn(`IP mismatch for session: ${session.ip_address} vs ${request.ip}`);

        // Enhance security by invalidating this session
        fastify.models.Session.deleteByToken(token);

        // Clear the cookie
        reply.clearCookie('session');

        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Session IP address mismatch',
        });
      }

      // Check if session has expired (should be caught by DB query, but double check)
      const now = new Date();
      const expiration = new Date(session.expires_at);
      if (now > expiration) {
        // Clean up expired session
        fastify.models.Session.deleteByToken(token);
        reply.clearCookie('session');

        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Session expired',
        });
      }

      // Find user
      const user = fastify.models.User.findById(session.user_id);

      if (!user) {
        reply.clearCookie('session');
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'User not found',
        });
      }

      // Add user and session to request
      request.user = user;
      request.session = session;
    } catch (error) {
      fastify.log.error(`Auth error: ${error.message}`);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Authentication error',
      });
    }
  });

  // Explicit authentication middleware for routes that need it
  fastify.decorate('requireAuth', async function (request, reply) {
    if (!request.user) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required for this endpoint',
      });
    }
  });

  // Utility to check if a route is public (no auth required)
  function isPublicRoute(path) {
    // If path is undefined, it's not a public route
    if (!path) return false;

    const publicRoutes = [
      '/', // Health check
      '/login', // Login endpoint
      '/summary', // Public summary endpoint
      '/ws/summary', // Public WebSocket summary endpoint
      '/docs', // API documentation
      '/docs/*', // API documentation assets
    ];

    return publicRoutes.some((route) => {
      if (route.endsWith('*')) {
        const prefix = route.slice(0, -1);
        return path.startsWith(prefix);
      }
      return path === route;
    });
  }
}

module.exports = fp(authPlugin, {
  name: 'authentication',
  dependencies: ['@fastify/cookie', 'fastify-sqlite-db'],
});
