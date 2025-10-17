/**
 * Configuration utility for the Stress Tracker frontend
 *
 * This file centralizes access to environment variables and other configuration settings.
 */

// Get the base URL
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Check if baseUrl already ends with /api
const apiBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

export default {
  // API configuration
  api: {
    baseUrl: apiBaseUrl,
  },

  // WebSocket configuration
  ws: {
    url: baseUrl.endsWith('/api')
      ? `${baseUrl.replace(/^http/, 'ws')}`
      : `${baseUrl.replace(/^http/, 'ws')}/api`,
  },
};
