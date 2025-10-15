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
          maximum: 100, // Regular stress level capped at 100
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
          funnyMessage: { type: 'string' },
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

  // Import OpenAI service
  const { generateFunnyMessage } = require('../services/openai');

  // Record stress level
  fastify.post('/', { schema: stressSchema }, async (request, reply) => {
    try {
      let { level } = request.body;
      const userId = request.user.id;

      // Validate and process stress level
      // Round non-integer values
      level = Math.round(level);

      // Validate range for regular stress (0-100)
      if (!Number.isFinite(level)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Stress level must be a number',
        });
      }

      if (level < 0) {
        level = 0;
      } else if (level > 100) {
        return reply.code(400).send({
          error: 'Bad Request',
          message:
            'Regular stress level must be between 0 and 100. Use superstress for higher values.',
        });
      }

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

      // Generate a funny message based on stress level
      let funnyMessage;
      try {
        funnyMessage = await generateFunnyMessage(level, false, request.user.username);
      } catch (err) {
        request.log.error(`Error generating OpenAI response: ${err.message}`);
        funnyMessage =
          'Feeling stressed? Unfortunately, our AI comedian is also having a tough day. Try again later!';
      }

      // Broadcast stress update via WebSocket
      const { broadcastStressUpdate } = require('../ws/events');
      broadcastStressUpdate(fastify, entry, request.user, funnyMessage);

      // Include funny message in the response
      return {
        ...entry,
        funnyMessage,
      };
    } catch (err) {
      request.log.error(`Error recording stress: ${err.message}`);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to record stress level',
      });
    }
  });

  // Schema for recording superstress level
  const superstressSchema = {
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          stress_level: { type: 'number' },
          created_at: { type: 'string', format: 'date-time' },
          funnyMessage: { type: 'string' },
        },
      },
      429: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          remainingTime: { type: 'number' },
          lastUsed: { type: 'string', format: 'date-time' },
        },
      },
    },
  };

  // Record superstress (max stress level)
  fastify.post('/superstress', { schema: superstressSchema }, async (request, reply) => {
    try {
      const userId = request.user.id;

      // For superstress, the level is always exactly 200
      const superstressLevel = 200;

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

      // Create new superstress entry (always level = 200)
      const entry = fastify.models.StressEntry.create(userId, superstressLevel, true);

      // Generate a funny message based on superstress
      let funnyMessage;
      try {
        funnyMessage = await generateFunnyMessage(superstressLevel, true, request.user.username);
      } catch (err) {
        request.log.error(`Error generating OpenAI response for superstress: ${err.message}`);
        funnyMessage = 'SUPERSTRESS DETECTED! Maybe try some yoga...or screaming into a pillow?';
      }

      // Broadcast stress update via WebSocket
      const { broadcastStressUpdate } = require('../ws/events');
      broadcastStressUpdate(fastify, entry, request.user, funnyMessage);

      // Include funny message in the response
      return {
        ...entry,
        funnyMessage,
      };
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
