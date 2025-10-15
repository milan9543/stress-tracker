/**
 * Plugins index file for Stress Tracker application
 *
 * This file registers all plugins in the correct order.
 */

const fp = require('fastify-plugin');
const config = require('../config');
const path = require('path');

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

  // Serve static frontend files if in production environment
  if (process.env.NODE_ENV === 'production') {
    try {
      // In Docker container, frontend is at /app/frontend/dist
      const staticPath =
        process.env.NODE_ENV === 'production'
          ? '/app/frontend/dist'
          : path.join(__dirname, '../../../frontend/build'); // For local development
      fastify.log.info(`Serving frontend static files from: ${staticPath}`);

      // Register static file serving
      await fastify.register(require('@fastify/static'), {
        root: staticPath,
        prefix: '/',
        wildcard: false,
      });

      // We'll set the notFoundHandler later to handle both API and SPA routes
    } catch (err) {
      fastify.log.error(`Failed to serve static files: ${err.message}`);
    }
  }

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

  // Combined not found handler for both API and SPA routes
  fastify.setNotFoundHandler((request, reply) => {
    // For API routes, return proper 404 JSON response
    if (request.url.startsWith('/api/')) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `API route ${request.method}:${request.url} not found`,
      });
    }

    // For non-API routes in production, serve the index.html for client-side routing
    if (process.env.NODE_ENV === 'production') {
      try {
        const staticPath = '/app/frontend/dist'; // Path in Docker container
        return reply.sendFile('index.html', staticPath);
      } catch (err) {
        fastify.log.error(`Failed to serve index.html: ${err.message}`);
      }
    }

    // Fallback for development or if the above fails
    return reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method}:${request.url} not found`,
    });
  });
}

module.exports = fp(plugins, {
  name: 'app-plugins',
});
