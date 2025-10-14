/**
 * Test script for stress entry cooldown functionality
 *
 * This script tests if the cooldown logic works correctly for both
 * regular stress entries and superstress entries.
 */

const Fastify = require('fastify');
const path = require('path');

// Set environment to development for testing
process.env.NODE_ENV = 'development';

// Load environment variables from .env.development
require('dotenv').config({
  path: path.join(__dirname, '.env.development'),
});

// Import configuration (will now include cooldown settings)
const config = require('./src/config');

async function runTest() {
  console.log('STRESS TRACKER COOLDOWN TEST');
  console.log('===========================');

  // Create test fastify instance
  const fastify = Fastify({ logger: false });

  // Register database plugin
  await fastify.register(require('./src/db/plugin'));

  // Get a test user
  const testUser = fastify.db.prepare('SELECT id FROM users LIMIT 1').get();

  if (!testUser) {
    console.error('No test user found in database. Please ensure database has users.');
    process.exit(1);
  }

  console.log(`Using test user with ID: ${testUser.id}`);
  console.log('\nCONFIGURED COOLDOWNS:');
  console.log(`- Regular stress entry: ${config.cooldown.stressEntry}ms`);
  console.log(`- Superstress: ${config.cooldown.superstress}ms`);

  // Test stress entry cooldown
  console.log('\nTESTING REGULAR STRESS ENTRY COOLDOWN:');
  const stressModel = fastify.models.StressEntry;

  // Test initial state
  const initialCheck = stressModel.canSubmitStressEntry(testUser.id);
  console.log(
    '- Initial check:',
    initialCheck.canSubmit ? 'Can submit' : 'Cannot submit',
    initialCheck.canSubmit ? '' : `(${Math.round(initialCheck.timeRemaining / 1000)}s remaining)`
  );

  // Create a stress entry
  if (initialCheck.canSubmit) {
    console.log('- Creating test stress entry...');
    const entry = stressModel.create(testUser.id, 50, false);
    console.log(`  Created entry at ${entry.created_at} with level ${entry.stress_level}`);

    // Check cooldown after creating entry
    const afterEntryCheck = stressModel.canSubmitStressEntry(testUser.id);
    console.log(
      '- After entry check:',
      afterEntryCheck.canSubmit
        ? 'Can submit (ERROR! Should be in cooldown)'
        : 'Cannot submit (Correct)',
      afterEntryCheck.canSubmit
        ? ''
        : `(${Math.round(afterEntryCheck.timeRemaining / 1000)}s remaining)`
    );
  } else {
    console.log('- Cannot create test entry due to active cooldown');
  }

  // Test superstress cooldown
  console.log('\nTESTING SUPERSTRESS COOLDOWN:');

  // Check if can submit superstress
  const superCheck = stressModel.canSubmitSuperstress(testUser.id);
  console.log(
    '- Initial superstress check:',
    superCheck.canSubmit ? 'Can submit' : 'Cannot submit',
    superCheck.canSubmit ? '' : `(${Math.round(superCheck.timeRemaining / 1000 / 60)}min remaining)`
  );

  // Create superstress if possible
  if (superCheck.canSubmit) {
    console.log('- Creating test superstress entry...');
    const superEntry = stressModel.create(testUser.id, 200, true);
    console.log(
      `  Created superstress at ${superEntry.created_at} with level ${superEntry.stress_level}`
    );

    // Check after creating superstress
    const afterSuperCheck = stressModel.canSubmitSuperstress(testUser.id);
    console.log(
      '- After superstress check:',
      afterSuperCheck.canSubmit
        ? 'Can submit (ERROR! Should be in cooldown)'
        : 'Cannot submit (Correct)',
      afterSuperCheck.canSubmit
        ? ''
        : `(${Math.round(afterSuperCheck.timeRemaining / 1000 / 60)}min remaining)`
    );
  } else {
    console.log('- Cannot create superstress due to active cooldown');
  }

  await fastify.close();
  console.log('\nTest completed.');
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
