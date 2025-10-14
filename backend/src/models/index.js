/**
 * Models index file for Stress Tracker application
 *
 * Provides a unified interface for all database models.
 */

const UserModel = require('./user');
const SessionModel = require('./session');
const StressEntryModel = require('./stressEntry');

/**
 * Create models with the provided database connection
 * @param {Object} db - SQLite database instance
 * @returns {Object} Model instances
 */
function createModels(db) {
  return {
    User: UserModel(db),
    Session: SessionModel(db),
    StressEntry: StressEntryModel(db),
  };
}

module.exports = createModels;
