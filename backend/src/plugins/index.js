/**
 * Plugins index file for Stress Tracker application
 *
 * This file registers all plugins in the correct order.
 */

const fp = require('fastify-plugin');
const config = require('../config');

/**
 * Register all plugins with the Fastify instance
 * @param {Object} fastify - Fastify instance
 * @param {Object} _options - Plugin options (unused)
 */
async function plugins(fastify, _options) {
  // Register core plugins
  await fastify.register(require('@fastify/cors'), config.cors);

  await fastify.register(require('@fastify/cookie'), {
    secret: config.cookie.secret,
    hook: 'onRequest',
    parseOptions: {},
  });

  // Register database plugin
  await fastify.register(require('../db/plugin'));

  // Register application plugins
  await fastify.register(require('./auth'));
  await fastify.register(require('./rate-limit'));
  await fastify.register(require('./websocket'));

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    // Log the error
    fastify.log.error(error);

    // Handle validation errors
    if (error.validation) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Validation failed',
        details: error.validation,
      });
    }

    // Handle known error types with status codes
    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.name || 'Error',
        message: error.message,
      });
    }

    // Default error handling
    reply.code(500).send({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'An internal error occurred' : error.message,
    });
  });

  // Not found handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method}:${request.url} not found`,
    });
  });
}

module.exports = fp(plugins, {
  name: 'app-plugins',
});
