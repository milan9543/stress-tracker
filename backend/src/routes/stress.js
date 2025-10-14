/**
 * Stress tracking routes for Stress Tracker application
 */

/**
 * Registers stress-related routes
 * @param {Object} fastify - Fastify instance
 * @param {Object} _options - Plugin options (unused)
 */
async function stressRoutes(fastify, _options) {
  // Schema for recording stress level
  const stressSchema = {
    body: {
      type: 'object',
      required: ['level'],
      properties: {
        level: {
          type: 'number',
          minimum: 0,
          maximum: 200,
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          stress_level: { type: 'number' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      429: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          remainingTime: { type: 'number' },
        },
      },
    },
  };

  // Record stress level
  fastify.post('/', { schema: stressSchema }, async (request, reply) => {
    try {
      const { level } = request.body;
      const userId = request.user.id;

      // Check if the user can submit a stress entry based on cooldown
      const cooldownCheck = fastify.models.StressEntry.canSubmitStressEntry(userId);

      if (!cooldownCheck.canSubmit) {
        // Format remaining time message based on cooldownCheck.timeRemaining

        return reply.code(429).send({
          error: 'Rate Limited',
          message: `Please wait before submitting another stress entry`,
          remainingTime: cooldownCheck.timeRemaining,
          lastEntryAt: cooldownCheck.lastEntry.created_at,
        });
      }

      // Create new stress entry
      const entry = fastify.models.StressEntry.create(userId, level, false);

      // Broadcast stress update via WebSocket
      const { broadcastStressUpdate } = require('../ws/events');
      broadcastStressUpdate(fastify, entry, request.user);

      return entry;
    } catch (err) {
      request.log.error(`Error recording stress: ${err.message}`);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to record stress level',
      });
    }
  });

  // Record superstress (max stress level)
  fastify.post('/superstress', async (request, reply) => {
    try {
      const userId = request.user.id;

      // Check if the user can submit a superstress based on cooldown
      const cooldownCheck = fastify.models.StressEntry.canSubmitSuperstress(userId);

      if (!cooldownCheck.canSubmit) {
        // Calculate remaining time in a human-readable format
        const remainingMs = cooldownCheck.timeRemaining;
        const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
        const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

        let timeMessage = 'You can use superstress again in ';
        if (remainingHours > 0) {
          timeMessage += `${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
          if (remainingMinutes > 0) {
            timeMessage += ` and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
          }
        } else if (remainingMinutes > 0) {
          timeMessage += `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
        } else {
          timeMessage += 'less than a minute';
        }

        return reply.code(429).send({
          error: 'Rate Limited',
          message: timeMessage,
          remainingTime: remainingMs,
          lastUsed: cooldownCheck.lastEntry.created_at,
        });
      }

      // Create new superstress entry (max level = 200)
      const entry = fastify.models.StressEntry.create(userId, 200, true);

      // Broadcast stress update via WebSocket
      const { broadcastStressUpdate } = require('../ws/events');
      broadcastStressUpdate(fastify, entry, request.user);

      return entry;
    } catch (err) {
      request.log.error(`Error recording superstress: ${err.message}`);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to record superstress',
      });
    }
  });

  // Get stress history
  fastify.get('/history', async (request, reply) => {
    try {
      const userId = request.user.id;
      const limit = request.query.limit ? parseInt(request.query.limit, 10) : 100;

      // Get stress history for the user
      const history = fastify.models.StressEntry.getHistoryByUserId(userId, limit);

      return {
        history: history,
        count: history.length,
      };
    } catch (err) {
      request.log.error(`Error fetching stress history: ${err.message}`);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch stress history',
      });
    }
  });

  // Get average stress level
  fastify.get('/average', async (request, reply) => {
    try {
      const userId = request.user.id;
      const days = request.query.days ? parseInt(request.query.days, 10) : 30;

      // Get average stress level for the user
      const average = fastify.models.StressEntry.getAverageByUserId(userId, days);

      return {
        userId: userId,
        averageStressLevel: average,
        days: days,
      };
    } catch (err) {
      request.log.error(`Error calculating average stress: ${err.message}`);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to calculate average stress level',
      });
    }
  });
}

module.exports = stressRoutes;
