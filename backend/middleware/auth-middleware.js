/**
 * T-101 Terminal - Authentication Middleware
 * Handles API authentication for secure endpoints
 */

const crypto = require('crypto');

/**
 * Validate API key from request
 */
exports.validateApiKey = (req, res, next) => {
    // Get API key from request headers
    const apiKey = req.headers['x-api-key'];
    
    // Check if API key is provided
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API key is required'
        });
    }
    
    // Validate API key (in production, you'd validate against a database)
    const validApiKey = process.env.API_KEY;
    
    if (!validApiKey || apiKey !== validApiKey) {
        return res.status(403).json({
            success: false,
            message: 'Invalid API key'
        });
    }
    
    // API key is valid, proceed to next middleware
    next();
};

/**
 * Rate limiting by IP address
 * Simple in-memory implementation (use Redis for production)
 */
const ipRequests = new Map();
const MAX_REQUESTS_PER_MINUTE = 60;

exports.rateLimit = (req, res, next) => {
    // Get client IP
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // Get current minute (rounded down)
    const currentMinute = Math.floor(Date.now() / 60000);
    
    // Initialize or reset counter for this IP if it's a new minute
    if (!ipRequests.has(clientIp) || ipRequests.get(clientIp).minute !== currentMinute) {
        ipRequests.set(clientIp, {
            minute: currentMinute,
            count: 1
        });
    } else {
        // Increment counter for existing IP
        const requestData = ipRequests.get(clientIp);
        requestData.count++;
        ipRequests.set(clientIp, requestData);
        
        // Check if rate limit exceeded
        if (requestData.count > MAX_REQUESTS_PER_MINUTE) {
            return res.status(429).json({
                success: false,
                message: 'Rate limit exceeded. Please try again later.'
            });
        }
    }
    
    // Proceed to next middleware
    next();
};

/**
 * Generate HMAC signature for request verification
 */
exports.generateHmacSignature = (payload, secret) => {
    return crypto.createHmac('sha256', secret)
        .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
        .digest('hex');
};

/**
 * Verify webhook signatures for callbacks
 */
exports.verifyWebhookSignature = (req, res, next) => {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    // Check if signature is provided
    if (!signature || !timestamp || !webhookSecret) {
        return res.status(401).json({
            success: false,
            message: 'Invalid webhook request'
        });
    }
    
    // Verify timestamp is recent (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const timestampNum = parseInt(timestamp, 10);
    
    if (isNaN(timestampNum) || Math.abs(now - timestampNum) > 300) {
        return res.status(401).json({
            success: false,
            message: 'Webhook timestamp is invalid or expired'
        });
    }
    
    // Get raw body (requires express raw body parser)
    const payload = req.rawBody || JSON.stringify(req.body);
    
    // Generate expected signature
    const expectedSignature = exports.generateHmacSignature(
        `${timestamp}.${payload}`,
        webhookSecret
    );
    
    // Verify signature
    if (signature !== expectedSignature) {
        return res.status(401).json({
            success: false,
            message: 'Invalid webhook signature'
        });
    }
    
    // Signature is valid, proceed to next middleware
    next();
};

/**
 * Simple development bypass for local testing
 * NEVER USE THIS IN PRODUCTION
 */
exports.devBypass = (req, res, next) => {
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
        console.warn('⚠️ WARNING: Authentication bypassed in development mode');
        return next();
    }
    
    // Otherwise, proceed to actual auth middleware
    exports.validateApiKey(req, res, next);
};

/**
 * Session authentication for user sessions
 */
exports.validateSession = (req, res, next) => {
    const sessionToken = req.cookies?.sessionToken || req.headers['x-session-token'];
    
    if (!sessionToken) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    // In a real app, validate session against database
    // This is a simplified example
    try {
        // For demo purposes, we're not implementing actual session validation
        // Just checking if the token has the right format
        if (sessionToken.length < 32) {
            throw new Error('Invalid session token');
        }
        
        // Add user info to request for downstream handlers
        req.user = {
            id: 'user-123',
            role: 'user'
        };
        
        next();
    } catch (error) {
        console.error('Session validation error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired session'
        });
    }
};