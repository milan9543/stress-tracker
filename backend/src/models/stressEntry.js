/**
 * Stress entry model for Stress Tracker application
 *
 * Provides methods to manage user stress entries in the database.
 */

// Import config for cooldown settings
const config = require('../config');

/**
 * Stress Entry model with database operations
 * @param {Object} db - SQLite database instance
 * @returns {Object} Stress Entry model methods
 */
function StressEntryModel(db) {
  return {
    /**
     * Find stress entry by ID
     * @param {number} id - Entry ID
     * @returns {Object|null} Stress entry object or null if not found
     */
    findById(id) {
      return db.prepare('SELECT * FROM stress_entries WHERE id = ?').get(id);
    },

    /**
     * Get latest stress entry for a user
     * @param {number} userId - User ID
     * @returns {Object|null} Latest stress entry or null if none exists
     */
    findLatestByUserId(userId) {
      return db
        .prepare(
          `
        SELECT * FROM stress_entries 
        WHERE user_id = ? 
        ORDER BY created_at DESC LIMIT 1
      `
        )
        .get(userId);
    },

    /**
     * Get stress history for a user
     * @param {number} userId - User ID
     * @param {number} limit - Maximum number of entries to return (default: 100)
     * @returns {Array} Array of stress entries
     */
    getHistoryByUserId(userId, limit = 100) {
      return db
        .prepare(
          `
        SELECT * FROM stress_entries 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `
        )
        .all(userId, limit);
    },

    /**
     * Get average stress level for a user
     * @param {number} userId - User ID
     * @param {number} days - Number of days to include (default: 30)
     * @returns {number} Average stress level or 0 if no entries
     */
    getAverageByUserId(userId, days = 30) {
      const result = db
        .prepare(
          `
        SELECT AVG(stress_level) as average 
        FROM stress_entries 
        WHERE user_id = ? 
        AND created_at >= datetime('now', ?) 
      `
        )
        .get(userId, `-${days} days`);

      return result.average || 0;
    },

    /**
     * Create a new stress entry
     * @param {number} userId - User ID
     * @param {number} stressLevel - Stress level (0-200)
     * @param {boolean} isSuperstress - Whether this is a superstress entry
     * @returns {Object} Created stress entry
     */
    create(userId, stressLevel, isSuperstress = false) {
      // Ensure stress level is within valid range
      const validStressLevel = Math.max(0, Math.min(200, stressLevel));

      const result = db
        .prepare(
          `
        INSERT INTO stress_entries (user_id, stress_level, is_superstress)
        VALUES (?, ?, ?)
      `
        )
        .run(userId, validStressLevel, isSuperstress ? 1 : 0);

      return this.findById(result.lastInsertRowid);
    },

    /**
     * Check if a user can submit a stress entry based on configured cooldown period
     * @param {number} userId - User ID
     * @returns {Object} Object with canSubmit boolean and timeRemaining in milliseconds if cooldown active
     */
    canSubmitStressEntry(userId) {
      // Get the cooldown period in milliseconds from config
      const cooldownMs = config.cooldown.stressEntry;

      // Use direct SQL query with the database's datetime functions
      // This avoids timezone issues by doing the date comparison directly in SQLite
      const result = db
        .prepare(
          `
        SELECT 
          id,
          created_at,
          (CAST(strftime('%s', 'now') AS INTEGER) - CAST(strftime('%s', created_at) AS INTEGER)) * 1000 as elapsed_ms
        FROM stress_entries 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `
        )
        .get(userId);

      // If no entries found, user can submit
      if (!result) {
        return { canSubmit: true, timeRemaining: 0 };
      }

      // Use the elapsed time calculated by SQLite
      const elapsedMs = result.elapsed_ms;

      // Check if cooldown period has passed
      if (elapsedMs >= cooldownMs) {
        return { canSubmit: true, timeRemaining: 0 };
      } else {
        // Get the complete entry to include in response
        const latestEntry = this.findById(result.id);

        // Return remaining time in milliseconds
        return {
          canSubmit: false,
          timeRemaining: cooldownMs - elapsedMs,
          lastEntry: latestEntry,
        };
      }
    },

    /**
     * Check if a user can submit a superstress entry based on configured cooldown period
     * @param {number} userId - User ID
     * @returns {Object} Object with canSubmit boolean and timeRemaining in milliseconds if cooldown active
     */
    canSubmitSuperstress(userId) {
      // Get the cooldown period in milliseconds from config
      const cooldownMs = config.cooldown.superstress;

      // Use direct SQL query with the database's datetime functions
      // This avoids timezone issues by doing the date comparison directly in SQLite
      const result = db
        .prepare(
          `
        SELECT 
          id,
          created_at,
          (CAST(strftime('%s', 'now') AS INTEGER) - CAST(strftime('%s', created_at) AS INTEGER)) * 1000 as elapsed_ms
        FROM stress_entries 
        WHERE user_id = ? 
        AND is_superstress = 1
        ORDER BY created_at DESC 
        LIMIT 1
      `
        )
        .get(userId);

      // If no entries found, user can submit
      if (!result) {
        return { canSubmit: true, timeRemaining: 0 };
      }

      // Use the elapsed time calculated by SQLite
      const elapsedMs = result.elapsed_ms;

      // Check if cooldown period has passed
      if (elapsedMs >= cooldownMs) {
        return { canSubmit: true, timeRemaining: 0 };
      } else {
        // Get the complete entry to include in response
        const lastSuperstress = this.findById(result.id);

        // Return remaining time in milliseconds
        return {
          canSubmit: false,
          timeRemaining: cooldownMs - elapsedMs,
          lastEntry: lastSuperstress,
        };
      }
    },

    /**
     * Get last superstress entry time for a user
     * @param {number} userId - User ID
     * @returns {Object|null} The last superstress entry or null if none exists
     */
    getLastSuperstress(userId) {
      return db
        .prepare(
          `
        SELECT * FROM stress_entries 
        WHERE user_id = ? 
        AND is_superstress = 1 
        ORDER BY created_at DESC LIMIT 1
      `
        )
        .get(userId);
    },

    /**
     * Find latest superstress entry for a user
     * @param {number} userId - User ID
     * @returns {Object|null} Latest superstress entry or null if none exists
     */
    findLatestSuperstressByUserId(userId) {
      return db
        .prepare(
          `
        SELECT * FROM stress_entries 
        WHERE user_id = ? 
        AND is_superstress = 1 
        ORDER BY created_at DESC LIMIT 1
      `
        )
        .get(userId);
    },

    /**
     * Get overall average stress level across all users
     * @param {number} days - Number of days to include (default: 1)
     * @returns {number} Average stress level or 0 if no entries
     */
    getOverallAverage(days = 1) {
      const result = db
        .prepare(
          `
        SELECT AVG(stress_level) as average 
        FROM stress_entries 
        WHERE created_at >= datetime('now', ?)
      `
        )
        .get(`-${days} days`);

      return result.average || 0;
    },

    /**
     * Get summary data for all users' stress levels
     * @returns {Object} Summary data with latest stress levels and overall average
     */
    getSummaryData() {
      // Get latest stress entry for each user
      const latestEntries = db
        .prepare(
          `
        SELECT se.id, se.user_id, u.username, se.stress_level, se.is_superstress, se.created_at
        FROM stress_entries se
        JOIN users u ON se.user_id = u.id
        JOIN (
          SELECT user_id, MAX(created_at) as max_date
          FROM stress_entries
          GROUP BY user_id
        ) latest ON se.user_id = latest.user_id AND se.created_at = latest.max_date
        ORDER BY se.created_at DESC
      `
        )
        .all();

      // Calculate average using only the latest entry from each user
      let averageStressLevel = 0;
      if (latestEntries.length > 0) {
        const sum = latestEntries.reduce((total, entry) => total + entry.stress_level, 0);
        averageStressLevel = sum / latestEntries.length;
      }

      // Get average stress levels for every 15 minutes over the past 24 hours
      // Using SQLite's strftime to format timestamps into 15-minute intervals
      const timeBasedAverages = db
        .prepare(
          `
        SELECT 
          strftime('%Y-%m-%d %H:', created_at) || 
          CASE 
            WHEN CAST(strftime('%M', created_at) AS INTEGER) < 15 THEN '00'
            WHEN CAST(strftime('%M', created_at) AS INTEGER) < 30 THEN '15'
            WHEN CAST(strftime('%M', created_at) AS INTEGER) < 45 THEN '30'
            ELSE '45'
          END AS time_interval,
          AVG(stress_level) as average_stress,
          COUNT(*) as entry_count
        FROM stress_entries
        WHERE created_at >= datetime('now', '-1 day')
        GROUP BY time_interval
        ORDER BY time_interval DESC
      `
        )
        .all();

      return {
        users: latestEntries.map((entry) => ({
          userId: entry.user_id,
          username: entry.username,
          stressLevel: entry.stress_level,
          isSuperstress: entry.is_superstress === 1,
          lastUpdated: entry.created_at,
        })),
        averageStressLevel: averageStressLevel,
        timeBasedAverages: timeBasedAverages.map((interval) => ({
          timeInterval: interval.time_interval,
          averageStress: interval.average_stress,
          entryCount: interval.entry_count,
        })),
        lastUpdated: new Date().toISOString(),
      };
    },
  };
}

module.exports = StressEntryModel;
