/**
 * Database connection module for Stress Tracker application
 *
 * This module provides a singleton instance of the SQLite database connection
 * and utility methods for database operations.
 */

const path = require('path');
const Database = require('better-sqlite3');
const { SCHEMA } = require('./schema');

// Path to SQLite database file (will be stored in a Docker volume)
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../..', 'data', 'stress-tracker.db');

// Database connection instance
let db = null;

/**
 * Initialize the database connection and create tables if they don't exist
 * @param {Object} fastify - The Fastify instance for logging (optional)
 * @returns {Database} The SQLite database instance
 */
function initDatabase(fastify) {
  try {
    // Create database connection with appropriate logging based on environment
    let logger = null;

    if (fastify) {
      // Use fastify logger if available
      logger = (msg) => fastify.log.debug(msg);
    } else if (process.env.NODE_ENV === 'development') {
      // Silence the logger in production when fastify isn't available
      logger = () => {};
    }

    db = new Database(DB_PATH, { verbose: logger });

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Execute schema to create tables
    db.exec(SCHEMA);

    if (fastify) {
      fastify.log.info(`Connected to SQLite database at ${DB_PATH}`);
    }
    return db;
  } catch (error) {
    if (fastify) {
      fastify.log.error(`Database initialization failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get the database connection instance
 * @returns {Database} The SQLite database instance
 */
function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Close the database connection
 * @param {Object} fastify - The Fastify instance for logging (optional)
 */
function closeDatabase(fastify) {
  if (db) {
    db.close();
    db = null;
    if (fastify) {
      fastify.log.info('Database connection closed');
    }
  }
}

// Clean up the database connection when the application exits
process.on('exit', () => {
  closeDatabase();
});

module.exports = {
  getDatabase,
  initDatabase,
  closeDatabase,
};
