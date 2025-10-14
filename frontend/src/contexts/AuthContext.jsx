import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../utils/api';
import config from '../utils/config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on component mount
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const userData = await authApi.getCurrentUser();
        console.log('User data from /me endpoint:', userData);
        setUser(userData);
      } catch (err) {
        console.error('Authentication check failed:', err);
        // Don't set error state here to avoid showing error on initial load
      } finally {
        setLoading(false);
      }
    }

    checkAuthStatus();
  }, []);

  // Refresh user data function
  const refreshUser = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      console.log('User data refreshed from /me endpoint:', userData);
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      // Don't throw error or update error state to prevent UI disruption
    }
  };

  // Login function
  const login = async (username) => {
    setError(null);
    try {
      const userData = await authApi.login(username);
      setUser(userData);
      return userData;
    } catch (err) {
      // Handle specific error messages with more user-friendly messages
      if (err.message.includes('username is already taken')) {
        setError(
          'This username is already taken by someone else. Please use a different username.'
        );
      } else if (err.message.includes('IP address is already associated')) {
        setError(
          'This device is already associated with a different username. Please log in with that username or use a different device.'
        );
      } else {
        setError(err.message || 'An error occurred during login');
      }
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
    } catch (err) {
      setError(err.message || 'An error occurred during logout');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
