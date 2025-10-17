/**
 * Config plugin for Fastify
 *
 * This plugin makes the application config available to all routes and other plugins.
 */

const fp = require('fastify-plugin');
const config = require('../config');

/**
 * Config plugin
 * @param {Object} fastify - Fastify instance
 * @param {Object} _options - Plugin options (unused)
 */
async function configPlugin(fastify, _options) {
  // Decorate fastify instance with the config
  fastify.decorate('config', config);

  fastify.log.info('Config plugin registered');
}

module.exports = fp(configPlugin, {
  name: 'config-plugin',
  dependencies: [],
});
