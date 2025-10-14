# Authentication System Documentation

## Overview

The authentication system for the Stress Tracker application provides a lightweight, username-only authentication mechanism with IP-based session management.

## Features

- Username-only authentication (no passwords required)
- IP-based session tracking for security
- Session token generation and validation
- Session persistence via HTTP-only cookies
- Automatic session expiration and cleanup
- Protected route middleware

## Endpoints

### POST /login

Authenticates a user by username and creates a session.

**Request:**

```json
{
  "username": "exampleuser"
}
```

**Response:**

```json
{
  "user": {
    "id": 1,
    "username": "exampleuser"
  }
}
```

The endpoint also sets a session cookie for authentication.

### GET /me

Returns the current authenticated user's information.

**Response:**

```json
{
  "user": {
    "id": 1,
    "username": "exampleuser",
    "created_at": "2025-10-13T12:00:00.000Z"
  }
}
```

### POST /logout

Logs out the current user by invalidating their session.

**Response:**

```json
{
  "success": true
}
```

The endpoint also clears the session cookie.

## Session Management

- Sessions are tied to the user's IP address for security
- Sessions expire after 7 days by default
- Expired sessions are automatically cleaned up
- Session tokens are generated using the `nanoid` library for secure random tokens
- Sessions are stored in the SQLite database

## Security Considerations

- Cookies are HTTP-only to prevent JavaScript access
- Cookies use SameSite=strict to prevent CSRF attacks
- Cookies are secure in production environments
- IP validation prevents session hijacking
- Session tokens are cryptographically secure random strings

## Testing

Use the `test-auth.js` script to test the authentication system:

```
node test-auth.js
```

This will run through the following test scenarios:

1. Accessing a protected route without authentication
2. Logging in with a test user
3. Accessing a protected route with a valid session
4. Logging out
5. Verifying logout worked
