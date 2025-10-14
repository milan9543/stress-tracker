/**
 * User model for Stress Tracker application
 *
 * Provides methods to manage user data in the database.
 * Users are uniquely identified by their username and associated with their IP address.
 */

/**
 * User model with database operations
 * @param {Object} db - SQLite database instance
 * @returns {Object} User model methods
 */
function UserModel(db) {
  return {
    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Object|null} User object or null if not found
     */
    findById(id) {
      return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    },

    /**
     * Find user by username
     * @param {string} username - Username to search for
     * @returns {Object|null} User object or null if not found
     */
    findByUsername(username) {
      return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    },

    /**
     * Find user by IP address
     * @param {string} ipAddress - IP address to search for
     * @returns {Object|null} User object or null if not found
     */
    findByIpAddress(ipAddress) {
      return db.prepare('SELECT * FROM users WHERE ip_address = ?').get(ipAddress);
    },

    /**
     * Create a new user
     * @param {string} username - Username for the new user
     * @param {string} ipAddress - IP address of the user
     * @returns {Object} Created user object with ID
     */
    create(username, ipAddress) {
      const result = db
        .prepare('INSERT INTO users (username, ip_address) VALUES (?, ?)')
        .run(username, ipAddress);
      return this.findById(result.lastInsertRowid);
    },

    /**
     * Update user's IP address
     * @param {number} userId - User ID
     * @param {string} ipAddress - IP address to update
     * @returns {Object} Result of the update operation
     */
    updateIpAddress(userId, ipAddress) {
      return db.prepare('UPDATE users SET ip_address = ? WHERE id = ?').run(ipAddress, userId);
    },

    /**
     * Get user by username, creating if it doesn't exist
     * @param {string} username - Username to find or create
     * @param {string} ipAddress - IP address of the user
     * @returns {Object} User object
     * @throws {Error} When IP is already associated with a different username or username is associated with a different IP
     */
    findOrCreate(username, ipAddress) {
      // Check if IP address is already used by a different user
      const existingUserByIp = this.findByIpAddress(ipAddress);
      if (existingUserByIp && existingUserByIp.username !== username) {
        throw new Error(`IP address ${ipAddress} is already associated with a different username`);
      }

      let user = this.findByUsername(username);
      if (!user) {
        user = this.create(username, ipAddress);
      } else if (user.ip_address !== ipAddress) {
        // If this username is already associated with a different IP address, don't allow login
        throw new Error(`Username '${username}' is already associated with a different IP address`);
      }
      return user;
    },
  };
}

module.exports = UserModel;
