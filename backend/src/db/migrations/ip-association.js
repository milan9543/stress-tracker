/**
 * IP Address Association Migration
 *
 * This script associates existing users with their IP addresses from their sessions.
 * Run this script after schema update to add IP addresses to existing users.
 */

const config = require('../../config');
const dbSetup = require('../setup');
const pino = require('pino');

// Create a logger for this migration
const logger = pino({
  level: config.logger?.level || 'info',
  transport: config.logger?.prettyPrint
    ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

/**
 * Migrate users by associating them with IP addresses from their most recent sessions
 * @returns {Object} Migration statistics
 */
async function migrateUsers() {
  const db = dbSetup(config.db.path);

  logger.info('Starting IP address migration for existing users...');

  // Get all users without IP addresses
  const usersWithoutIp = db.prepare('SELECT * FROM users WHERE ip_address IS NULL').all();
  logger.info(`Found ${usersWithoutIp.length} users without IP addresses`);

  let updated = 0;
  let skipped = 0;

  // For each user, find their most recent session and use that IP address
  for (const user of usersWithoutIp) {
    const latestSession = db
      .prepare(
        `
      SELECT * FROM sessions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `
      )
      .get(user.id);

    if (latestSession) {
      // Update the user with the IP address from their latest session
      db.prepare('UPDATE users SET ip_address = ? WHERE id = ?').run(
        latestSession.ip_address,
        user.id
      );

      logger.info(`Updated user ${user.username} with IP address ${latestSession.ip_address}`);
      updated++;
    } else {
      logger.info(`No sessions found for user ${user.username}, skipping`);
      skipped++;
    }
  }

  logger.info(`Migration complete: Updated ${updated} users, skipped ${skipped} users`);
  return { updated, skipped, total: usersWithoutIp.length };
}

// If this script is run directly
if (require.main === module) {
  migrateUsers()
    .then(() => {
      logger.info('IP address migration completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Migration failed');
      process.exit(1);
    });
}

module.exports = migrateUsers;
