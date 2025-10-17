/**
 * Logging utilities for Stress Tracker application
 *
 * This file provides helper functions for consistent and efficient logging,
 * including IP address tracking for all incoming requests and authentication events.
 *
 * Key features:
 * - Request serialization with IP address inclusion
 * - Authentication event logging with IP tracking
 * - Safe string formatting to prevent multi-line logs
 */

/**
 * Safely stringify an object for logging, preventing multi-line output
 * @param {Object} obj - The object to stringify
 * @param {number} [maxLength=500] - Maximum length of the resulting string
 * @returns {string} - The stringified object, truncated if necessary
 */
function safeStringify(obj, maxLength = 500) {
  if (!obj || typeof obj !== 'object') return String(obj);

  try {
    const str = JSON.stringify(obj);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '... (truncated)';
  } catch (err) {
    return '[Object cannot be stringified]';
  }
}

/**
 * Get the real client IP address, even when behind a proxy or in Docker
 * @param {Object} req - The request object
 * @returns {string} - The real client IP address
 */
function getRealClientIp(req) {
  // First check if we've already determined the real IP
  if (req.realIp) {
    return req.realIp;
  }

  // When working with Fastify and trustProxy enabled, we should have access to
  // the original client IP already through Fastify's built-in handling
  if (req.ips && req.ips.length > 0) {
    // The client's IP is the first one in the ips array when trustProxy is enabled
    // BUT in Docker, this might still be a proxy IP, so continue checking if it's a Docker IP
    const firstIp = req.ips[0];
    if (!isDockerInternalIp(firstIp)) {
      return firstIp;
    }
    // If the first IP is a Docker internal IP and there are multiple IPs, try the next one
    if (req.ips.length > 1) {
      return req.ips[1];
    }
  }

  // Explicitly check for the x-forwarded-for header which Docker might set
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2, ...)
    // The client IP is the first one
    const ips = forwarded.split(',').map((ip) => ip.trim());

    // Sometimes in Docker setups, the first IP might be a Docker network IP
    // If so, try the next IP in the chain if available
    if (isDockerInternalIp(ips[0]) && ips.length > 1) {
      return ips[1];
    }

    return ips[0];
  }

  // Check for other common proxy headers
  const headers = req.headers || {};
  const proxyHeaders = [
    'x-real-ip', // Used by nginx
    'cf-connecting-ip', // Cloudflare
    'true-client-ip', // Akamai and Cloudflare
    'x-client-ip', // Various proxies
    'x-forwarded', // Some proxies
    'x-cluster-client-ip', // Rackspace/Akamai
    'forwarded-for', // RFC 7239 variants
    'forwarded', // Standard header (RFC 7239)
  ];

  // Check all potential proxy headers
  for (const header of proxyHeaders) {
    if (headers[header]) {
      const headerValue = headers[header].split(',')[0].trim();
      if (!isDockerInternalIp(headerValue)) {
        return headerValue;
      }
    }
  }

  // Check the socket info directly as a last resort
  if (req.connection && req.connection.remoteAddress) {
    // Filter out internal Docker IPs
    if (!isDockerInternalIp(req.connection.remoteAddress)) {
      return req.connection.remoteAddress;
    }
  }

  // Fall back to the standard IP with a marker if it's likely a Docker proxy
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  if (isDockerInternalIp(ip)) {
    // Add a log marker to identify Docker proxy IPs
    return ip + ' (Docker network - real IP unavailable)';
  }

  return ip;
}

/**
 * Check if an IP address is a Docker internal network IP
 * @param {string} ip - The IP address to check
 * @returns {boolean} - True if it's a Docker internal IP
 */
function isDockerInternalIp(ip) {
  if (!ip) return false;

  // Common Docker network IP patterns
  return (
    ip === '127.0.0.1' ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('192.168.65.') || // Docker Desktop on Mac
    ip.startsWith('172.16.') ||
    ip === '::1'
  );
}

/**
 * Custom serializer for incoming requests to include IP address
 * @param {Object} req - The request object
 * @returns {Object} - Serialized request with IP address
 */
function requestSerializer(req) {
  // If we already set realIp on the request object, use that first
  const realIp = req.realIp || getRealClientIp(req);

  // Extract headers safely
  const headers = req.headers || {};

  // Get important proxy-related headers for debugging
  const ipHeaders = {};
  ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'true-client-ip'].forEach((header) => {
    if (headers[header]) {
      ipHeaders[header] = headers[header];
    }
  });

  return {
    method: req.method,
    url: req.url,
    path: req.routerPath || req.url,
    parameters: req.params,
    // Always prioritize our manually extracted realIp
    ip: realIp,
    rawIp: req.ip, // Original IP for debugging
    headers: {
      'user-agent': headers['user-agent'],
      'content-type': headers['content-type'],
      'content-length': headers['content-length'],
      ...ipHeaders, // Include IP-related headers for debugging
    },
  };
}

/**
 * Add request logging with IP address
 * @param {Object} fastify - Fastify instance
 */
function setupRequestLogging(fastify) {
  // Add an early hook to set the realIp as soon as possible
  fastify.addHook('onRequest', (request, reply, done) => {
    // Extract and store the real client IP immediately
    const realIp = getRealClientIp(request);

    // Add to request object for later use
    request.realIp = realIp;

    // Collect all IP-related headers for debugging
    const ipHeaders = {};
    [
      'x-forwarded-for',
      'x-real-ip',
      'cf-connecting-ip',
      'true-client-ip',
      'x-client-ip',
      'forwarded',
      'x-forwarded',
    ].forEach((header) => {
      if (request.headers[header]) {
        ipHeaders[header] = request.headers[header];
      }
    });

    // Debug log real IP vs raw IP to help diagnose issues
    request.log.debug({
      msg: `IP Detection - real: ${realIp}, raw: ${request.ip}, ips: ${
        request.ips?.join(', ') || 'none'
      }`,
      realIp,
      rawIp: request.ip,
      ips: request.ips || [],
      dockerNetwork: realIp.includes('192.168.65'),
      headers: ipHeaders,
      trustProxy: fastify.server.trustProxy ? 'enabled' : 'disabled',
    });

    // Continue with request processing
    done();
  });

  // Add a regular hook to log the full request details
  fastify.addHook('preHandler', (request, reply, done) => {
    request.log.info({
      ip: request.realIp,
      method: request.method,
      url: request.url,
      path: request.routerPath || request.url,
      userAgent: request.headers['user-agent'],
      contentType: request.headers['content-type'],
      msg: `Processing request: ${request.method} ${request.url}`,
    });
    done();
  });
}

/**
 * Log auth-related events with IP address
 * @param {Object} logger - Fastify logger instance
 * @param {string} event - Event name/type
 * @param {Object} data - Event data
 * @param {string|Object} ipOrRequest - IP address string or request object
 */
function logAuthEvent(logger, event, data, ipOrRequest) {
  // If ipOrRequest is a request object, extract the real IP
  const ip =
    typeof ipOrRequest === 'object'
      ? ipOrRequest.realIp || getRealClientIp(ipOrRequest)
      : ipOrRequest;

  logger.info({
    event,
    data,
    ip,
    timestamp: new Date().toISOString(),
    msg: `Auth event: ${event} from IP: ${ip}`,
  });
}

module.exports = {
  safeStringify,
  requestSerializer,
  setupRequestLogging,
  logAuthEvent,
  getRealClientIp,
  isDockerInternalIp,
};
