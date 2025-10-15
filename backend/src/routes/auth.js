/**
 * Authentication routes for Stress Tracker application
 */

/**
 * Registers authentication-related routes
 * @param {Object} fastify - Fastify instance
 * @param {Object} _options - Plugin options (unused)
 */
async function authRoutes(fastify, _options) {
  // Schema for login request validation
  const loginSchema = {
    body: {
      type: 'object',
      required: ['username'],
      properties: {
        username: {
          type: 'string',
          minLength: 1,
          maxLength: 50,
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              username: { type: 'string' },
              created_at: { type: 'string' },
            },
          },
          lastStressLevel: { type: 'number', nullable: true },
          nextStressUpdateAvailableInSeconds: { type: 'number' },
          nextSuperStressUpdateAvailableInSeconds: { type: 'number' },
        },
      },
      400: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  };

  // Login route - authenticates a user by username and creates a session
  fastify.post('/login', { schema: loginSchema }, async (request, reply) => {
    try {
      const { username } = request.body;
      const ipAddress = request.ip;
      let user;

      // Check if this IP is already associated with a different username
      try {
        // Find or create the user in the database
        user = fastify.models.User.findOrCreate(username, ipAddress);

        if (!user) {
          return reply.code(500).send({
            error: 'Server Error',
            message: 'Failed to create or find user',
          });
        }
      } catch (err) {
        // If IP is already used by a different username, return an error
        if (err.message.includes('already associated with a different username')) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'This IP address is already associated with a different username',
          });
        }
        // If username is already used by a different IP, return an error
        if (err.message.includes('already associated with a different IP address')) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'This username is already taken by someone else',
          });
        }
        // Re-throw for other errors
        throw err;
      }

      // Check if this IP already has an active session
      const existingSession = fastify.models.Session.findByIpAddress(request.ip);
      if (existingSession) {
        // If session exists for different user, delete it
        if (existingSession.user_id !== user.id) {
          fastify.models.Session.deleteByIpAddress(request.ip);
        } else {
          // Return the existing session for the same user
          reply.setCookie('session', existingSession.token, {
            path: '/',
            httpOnly: true,
            sameSite: 'none', // Allow cross-origin requests
            secure: false, // Allow non-secure requests for development
            maxAge: 7 * 24 * 60 * 60, // 7 days
          });

          // Check if user can submit stress entries and get remaining cooldown time
          const stressStatus = fastify.models.StressEntry.canSubmitStressEntry(user.id);

          // Check if user can submit superstress entries and get remaining cooldown time
          const superstressStatus = fastify.models.StressEntry.canSubmitSuperstress(user.id);

          // Calculate nextStressUpdateAvailableInSeconds
          const nextStressUpdateAvailableInSeconds = stressStatus.canSubmit
            ? 0
            : Math.ceil(stressStatus.timeRemaining / 1000);

          // Calculate nextSuperStressUpdateAvailableInSeconds
          const nextSuperStressUpdateAvailableInSeconds = superstressStatus.canSubmit
            ? 0
            : Math.ceil(superstressStatus.timeRemaining / 1000);

          // Get the user's latest stress level
          const latestStressEntry = fastify.models.StressEntry.findLatestByUserId(user.id);
          const lastStressLevel = latestStressEntry ? latestStressEntry.stress_level : null;

          return {
            user: {
              id: user.id,
              username: user.username,
              created_at: user.created_at,
            },
            lastStressLevel,
            nextStressUpdateAvailableInSeconds,
            nextSuperStressUpdateAvailableInSeconds,
          };
        }
      }

      // Create a new session for the user
      const session = fastify.models.Session.create(user.id, request.ip);

      // Set the session token as a cookie
      reply.setCookie('session', session.token, {
        path: '/',
        httpOnly: true,
        sameSite: 'none', // Allow cross-origin requests
        secure: false, // Allow non-secure requests for development
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      // Check if user can submit stress entries and get remaining cooldown time
      const stressStatus = fastify.models.StressEntry.canSubmitStressEntry(user.id);

      // Check if user can submit superstress entries and get remaining cooldown time
      const superstressStatus = fastify.models.StressEntry.canSubmitSuperstress(user.id);

      // Calculate nextStressUpdateAvailableInSeconds
      const nextStressUpdateAvailableInSeconds = stressStatus.canSubmit
        ? 0
        : Math.ceil(stressStatus.timeRemaining / 1000);

      // Calculate nextSuperStressUpdateAvailableInSeconds
      const nextSuperStressUpdateAvailableInSeconds = superstressStatus.canSubmit
        ? 0
        : Math.ceil(superstressStatus.timeRemaining / 1000);

      // Get the user's latest stress level
      const latestStressEntry = fastify.models.StressEntry.findLatestByUserId(user.id);
      const lastStressLevel = latestStressEntry ? latestStressEntry.stress_level : null;

      return {
        user: {
          id: user.id,
          username: user.username,
          created_at: user.created_at,
        },
        lastStressLevel,
        nextStressUpdateAvailableInSeconds,
        nextSuperStressUpdateAvailableInSeconds,
      };
    } catch (error) {
      fastify.log.error(`Login error: ${error.message}`);
      return reply.code(500).send({
        error: 'Server Error',
        message: 'Failed to process login',
      });
    }
  });

  // Get current user info - requires authentication
  fastify.get('/me', async (request, reply) => {
    // Authentication is handled by the preHandler hook in the auth plugin
    // If we get here, it means we have a valid authenticated user

    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Get timezone offset from query param if provided (in seconds)
    const timezoneOffsetSeconds = request.query.timezoneOffset
      ? parseInt(request.query.timezoneOffset)
      : 0;

    fastify.log.debug(`User timezone offset: ${timezoneOffsetSeconds} seconds`);

    // Check if user can submit stress entries and get remaining cooldown time
    const stressStatus = fastify.models.StressEntry.canSubmitStressEntry(request.user.id);

    // Check if user can submit superstress entries and get remaining cooldown time
    const superstressStatus = fastify.models.StressEntry.canSubmitSuperstress(request.user.id);

    // Calculate nextStressUpdateAvailableInSeconds
    const nextStressUpdateAvailableInSeconds = stressStatus.canSubmit
      ? 0
      : Math.ceil(stressStatus.timeRemaining / 1000);

    // Calculate nextSuperStressUpdateAvailableInSeconds
    const nextSuperStressUpdateAvailableInSeconds = superstressStatus.canSubmit
      ? 0
      : Math.ceil(superstressStatus.timeRemaining / 1000);

    // Get the user's latest stress level
    const latestStressEntry = fastify.models.StressEntry.findLatestByUserId(request.user.id);
    const lastStressLevel = latestStressEntry ? latestStressEntry.stress_level : null;

    return {
      user: {
        id: request.user.id,
        username: request.user.username,
        created_at: request.user.created_at,
      },
      lastStressLevel,
      nextStressUpdateAvailableInSeconds,
      nextSuperStressUpdateAvailableInSeconds,
      cooldownDurations: {
        superstress: fastify.config.cooldown.superstress,
        stressEntry: fastify.config.cooldown.stressEntry,
      },
    };
  });

  // Logout route - clears the session
  fastify.post('/logout', async (request, reply) => {
    try {
      // Get token from cookie
      const token = request.cookies.session;

      // Delete session if token exists
      if (token) {
        fastify.models.Session.deleteByToken(token);
      }

      // Clear session cookie
      reply.clearCookie('session', { path: '/' });

      return { success: true };
    } catch (error) {
      fastify.log.error(`Logout error: ${error.message}`);
      return reply.code(500).send({
        error: 'Server Error',
        message: 'Failed to process logout',
      });
    }
  });
}

module.exports = authRoutes;
