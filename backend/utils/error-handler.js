/**
 * T-101 Terminal - Error Handler Utility
 * Standardized error handling for API endpoints
 */

const fs = require('fs');
const path = require('path');

// Log directory for saving error logs
const LOG_DIR = path.join(__dirname, '../logs');

// Create log directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Standard error handler for API endpoints
 * @param {Error} error The error that occurred
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.handleError = (error, req, res) => {
    // Log error details
    logError(error, req);
    
    // Default status code and message
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    // Determine appropriate status code based on error type
    if (error.name === 'ValidationError') {
        statusCode = 400;
        errorMessage = 'Validation error';
    } else if (error.name === 'AuthenticationError') {
        statusCode = 401;
        errorMessage = 'Authentication error';
    } else if (error.name === 'AuthorizationError') {
        statusCode = 403;
        errorMessage = 'Authorization error';
    } else if (error.name === 'NotFoundError') {
        statusCode = 404;
        errorMessage = 'Resource not found';
    } else if (error.name === 'RateLimitError') {
        statusCode = 429;
        errorMessage = 'Rate limit exceeded';
    }
    
    // Override message if provided in error
    if (error.message) {
        errorMessage = error.message;
    }
    
    // Create safe error response (avoid leaking sensitive information)
    const errorResponse = {
        success: false,
        error: {
            message: errorMessage,
            code: error.code || 'ERROR',
            status: statusCode
        }
    };
    
    // Add validation errors if available
    if (error.validationErrors) {
        errorResponse.error.validationErrors = error.validationErrors;
    }
    
    // Add request ID if available
    if (req.id) {
        errorResponse.error.requestId = req.id;
    }
    
    // In development mode, include stack trace
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = error.stack;
        
        // Include original error details in development
        if (error.originalError) {
            errorResponse.error.originalError = {
                message: error.originalError.message,
                stack: error.originalError.stack
            };
        }
    }
    
    // Send error response
    res.status(statusCode).json(errorResponse);
};

/**
 * Log error details to file and console
 * @param {Error} error The error that occurred
 * @param {Object} req Express request object
 */
function logError(error, req = {}) {
    const timestamp = new Date().toISOString();
    const requestId = req.id || 'unknown';
    const method = req.method || 'unknown';
    const url = req.originalUrl || req.url || 'unknown';
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers?.['user-agent'] || 'unknown';
    
    // Format error message for logging
    const logEntry = {
        timestamp,
        requestId,
        method,
        url,
        ip,
        userAgent,
        error: {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack
        }
    };
    
    // Add body for non-GET requests, excluding sensitive data
    if (req.method && req.method !== 'GET' && req.body) {
        // Create a sanitized copy of the request body
        const sanitizedBody = { ...req.body };
        
        // Remove sensitive fields
        ['password', 'token', 'apiKey', 'secret', 'api_key', 'authorization']
            .forEach(field => {
                if (sanitizedBody[field]) {
                    sanitizedBody[field] = '***REDACTED***';
                }
            });
        
        logEntry.body = sanitizedBody;
    }
    
    // Log to console
    console.error(`[ERROR][${timestamp}][${requestId}] ${error.name}: ${error.message}`);
    
    // For serious errors, log the stack trace
    if (error.stack && (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug')) {
        console.error(error.stack);
    }
    
    // Log to file
    try {
        const logFilePath = path.join(LOG_DIR, `errors-${new Date().toISOString().split('T')[0]}.log`);
        const logString = JSON.stringify(logEntry) + '\n';
        
        fs.appendFileSync(logFilePath, logString);
    } catch (logError) {
        console.error('Error writing to log file:', logError);
    }
}

/**
 * Create a custom error with type and optional properties
 * @param {string} message Error message
 * @param {string} name Error name/type
 * @param {Object} properties Additional properties to add to error
 * @returns {Error} Custom error object
 */
exports.createError = (message, name = 'Error', properties = {}) => {
    const error = new Error(message);
    error.name = name;
    
    // Add additional properties
    Object.keys(properties).forEach(key => {
        error[key] = properties[key];
    });
    
    return error;
};

/**
 * Common error types for consistent error handling
 */
exports.errorTypes = {
    // 400 Bad Request
    ValidationError: (message, properties) => 
        exports.createError(message || 'Validation error', 'ValidationError', properties),
    
    // 401 Unauthorized
    AuthenticationError: (message, properties) => 
        exports.createError(message || 'Authentication failed', 'AuthenticationError', properties),
    
    // 403 Forbidden
    AuthorizationError: (message, properties) => 
        exports.createError(message || 'Not authorized', 'AuthorizationError', properties),
    
    // 404 Not Found
    NotFoundError: (message, properties) => 
        exports.createError(message || 'Resource not found', 'NotFoundError', properties),
    
    // 429 Too Many Requests
    RateLimitError: (message, properties) => 
        exports.createError(message || 'Rate limit exceeded', 'RateLimitError', properties),
    
    // 500 Internal Server Error
    InternalError: (message, properties) => 
        exports.createError(message || 'Internal server error', 'InternalError', properties),
    
    // 503 Service Unavailable
    ServiceUnavailableError: (message, properties) => 
        exports.createError(message || 'Service unavailable', 'ServiceUnavailableError', properties)
};

/**
 * Express middleware to handle uncaught errors
 */
exports.errorMiddleware = (err, req, res, next) => {
    exports.handleError(err, req, res);
};

/**
 * Express middleware to handle 404 Not Found
 */
exports.notFoundMiddleware = (req, res, next) => {
    const error = exports.errorTypes.NotFoundError(`Endpoint not found: ${req.method} ${req.originalUrl}`);
    exports.handleError(error, req, res);
};

/**
 * Express middleware to handle unhandled promise rejections
 */
exports.setupUncaughtHandlers = () => {
    process.on('uncaughtException', (error) => {
        console.error('[UNCAUGHT EXCEPTION]', error);
        logError(error);
        
        // Perform cleanup if needed
        
        // Exit with error code
        process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('[UNHANDLED REJECTION]', reason);
        logError(reason instanceof Error ? reason : new Error(String(reason)));
        
        // No need to exit here, just log the error
    });
};

module.exports = exports;