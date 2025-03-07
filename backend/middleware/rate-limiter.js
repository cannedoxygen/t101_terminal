/**
 * T-101 Terminal - Rate Limiter Middleware
 * Provides more sophisticated rate limiting than the basic auth middleware
 */

// Simple in-memory store for rate limits
// Note: For production, use Redis or similar for distributed rate limiting
const rateStore = new Map();

// Clean up old rate limit entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateStore.entries()) {
        if (now - data.timestamp > data.windowMs) {
            rateStore.delete(key);
        }
    }
}, 60000); // Clean up every minute

/**
 * Create a rate limiter middleware
 * @param {Object} options Rate limiter options
 * @param {number} options.windowMs Time window in milliseconds
 * @param {number} options.max Maximum number of requests per window
 * @param {Function} options.keyGenerator Function to generate a unique key for the request
 * @param {Function} options.handler Custom handler for rate limit exceeded
 * @returns {Function} Express middleware
 */
function createRateLimiter(options = {}) {
    const {
        windowMs = 60 * 1000, // Default: 1 minute
        max = 60, // Default: 60 requests per minute
        keyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown',
        handler = (req, res) => {
            res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    } = options;

    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();

        // Get or initialize rate data for this key
        if (!rateStore.has(key)) {
            rateStore.set(key, {
                count: 0,
                timestamp: now,
                windowMs,
                reset: now + windowMs
            });
        }

        const rateData = rateStore.get(key);

        // Reset if window has passed
        if (now - rateData.timestamp > windowMs) {
            rateData.count = 0;
            rateData.timestamp = now;
            rateData.reset = now + windowMs;
        }

        // Increment request count
        rateData.count++;

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - rateData.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(rateData.reset / 1000));

        // Check if rate limit exceeded
        if (rateData.count > max) {
            const retryAfterSeconds = Math.ceil((rateData.reset - now) / 1000);
            res.setHeader('Retry-After', retryAfterSeconds);
            return handler(req, res);
        }

        // Update store and continue
        rateStore.set(key, rateData);
        next();
    };
}

/**
 * API rate limiter - stricter limits for API endpoints
 */
exports.apiRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    keyGenerator: (req) => {
        // Use API key if available, otherwise IP
        return req.headers['x-api-key'] || 
               req.ip || 
               req.headers['x-forwarded-for'] || 
               'unknown';
    }
});

/**
 * Speech synthesis rate limiter - limit expensive operations
 */
exports.speechRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    keyGenerator: (req) => {
        // Use API key if available, otherwise IP
        return req.headers['x-api-key'] || 
               req.ip || 
               req.headers['x-forwarded-for'] || 
               'unknown';
    }
});

/**
 * Speech recognition rate limiter
 */
exports.recognitionRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
    keyGenerator: (req) => {
        // Use session ID if available, otherwise IP
        return req.headers['x-session-id'] || 
               req.headers['x-api-key'] || 
               req.ip || 
               'unknown';
    }
});

/**
 * General purpose rate limiter for public endpoints
 */
exports.generalRateLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // 100 requests per 5 minutes
});

/**
 * Very strict rate limiter for sensitive operations
 */
exports.strictRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per hour
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Rate limit exceeded for sensitive operation. Please try again later.',
            retryAfter: Math.ceil(60 * 60)
        });
    }
});

module.exports = exports;