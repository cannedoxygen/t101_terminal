/**
 * T-101 Terminal - Configuration Settings
 * Central configuration for the application
 */

const path = require('path');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
    // Add required env vars here when ready for production
    // 'OPENAI_API_KEY',
    // 'ELEVEN_LABS_API_KEY'
];

// In production, check for required environment variables
if (process.env.NODE_ENV === 'production') {
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
        console.error('Please set these variables in your .env file or environment');
        
        // In production, exit on missing environment variables
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
}

// Default port settings
const DEFAULT_PORT = 3000;

// Configuration object
const config = {
    // Server settings
    server: {
        port: process.env.PORT || DEFAULT_PORT,
        host: process.env.HOST || 'localhost',
        corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
        useHttps: process.env.USE_HTTPS === 'true',
        sessionSecret: process.env.SESSION_SECRET || 'terminator-t101-dev-secret',
        apiKey: process.env.API_KEY || 't101-dev-api-key'
    },
    
    // Environment settings
    env: {
        nodeEnv: process.env.NODE_ENV || 'development',
        isDev: (process.env.NODE_ENV || 'development') === 'development',
        isProd: process.env.NODE_ENV === 'production',
        isTest: process.env.NODE_ENV === 'test',
        logLevel: process.env.LOG_LEVEL || 'info'
    },
    
    // File storage paths
    paths: {
        root: path.resolve(__dirname, '..'),
        logs: path.resolve(__dirname, '../logs'),
        temp: path.resolve(__dirname, '../temp'),
        cache: path.resolve(__dirname, '../cache'),
        public: path.resolve(__dirname, '../public'),
        assets: path.resolve(__dirname, '../assets')
    },
    
    // API integration settings
    apis: {
        // OpenAI Whisper settings
        whisper: {
            apiKey: process.env.OPENAI_API_KEY || '',
            model: process.env.WHISPER_MODEL || 'whisper-1',
            language: process.env.WHISPER_LANGUAGE || 'en',
            maxDuration: parseInt(process.env.WHISPER_MAX_DURATION || '30', 10),
            useMockResponses: !process.env.OPENAI_API_KEY && (process.env.NODE_ENV !== 'production')
        },
        
        // ElevenLabs settings
        elevenLabs: {
            apiKey: process.env.ELEVEN_LABS_API_KEY || '',
            defaultVoice: process.env.ELEVEN_LABS_DEFAULT_VOICE || 'terminator',
            modelId: process.env.ELEVEN_LABS_MODEL_ID || 'eleven_monolingual_v1',
            stability: parseFloat(process.env.ELEVEN_LABS_STABILITY || '0.5'),
            similarityBoost: parseFloat(process.env.ELEVEN_LABS_SIMILARITY_BOOST || '0.75'),
            useMockResponses: !process.env.ELEVEN_LABS_API_KEY && (process.env.NODE_ENV !== 'production')
        }
    },
    
    // Rate limiting settings
    rateLimits: {
        // General API rate limit
        api: {
            windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW || '60000', 10),
            max: parseInt(process.env.RATE_LIMIT_API_MAX || '60', 10)
        },
        
        // Speech synthesis rate limit (more expensive)
        speech: {
            windowMs: parseInt(process.env.RATE_LIMIT_SPEECH_WINDOW || '60000', 10),
            max: parseInt(process.env.RATE_LIMIT_SPEECH_MAX || '10', 10)
        },
        
        // Speech recognition rate limit
        recognition: {
            windowMs: parseInt(process.env.RATE_LIMIT_RECOGNITION_WINDOW || '60000', 10),
            max: parseInt(process.env.RATE_LIMIT_RECOGNITION_MAX || '20', 10)
        }
    },
    
    // Security settings
    security: {
        // CORS settings
        cors: {
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Session-ID']
        },
        
        // Helmet security settings (HTTP headers)
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.jsdelivr.net"],
                    styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com"],
                    fontSrc: ["'self'", "fonts.gstatic.com", "cdn.jsdelivr.net"],
                    imgSrc: ["'self'", "data:"],
                    connectSrc: ["'self'"],
                    mediaSrc: ["'self'", "blob:"],
                    objectSrc: ["'none'"],
                    frameSrc: ["'none'"]
                }
            },
            xssFilter: true,
            hsts: process.env.NODE_ENV === 'production'
        }
    },
    
    // Audio processing settings
    audio: {
        // Maximum audio file size in bytes (25MB)
        maxSize: parseInt(process.env.MAX_AUDIO_SIZE || (25 * 1024 * 1024).toString(), 10),
        
        // Supported audio formats
        supportedFormats: ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'],
        
        // Default audio conversion settings
        conversion: {
            sampleRate: 16000,
            channels: 1,
            format: 'mp3',
            bitrate: '48k'
        }
    },
    
    // T-101 character settings
    t101: {
        name: 'T-101',
        version: '1.0.0',
        primaryObjective: 'Secure the future of decentralized AI.',
        threatAssessment: 'Monitoring market instability.',
        directives: ['Analyze', 'Predict', 'Execute']
    }
};

// Create any required directories
Object.values(config.paths).forEach(dir => {
    const fs = require('fs');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

module.exports = config;