/**
 * WebSocket event handlers for Stress Tracker application
 *
 * This file contains functions for broadcasting different types of events
 * to connected WebSocket clients.
 */

/**
 * Broadcast a stress level update to all connected clients
 * @param {Object} fastify - Fastify instance
 * @param {Object} entry - Stress entry data
 * @param {Object} user - User data
 * @param {string} funnyMessage - Optional funny message from OpenAI
 */
function broadcastStressUpdate(fastify, entry, user, funnyMessage = null) {
  if (!fastify.ws) {
    fastify.log.warn('WebSocket plugin not available, skipping broadcast');
    return;
  }

  // Create message payload
  const message = {
    type: 'stress-update',
    data: {
      id: entry.id,
      userId: user.id,
      username: user.username,
      stressLevel: entry.stress_level,
      isSuperstress: entry.is_superstress === 1,
      timestamp: entry.created_at,
      funnyMessage: funnyMessage, // Add the funny message to the payload
    },
  };

  // Broadcast to all authenticated users except the sender
  fastify.ws.broadcastToAuthenticated(message, user.id);

  // Also broadcast to anonymous connections (summary page)
  fastify.ws.broadcastToAnonymous(message);

  // Log the broadcast
  fastify.log.debug(
    `Broadcast stress update: User ${user.username} (${user.id}), level: ${entry.stress_level}`
  );

  // Also broadcast updated summary data with the new average
  const summaryData = fastify.models.StressEntry.getSummaryData();
  broadcastSummaryUpdate(fastify, summaryData);
}

/**
 * Broadcast updated summary data to anonymous connections
 * @param {Object} fastify - Fastify instance
 * @param {Object} summary - Summary data
 */
function broadcastSummaryUpdate(fastify, summary) {
  if (!fastify.ws) {
    fastify.log.warn('WebSocket plugin not available, skipping summary broadcast');
    return;
  }

  // Create message payload
  const message = {
    type: 'summary-update',
    data: summary,
  };

  // Broadcast to anonymous connections
  fastify.ws.broadcastToAnonymous(message);

  // Log the broadcast
  fastify.log.debug('Broadcast summary update');
}

module.exports = {
  broadcastStressUpdate,
  broadcastSummaryUpdate,
};
