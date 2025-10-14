/**
 * Test script for authentication endpoints
 *
 * This script tests the login, me, and logout endpoints.
 * Run with: node test-auth.js
 */

const fetch = require('node-fetch');

// Configuration
const API_URL = 'http://localhost:3000';
const TEST_USERNAME = 'testuser_' + Math.floor(Math.random() * 10000);

// Store cookies between requests
let cookies = '';

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies,
    },
    credentials: 'include',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);

  // Save cookies for next request
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    cookies = setCookieHeader;
  }

  return {
    status: response.status,
    headers: response.headers,
    body: await response.json().catch(() => null),
  };
}

// Main test function
async function runTests() {
  console.log('🧪 Testing Authentication System');
  console.log('================================');

  try {
    // Step 1: Try accessing a protected route without authentication
    console.log('\n1️⃣ Testing protected route without authentication');
    const unauthResult = await apiRequest('/me');
    console.log(`Status: ${unauthResult.status}`);
    console.log('Response:', unauthResult.body);
    console.assert(unauthResult.status === 401, 'Should return 401 Unauthorized');

    // Step 2: Login with test user
    console.log('\n2️⃣ Testing login endpoint');
    const loginResult = await apiRequest('/login', 'POST', { username: TEST_USERNAME });
    console.log(`Status: ${loginResult.status}`);
    console.log('Response:', loginResult.body);
    console.assert(loginResult.status === 200, 'Should return 200 OK');
    console.assert(
      loginResult.body.user && loginResult.body.user.username === TEST_USERNAME,
      'Should return user object with matching username'
    );

    // Step 3: Access protected route with valid session
    console.log('\n3️⃣ Testing protected route with authentication');
    const authResult = await apiRequest('/me');
    console.log(`Status: ${authResult.status}`);
    console.log('Response:', authResult.body);
    console.assert(authResult.status === 200, 'Should return 200 OK');
    console.assert(
      authResult.body.user && authResult.body.user.username === TEST_USERNAME,
      'Should return authenticated user info'
    );

    // Step 4: Logout
    console.log('\n4️⃣ Testing logout endpoint');
    const logoutResult = await apiRequest('/logout', 'POST');
    console.log(`Status: ${logoutResult.status}`);
    console.log('Response:', logoutResult.body);
    console.assert(logoutResult.status === 200, 'Should return 200 OK');
    console.assert(logoutResult.body.success === true, 'Should return success: true');

    // Step 5: Verify logout worked by trying protected route again
    console.log('\n5️⃣ Verifying logout by accessing protected route');
    const afterLogoutResult = await apiRequest('/me');
    console.log(`Status: ${afterLogoutResult.status}`);
    console.log('Response:', afterLogoutResult.body);
    console.assert(afterLogoutResult.status === 401, 'Should return 401 Unauthorized after logout');

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the tests
runTests();
