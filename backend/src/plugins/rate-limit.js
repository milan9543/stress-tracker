/**
 * Rate limiting plugin for Fastify
 *
 * This plugin implements rate limiting for stress level updates
 * and other endpoints that require throttling.
 */

const fp = require('fastify-plugin');
const config = require('../config');

/**
 * Simple in-memory storage for rate limiting
 * In a production environment with multiple instances,
 * this would need to be replaced with Redis or another shared cache
 */
const rateLimitStore = {
  // Map of user ID to timestamp of last stress update
  stressUpdates: new Map(),

  /**
   * Check if a user is rate limited for stress updates
   * @param {number} userId - User ID
   * @returns {Object} Rate limit status
   */
  checkStressRateLimit(userId) {
    const lastUpdate = this.stressUpdates.get(userId);
    const now = Date.now();

    // If no previous update or cooldown period has passed
    if (!lastUpdate || now - lastUpdate >= config.rateLimit.stressUpdate.timeWindow) {
      return {
        limited: false,
        remainingTime: 0,
      };
    }

    // User is rate limited, calculate remaining time
    const remainingTime = lastUpdate + config.rateLimit.stressUpdate.timeWindow - now;
    return {
      limited: true,
      remainingTime,
    };
  },

  /**
   * Record a stress update for rate limiting
   * @param {number} userId - User ID
   */
  recordStressUpdate(userId) {
    this.stressUpdates.set(userId, Date.now());
  },
};

/**
 * Rate limiting plugin for Fastify
 * @param {Object} fastify - Fastify instance
 * @param {Object} _options - Plugin options (unused)
 */
async function rateLimitPlugin(fastify, _options) {
  // Add rate limit store to fastify instance
  fastify.decorate('rateLimit', rateLimitStore);

  // Add a hook for stress update rate limiting
  fastify.addHook('preHandler', async (request, reply) => {
    // Only apply to stress update endpoints
    if (request.routerPath !== '/stress' || request.method !== 'POST') {
      return;
    }

    // Skip check if no authenticated user
    if (!request.user) {
      return;
    }

    // Check if user is rate limited
    const rateLimit = fastify.rateLimit.checkStressRateLimit(request.user.id);

    if (rateLimit.limited) {
      // Calculate remaining minutes and seconds for user-friendly message
      const remainingMinutes = Math.floor(rateLimit.remainingTime / 60000);
      const remainingSeconds = Math.floor((rateLimit.remainingTime % 60000) / 1000);

      return reply.code(429).send({
        error: 'Too Many Requests',
        message: `Please wait ${remainingMinutes}m ${remainingSeconds}s before submitting another stress update`,
        remainingTime: rateLimit.remainingTime,
      });
    }
  });
}

module.exports = fp(rateLimitPlugin, {
  name: 'rate-limit',
  dependencies: ['authentication'],
});
