/**
 * Simple WebSocket test client for Stress Tracker application
 *
 * This script connects to both the authenticated and anonymous WebSocket endpoints
 * and logs all messages received.
 *
 * Usage:
 * 1. First, log in to the application to get a valid session cookie
 * 2. Then run this script: node test-websocket.js
 *
 * The script will connect to both WebSocket endpoints and log all messages.
 */

const WebSocket = require('ws');

// Configuration
const SERVER_URL = 'ws://localhost:3000';
const AUTH_WS_PATH = '/ws';
const ANON_WS_PATH = '/ws/summary';

// Get session cookie from command line
const cookie = process.argv[2];

if (!cookie) {
  console.error('Please provide a session cookie as an argument.');
  console.error('Example: node test-websocket.js "session=your-session-cookie"');
  process.exit(1);
}

console.log('Starting WebSocket test client...');

// Connect to authenticated WebSocket endpoint
const authWs = new WebSocket(`${SERVER_URL}${AUTH_WS_PATH}`, {
  headers: {
    Cookie: cookie,
  },
});

authWs.on('open', () => {
  console.log('Connected to authenticated WebSocket endpoint');

  // Send ping message every 5 seconds
  setInterval(() => {
    authWs.send(JSON.stringify({ type: 'ping', time: Date.now() }));
  }, 5000);
});

authWs.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('Received message from auth WS:', JSON.stringify(message, null, 2));
  } catch (err) {
    console.error('Error parsing message:', err);
  }
});

authWs.on('error', (error) => {
  console.error('Auth WebSocket error:', error.message);
});

authWs.on('close', (code, reason) => {
  console.log(`Auth WebSocket closed: ${code} - ${reason}`);
});

// Connect to anonymous WebSocket endpoint
const anonWs = new WebSocket(`${SERVER_URL}${ANON_WS_PATH}`);

anonWs.on('open', () => {
  console.log('Connected to anonymous WebSocket endpoint');

  // Send ping message every 5 seconds
  setInterval(() => {
    anonWs.send(JSON.stringify({ type: 'ping', time: Date.now() }));
  }, 5000);
});

anonWs.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('Received message from anon WS:', JSON.stringify(message, null, 2));
  } catch (err) {
    console.error('Error parsing message:', err);
  }
});

anonWs.on('error', (error) => {
  console.error('Anon WebSocket error:', error.message);
});

anonWs.on('close', (code, reason) => {
  console.log(`Anon WebSocket closed: ${code} - ${reason}`);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Closing WebSocket connections...');
  authWs.close();
  anonWs.close();
  process.exit(0);
});

console.log('WebSocket test client running. Press Ctrl+C to exit.');
