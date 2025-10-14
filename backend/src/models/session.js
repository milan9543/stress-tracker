/**
 * Session model for Stress Tracker application
 *
 * Provides methods to manage user sessions in the database.
 */

const { nanoid } = require('nanoid');

/**
 * Calculate session expiration date
 * @param {number} days - Number of days until expiration
 * @returns {Date} Expiration date
 */
function getExpirationDate(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Session model with database operations
 * @param {Object} db - SQLite database instance
 * @returns {Object} Session model methods
 */
function SessionModel(db) {
  return {
    /**
     * Find session by token
     * @param {string} token - Session token
     * @returns {Object|null} Session object or null if not found
     */
    findByToken(token) {
      return db
        .prepare(
          `
        SELECT s.*, u.username 
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > datetime('now')
      `
        )
        .get(token);
    },

    /**
     * Find active session by IP address
     * @param {string} ipAddress - IP address to check
     * @returns {Object|null} Session object or null if not found
     */
    findByIpAddress(ipAddress) {
      return db
        .prepare(
          `
        SELECT s.*, u.username 
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.ip_address = ? AND s.expires_at > datetime('now')
      `
        )
        .get(ipAddress);
    },

    /**
     * Create a new session
     * @param {number} userId - User ID
     * @param {string} ipAddress - IP address
     * @param {number} expireDays - Days until session expires (default: 7)
     * @returns {Object} Created session with token
     */
    create(userId, ipAddress, expireDays = 7) {
      const token = nanoid(32);
      const expiresAt = getExpirationDate(expireDays).toISOString();

      const result = db
        .prepare(
          `
        INSERT INTO sessions (user_id, token, ip_address, expires_at) 
        VALUES (?, ?, ?, ?)
      `
        )
        .run(userId, token, ipAddress, expiresAt);

      return {
        id: result.lastInsertRowid,
        user_id: userId,
        token,
        ip_address: ipAddress,
        expires_at: expiresAt,
      };
    },

    /**
     * Delete a session by token
     * @param {string} token - Session token to delete
     * @returns {Object} Result of the delete operation
     */
    deleteByToken(token) {
      return db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    },

    /**
     * Delete all sessions for a user
     * @param {number} userId - User ID
     * @returns {Object} Result of the delete operation
     */
    deleteByUserId(userId) {
      return db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    },

    /**
     * Delete all sessions for an IP address
     * @param {string} ipAddress - IP address
     * @returns {Object} Result of the delete operation
     */
    deleteByIpAddress(ipAddress) {
      return db.prepare('DELETE FROM sessions WHERE ip_address = ?').run(ipAddress);
    },

    /**
     * Delete expired sessions
     * @returns {Object} Result of the delete operation
     */
    deleteExpired() {
      return db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
    },
  };
}

module.exports = SessionModel;
