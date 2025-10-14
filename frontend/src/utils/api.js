import config from './config';
import { showError, showSuccess, handleApiWithToast } from './notifications';

const API_BASE_URL = config.api.baseUrl;

/**
 * Handles API requests with proper error handling
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
async function apiRequest(endpoint, options = {}) {
  // Default options for all requests
  const defaultOptions = {
    credentials: 'include', // Always include cookies for session authentication
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const requestOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

    // If the response is not ok, handle it
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return {};
  } catch (error) {
    console.error(`API Request Error (${endpoint}):`, error);
    throw error;
  }
}

// Auth API functions
export const authApi = {
  login: (username) => {
    return handleApiWithToast(
      apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ username }),
      }),
      {
        loading: 'Logging in...',
        success: `Welcome, ${username}!`,
        error: (err) => {
          if (err.message.includes('username is already taken')) {
            return 'Username already in use from another device';
          } else if (err.message.includes('IP address is already associated')) {
            return 'This device is already using a different username';
          }
          return `Login failed: ${err.message}`;
        },
      }
    );
  },

  logout: () => {
    return handleApiWithToast(
      apiRequest('/logout', {
        method: 'POST',
        body: JSON.stringify({}), // Add empty JSON object as body
      }),
      {
        success: 'You have been logged out successfully',
        error: 'Failed to log out',
      }
    );
  },

  getCurrentUser: () => {
    // Get the client's timezone offset in minutes and convert to seconds
    const timezoneOffsetSeconds = new Date().getTimezoneOffset() * 60;
    // Use a query parameter to send timezone info
    return apiRequest(`/me?timezoneOffset=${timezoneOffsetSeconds}`);
  },
};

// Stress API functions
export const stressApi = {
  recordStress: (level) => {
    return handleApiWithToast(
      apiRequest('/stress', {
        method: 'POST',
        body: JSON.stringify({ level }),
      }),
      {
        loading: 'Recording stress level...',
        success: `Stress level ${level} recorded successfully!`,
        error: 'Failed to record stress level',
      }
    );
  },

  recordSuperstress: () => {
    return handleApiWithToast(
      apiRequest('/stress/superstress', {
        method: 'POST',
        body: JSON.stringify({}), // Add empty JSON object as body
      }),
      {
        loading: 'Recording superstress...',
        success: 'SUPERSTRESS recorded! Take care of yourself!',
        error: 'Failed to record superstress',
      }
    );
  },

  getHistory: (date = null) => {
    const endpoint = date ? `/stress/history?date=${date}` : '/stress/history';
    return apiRequest(endpoint);
  },

  getAverage: () => {
    return apiRequest('/stress/average');
  },
};

// Summary API functions
export const summaryApi = {
  getSummary: () => {
    return apiRequest('/summary');
  },
};

// WebSocket utility function
export function createWebSocketConnection() {
  // WebSockets use same-origin cookies by default, so authentication should work
  // as long as the cookie is already set from previous API calls
  const ws = new WebSocket(`${config.ws.url}/ws`);

  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000; // Start with 2s delay

  ws.onopen = () => {
    console.log('WebSocket connection established');
    reconnectAttempts = 0; // Reset attempts on successful connection
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = (event) => {
    console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);

    // Only try to reconnect if we haven't reached max attempts
    if (reconnectAttempts < maxReconnectAttempts) {
      const delay = reconnectDelay * Math.pow(1.5, reconnectAttempts);
      console.log(`Attempting to reconnect in ${delay}ms...`);

      setTimeout(() => {
        reconnectAttempts++;
        createWebSocketConnection(); // Try to reconnect
      }, delay);
    }
  };

  return ws;
}
