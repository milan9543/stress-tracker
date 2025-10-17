/**
 * Authentication routes for Stress Tracker application
 */

const { logAuthEvent, getRealClientIp } = require('../utils/logging');

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

      // Get the real client IP, not the Docker proxy IP
      const ipAddress = request.realIp || getRealClientIp(request);

      // Store it for future use
      request.realIp = ipAddress;

      // Log login attempt with real IP address
      logAuthEvent(fastify.log, 'login_attempt', { username }, ipAddress);

      let user;

      // Check if this IP is already associated with a different username
      try {
        // Find or create the user in the database
        user = fastify.models.User.findOrCreate(username, ipAddress);

        if (!user) {
          logAuthEvent(
            fastify.log,
            'login_failed',
            { username, reason: 'user_creation_failed' },
            ipAddress
          );
          return reply.code(500).send({
            error: 'Server Error',
            message: 'Failed to create or find user',
          });
        }
      } catch (err) {
        // If IP is already used by a different username, return an error
        if (err.message.includes('already associated with a different username')) {
          logAuthEvent(
            fastify.log,
            'login_failed',
            { username, reason: 'ip_already_associated' },
            ipAddress
          );
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'This IP address is already associated with a different username',
          });
        }
        // If username is already used by a different IP, return an error
        if (err.message.includes('already associated with a different IP address')) {
          logAuthEvent(
            fastify.log,
            'login_failed',
            { username, reason: 'username_already_taken' },
            ipAddress
          );
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
            sameSite: 'lax', // Use lax for better cross-origin compatibility
            secure: false, // Allow non-secure cookies for local development
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

      // Create a new session for the user with the real IP address
      const session = fastify.models.Session.create(user.id, ipAddress);

      // Log successful session creation with real IP
      logAuthEvent(
        fastify.log,
        'login_success',
        {
          userId: user.id,
          username: user.username,
          sessionId: session.id,
          realIp: ipAddress,
          rawIp: request.ip,
        },
        ipAddress
      );

      // Set the session token as a cookie
      reply.setCookie('session', session.token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax', // Use lax for better cross-origin compatibility
        secure: false, // Allow non-secure cookies for local development
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

    // Get the real client IP
    const realIp = request.realIp || getRealClientIp(request);

    if (!request.user) {
      // Log unauthorized access attempts with real IP
      logAuthEvent(fastify.log, 'unauthorized_access', { endpoint: '/me' }, realIp);
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Log successful /me request with user info and real IP
    logAuthEvent(
      fastify.log,
      'me_request',
      {
        userId: request.user.id,
        username: request.user.username,
        realIp,
        rawIp: request.ip,
      },
      realIp
    );

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

    // Get cooldown durations from config, with fallbacks
    const cooldownDurations = {
      superstress:
        (fastify.config && fastify.config.cooldown && fastify.config.cooldown.superstress) ||
        24 * 60 * 60 * 1000, // 24 hours fallback
      stressEntry:
        (fastify.config && fastify.config.cooldown && fastify.config.cooldown.stressEntry) ||
        5 * 60 * 1000, // 5 minutes fallback
    };

    fastify.log.debug(`Using cooldown durations: ${JSON.stringify(cooldownDurations)}`);

    return {
      user: {
        id: request.user.id,
        username: request.user.username,
        created_at: request.user.created_at,
      },
      lastStressLevel,
      nextStressUpdateAvailableInSeconds,
      nextSuperStressUpdateAvailableInSeconds,
      cooldownDurations,
    };
  });

  // Logout route - clears the session
  fastify.post('/logout', async (request, reply) => {
    // Get the real client IP
    request.realIp = request.realIp || getRealClientIp(request);
    const realClientIp = request.realIp;

    try {
      // Get token from cookie
      const token = request.cookies.session;

      // Log logout attempt with real IP
      logAuthEvent(
        fastify.log,
        'logout_attempt',
        {
          userId: request.user?.id,
          username: request.user?.username,
          hasToken: !!token,
          realIp: realClientIp,
          rawIp: request.ip,
        },
        realClientIp
      );

      // Delete session if token exists
      if (token) {
        fastify.models.Session.deleteByToken(token);
      }

      // Clear session cookie
      reply.clearCookie('session', { path: '/' });

      // Log successful logout with real IP
      logAuthEvent(fastify.log, 'logout_success', { realIp: realClientIp }, realClientIp);

      return { success: true };
    } catch (error) {
      // Log error with real IP address (we already have it from above)
      logAuthEvent(fastify.log, 'logout_error', { error: error.message }, realClientIp);
      fastify.log.error(`Logout error: ${error.message}`);
      return reply.code(500).send({
        error: 'Server Error',
        message: 'Failed to process logout',
      });
    }
  });
}

module.exports = authRoutes;
