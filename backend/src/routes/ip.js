/**
 * IP Verification endpoint for testing IP detection
 * This route allows you to verify that IP detection is working correctly
 */

module.exports = async function (fastify) {
  // Get IP endpoint - for debugging IP detection
  fastify.get('/ip', async (request) => {
    // Import directly here to avoid needing fastify.utils
    const { getRealClientIp } = require('../utils/logging');

    // Get the real client IP
    const realIp = request.realIp || getRealClientIp(request);

    // Return detailed IP information for debugging
    return {
      detectedIp: realIp,
      rawIp: request.ip,
      ips: request.ips || [],
      headers: {
        'x-forwarded-for': request.headers['x-forwarded-for'] || 'none',
        'x-real-ip': request.headers['x-real-ip'] || 'none',
        'x-client-ip': request.headers['x-client-ip'] || 'none',
        'cf-connecting-ip': request.headers['cf-connecting-ip'] || 'none',
        'true-client-ip': request.headers['true-client-ip'] || 'none',
      },
      trustProxy: fastify.server.trustProxy ? 'enabled' : 'disabled',
    };
  });
};
