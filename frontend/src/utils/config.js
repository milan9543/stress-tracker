/**
 * Configuration utility for the Stress Tracker frontend
 *
 * This file centralizes access to environment variables and other configuration settings.
 */

// Get the base URL
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default {
  // API configuration
  api: {
    baseUrl: apiBaseUrl,
  },

  // WebSocket configuration
  ws: {
    url: apiBaseUrl.replace(/^http/, 'ws'),
  },
};
