# WebSocket Testing Instructions

The Stress Tracker application now supports WebSocket connections for real-time updates. This document provides instructions for testing the WebSocket functionality.

## WebSocket Endpoints

The application exposes two WebSocket endpoints:

1. **Authenticated WebSocket**: `/ws`

   - Requires authentication via session cookie
   - Receives personalized stress level updates
   - Used by authenticated users

2. **Public Summary WebSocket**: `/ws/summary`
   - No authentication required
   - Receives summary updates of overall stress levels
   - Used for public dashboards and anonymous users

## Testing with the Test Client

A simple WebSocket test client is included in the project to help test the WebSocket functionality.

### Prerequisites

1. Install the WebSocket client library:

```bash
npm install ws
```

2. Log in to the application to get a valid session cookie:

```bash
curl -c cookies.txt -X POST -H "Content-Type: application/json" -d '{"username":"user1","password":"password123"}' http://localhost:3000/login
```

3. Extract the session cookie from the cookies.txt file.

### Running the Test Client

```bash
node test-websocket.js "session=your-session-cookie-value"
```

The test client will connect to both WebSocket endpoints and log all messages received.

## Testing with Browser WebSocket

You can also test the WebSocket endpoints using the browser's developer console:

```javascript
// Connect to authenticated endpoint
const authWs = new WebSocket("ws://localhost:3000/ws");

// Listen for messages
authWs.onmessage = (event) => {
  console.log("Auth message:", JSON.parse(event.data));
};

// Connect to public endpoint
const publicWs = new WebSocket("ws://localhost:3000/ws/summary");

// Listen for messages
publicWs.onmessage = (event) => {
  console.log("Public message:", JSON.parse(event.data));
};
```

## Triggering WebSocket Events

To trigger WebSocket events, use the stress level recording API:

```bash
# Record stress level (will trigger WebSocket broadcast)
curl -b cookies.txt -X POST -H "Content-Type: application/json" -d '{"level":75}' http://localhost:3000/stress

# Record superstress (will trigger WebSocket broadcast)
curl -b cookies.txt -X POST http://localhost:3000/stress/superstress
```

## Expected WebSocket Messages

### Stress Update Message

```json
{
  "type": "stress-update",
  "data": {
    "id": 123,
    "userId": 456,
    "username": "testuser",
    "stressLevel": 75,
    "isSuperstress": false,
    "timestamp": "2025-10-13T12:00:00.000Z"
  }
}
```

### Summary Update Message

```json
{
  "type": "summary-update",
  "data": {
    "users": [
      { "id": 1, "username": "user1", "stressLevel": 75 },
      { "id": 2, "username": "user2", "stressLevel": 50 }
    ],
    "averageStressLevel": 62.5,
    "lastUpdated": "2025-10-13T12:00:00.000Z"
  }
}
```
