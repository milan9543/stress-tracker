/**
 * WebSocket plugin for Fastify
 *
 * This plugin sets up WebSocket support for real-time updates in the Stress Tracker application.
 * It provides functionality for broadcasting stress level updates to connected clients.
 */

const fp = require('fastify-plugin');

/**
 * WebSocket plugin for Fastify
 * @param {Object} fastify - Fastify instance
 * @param {Object} _options - Plugin options (unused)
 */
async function websocketPlugin(fastify, _options) {
  // Register the WebSocket plugin
  await fastify.register(require('@fastify/websocket'), {
    options: {
      maxPayload: 1048576, // 1MB max payload
      clientTracking: true, // Keep track of connected clients
    },
  });

  // Create a map to store connected clients by user ID
  const connectedClients = new Map();

  // Keep track of anonymous connections for public summary page
  const anonymousConnections = new Set();

  // Decorate fastify instance with WebSocket utilities
  fastify.decorate('ws', {
    /**
     * Broadcast message to all authenticated clients except sender
     * @param {Object} message - Message to broadcast
     * @param {number} [excludeUserId] - User ID to exclude from broadcast (sender)
     */
    broadcastToAuthenticated: (message, excludeUserId) => {
      const messageStr = JSON.stringify(message);

      for (const [userId, connections] of connectedClients.entries()) {
        // Skip sender if excludeUserId is provided
        if (excludeUserId && userId === excludeUserId) continue;

        for (const connection of connections) {
          if (connection.socket.readyState === 1) {
            // 1 = OPEN
            connection.socket.send(messageStr);
          }
        }
      }
    },

    /**
     * Broadcast message to specific user's connections
     * @param {number} userId - User ID to broadcast to
     * @param {Object} message - Message to broadcast
     */
    sendToUser: (userId, message) => {
      const connections = connectedClients.get(userId);
      if (!connections) return;

      const messageStr = JSON.stringify(message);

      for (const connection of connections) {
        if (connection.socket.readyState === 1) {
          // 1 = OPEN
          connection.socket.send(messageStr);
        }
      }
    },

    /**
     * Broadcast message to anonymous connections (public summary)
     * @param {Object} message - Message to broadcast
     */
    broadcastToAnonymous: (message) => {
      const messageStr = JSON.stringify(message);

      // Log number of anonymous connections for debugging
      fastify.log.debug(`Broadcasting to ${anonymousConnections.size} anonymous connections`);

      for (const connection of anonymousConnections) {
        try {
          if (connection.socket.readyState === 1) {
            // 1 = OPEN
            connection.socket.send(messageStr);
          }
        } catch (err) {
          fastify.log.error(`Error sending to anonymous client: ${err.message}`);
          // Remove problematic connections
          anonymousConnections.delete(connection);
        }
      }
    },

    /**
     * Broadcast to all connections (authenticated and anonymous)
     * @param {Object} message - Message to broadcast
     */
    broadcastToAll: (message) => {
      const messageStr = JSON.stringify(message);

      // Broadcast to authenticated users
      for (const connections of connectedClients.values()) {
        for (const connection of connections) {
          if (connection.socket.readyState === 1) {
            // 1 = OPEN
            connection.socket.send(messageStr);
          }
        }
      }

      // Broadcast to anonymous connections
      for (const connection of anonymousConnections) {
        if (connection.socket.readyState === 1) {
          // 1 = OPEN
          connection.socket.send(messageStr);
        }
      }
    },

    /**
     * Register an authenticated client connection
     * @param {number} userId - User ID
     * @param {Object} connection - WebSocket connection
     */
    registerAuthenticatedClient: (userId, connection) => {
      if (!connectedClients.has(userId)) {
        connectedClients.set(userId, new Set());
      }
      connectedClients.get(userId).add(connection);

      // Clean up on connection close
      connection.socket.on('close', () => {
        const userConnections = connectedClients.get(userId);
        if (userConnections) {
          userConnections.delete(connection);
          if (userConnections.size === 0) {
            connectedClients.delete(userId);
          }
        }
      });
    },

    /**
     * Register an anonymous client connection
     * @param {Object} connection - WebSocket connection
     */
    registerAnonymousClient: (connection) => {
      anonymousConnections.add(connection);

      // Add a ping interval to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          if (connection.socket.readyState === 1) {
            // 1 = OPEN
            connection.socket.send(JSON.stringify({ type: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        } catch (err) {
          fastify.log.error(`Error pinging anonymous client: ${err.message}`);
          clearInterval(pingInterval);
          anonymousConnections.delete(connection);
        }
      }, 30000); // Ping every 30 seconds

      // Clean up on connection close
      connection.socket.on('close', () => {
        clearInterval(pingInterval);
        anonymousConnections.delete(connection);
        fastify.log.debug('Anonymous connection closed, removed from tracking');
      });

      // Handle errors on the connection
      connection.socket.on('error', (err) => {
        fastify.log.error(`Anonymous WebSocket error: ${err.message}`);
        clearInterval(pingInterval);
        anonymousConnections.delete(connection);
      });

      fastify.log.debug(`Anonymous client registered, total: ${anonymousConnections.size}`);
    },

    /**
     * Get count of connected clients
     * @returns {Object} Client counts
     */
    getConnectionStats: () => {
      let authenticatedCount = 0;
      for (const connections of connectedClients.values()) {
        authenticatedCount += connections.size;
      }

      return {
        authenticatedUsers: connectedClients.size,
        authenticatedConnections: authenticatedCount,
        anonymousConnections: anonymousConnections.size,
        total: authenticatedCount + anonymousConnections.size,
      };
    },
  });

  // Log connection stats periodically (every 5 minutes)
  const statsInterval = setInterval(() => {
    const stats = fastify.ws.getConnectionStats();
    // Use simple object directly since pino handles this well
    fastify.log.info({ stats }, 'WebSocket connections stats');
  }, 5 * 60 * 1000);

  // Clean up interval on server close
  fastify.addHook('onClose', async () => {
    clearInterval(statsInterval);
  });

  fastify.log.info('WebSocket plugin registered');
}

module.exports = fp(websocketPlugin, {
  name: 'fastify-websocket-plugin',
  dependencies: [],
});
