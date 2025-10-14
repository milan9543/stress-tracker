/**
 * Database schema for Stress Tracker application
 *
 * This file defines the SQL statements needed to initialize the database with required tables:
 * - users: Stores basic user information
 * - sessions: Handles user authentication and session management
 * - stress_entries: Records user stress levels and superstress events
 */

const SCHEMA = `
-- Users table for storing user information
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  ip_address TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for authentication and session management
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Stress entries table for recording stress levels
CREATE TABLE IF NOT EXISTS stress_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  stress_level INTEGER NOT NULL CHECK (stress_level BETWEEN 0 AND 200),
  is_superstress BOOLEAN NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster querying of user's stress entries
CREATE INDEX IF NOT EXISTS idx_stress_entries_user_id ON stress_entries(user_id);

-- Index for faster session token lookups
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Index for faster IP address lookup for session management
CREATE INDEX IF NOT EXISTS idx_sessions_ip_address ON sessions(ip_address);

-- Index for faster IP address lookup in users table
CREATE INDEX IF NOT EXISTS idx_users_ip_address ON users(ip_address);

-- Index to help with date-based queries for superstress limit
CREATE INDEX IF NOT EXISTS idx_stress_entries_user_date ON stress_entries(user_id, created_at);
`;

module.exports = { SCHEMA };
