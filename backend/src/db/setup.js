/**
 * Database initialization script for Stress Tracker application
 *
 * This script creates the necessary data directory and initializes the database.
 * It should be run when the application starts.
 */

const fs = require('fs');
const path = require('path');
const { initDatabase } = require('./index');

/**
 * Creates data directory if it doesn't exist and initializes the database
 * @param {Object} fastify - The Fastify instance for logging
 * @returns {Object} The initialized database instance
 */
function setupDatabase(fastify) {
  const dataDir = path.join(__dirname, '../..', 'data');

  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      fastify.log.info(`Created data directory at ${dataDir}`);
    } catch (error) {
      fastify.log.error(`Failed to create data directory: ${error.message}`);
      throw error;
    }
  }

  // Initialize database
  try {
    const db = initDatabase(fastify);
    fastify.log.info('Database initialized successfully');
    return db;
  } catch (error) {
    fastify.log.error(`Database initialization failed: ${error.message}`);
    throw error;
  }
}

module.exports = { setupDatabase };
