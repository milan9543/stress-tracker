/**
 * WebSocket routes for Stress Tracker application
 *
 * This file defines WebSocket endpoints for real-time communication:
 * - /ws - Authenticated WebSocket endpoint for user-specific updates
 * - /ws/summary - Public WebSocket endpoint for real-time summary data
 */

/**
 * Register WebSocket routes
 * @param {Object} fastify - Fastify instance
 * @param {Object} _options - Plugin options (unused)
 */
async function websocketRoutes(fastify, _options) {
  // Authenticated WebSocket endpoint
  fastify.get('/ws', { websocket: true }, async (connection, request) => {
    try {
      // Check for authentication
      if (!request.user) {
        connection.socket.send(
          JSON.stringify({
            type: 'error',
            message: 'Authentication required',
          })
        );
        connection.socket.close();
        return;
      }

      // Register authenticated client
      fastify.ws.registerAuthenticatedClient(request.user.id, connection);

      // Send welcome message
      connection.socket.send(
        JSON.stringify({
          type: 'connected',
          message: `Welcome ${request.user.username}`,
          userId: request.user.id,
        })
      );

      // Handle incoming messages
      connection.socket.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());

          // Handle different message types
          switch (data.type) {
            case 'ping':
              connection.socket.send(JSON.stringify({ type: 'pong', time: Date.now() }));
              break;

            default:
              fastify.log.debug(`Unknown message type: ${data.type}`);
          }
        } catch (err) {
          fastify.log.error(`WebSocket message error: ${err.message}`);
        }
      });

      // Log connection
      fastify.log.info(`User ${request.user.id} (${request.user.username}) connected to WebSocket`);
    } catch (err) {
      fastify.log.error(`WebSocket error: ${err.message}`);
      connection.socket.close();
    }
  });

  // Public summary WebSocket endpoint (no authentication required)
  fastify.get('/ws/summary', { websocket: true }, async (connection, request) => {
    try {
      // Log client information for debugging
      fastify.log.debug(`New summary WebSocket connection from ${request.ip}`);

      // Register anonymous client
      fastify.ws.registerAnonymousClient(connection);

      // Send welcome message
      connection.socket.send(
        JSON.stringify({
          type: 'connected',
          message: 'Connected to stress summary feed',
        })
      );

      // Get and send initial summary data
      const summary = await getSummaryData(fastify);
      connection.socket.send(
        JSON.stringify({
          type: 'summary',
          data: summary,
        })
      );

      // Handle incoming messages (mostly for ping/pong)
      connection.socket.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());

          if (data.type === 'ping') {
            connection.socket.send(JSON.stringify({ type: 'pong', time: Date.now() }));
          }
        } catch (err) {
          fastify.log.error(`Summary WebSocket message error: ${err.message}`);
        }
      });

      // Log connection
      fastify.log.info('Anonymous client connected to summary WebSocket');
    } catch (err) {
      fastify.log.error(`Summary WebSocket error: ${err.message}`);
      connection.socket.close();
    }
  });
}

/**
 * Get summary data for all users' stress levels
 * @param {Object} fastify - Fastify instance
 * @returns {Object} Summary data
 */
async function getSummaryData(fastify) {
  try {
    // Use the StressEntry model to get summary data
    const summaryData = fastify.models.StressEntry.getSummaryData();
    return summaryData;
  } catch (err) {
    fastify.log.error(`Error getting summary data: ${err.message}`);
    return {
      error: 'Failed to get summary data',
      users: [],
      averageStressLevel: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

module.exports = websocketRoutes;
