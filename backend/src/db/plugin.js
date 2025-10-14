/**
 * Fastify plugin to register the database connection with Fastify
 */

const fp = require('fastify-plugin');
const { setupDatabase } = require('./setup');
const { closeDatabase } = require('./index');
const createModels = require('../models');

/**
 * Plugin that adds database support to Fastify
 * @param {Object} fastify - Fastify instance
 * @param {Object} _options - Plugin options (unused)
 */
async function dbPlugin(fastify, _options) {
  try {
    // Initialize the database
    const db = setupDatabase(fastify);

    // Create models
    const models = createModels(db);

    // Decorate Fastify instance with database connection and models
    fastify.decorate('db', db);
    fastify.decorate('models', models);

    // Clean up expired sessions on startup
    if (models.Session.deleteExpired) {
      const result = models.Session.deleteExpired();
      fastify.log.info(`Cleaned up ${result.changes} expired sessions`);
    }

    // Add a hook to close the database connection when the server closes
    fastify.addHook('onClose', async (instance) => {
      closeDatabase(instance);
    });

    fastify.log.info('Database plugin registered successfully');
  } catch (error) {
    fastify.log.error(`Failed to register database plugin: ${error.message}`);
    throw error;
  }
}

module.exports = fp(dbPlugin, {
  name: 'fastify-sqlite-db',
  dependencies: [],
});
