/**
 * Summary routes for Stress Tracker application
 *
 * This file defines the public summary endpoint that provides
 * an overview of all users' latest stress levels and average.
 */

/**
 * Register summary routes
 * @param {Object} fastify - Fastify instance
 * @param {Object} _options - Plugin options (unused)
 */
async function summaryRoutes(fastify, _options) {
  // Schema for summary response
  const summarySchema = {
    response: {
      200: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                userId: { type: 'number' },
                username: { type: 'string' },
                stressLevel: { type: 'number' },
                isSuperstress: { type: 'boolean' },
                lastUpdated: { type: 'string', format: 'date-time' },
              },
            },
          },
          averageStressLevel: { type: 'number' },
          lastUpdated: { type: 'string', format: 'date-time' },
        },
      },
    },
  };

  // Public summary endpoint - shows all users' latest stress levels and average
  fastify.get('/summary', { schema: summarySchema }, async (request, reply) => {
    try {
      // Get summary data from the StressEntry model
      const summaryData = fastify.models.StressEntry.getSummaryData();

      return summaryData;
    } catch (err) {
      request.log.error(`Error fetching summary data: ${err.message}`);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch summary data',
      });
    }
  });
}

module.exports = summaryRoutes;
