/**
 * T-101 AI Voice Terminal - Backend Server
 * Handles API requests, serves frontend, and manages external service integrations
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const multer = require('multer');
const { Readable } = require('stream');
const FormData = require('form-data');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configuration
app.use(cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// File upload configuration
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB max file size
    }
});

// API Key Configuration
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Logging utility
function logRequest(req, message) {
    console.log(`[${new Date().toISOString()}] ${message}`, {
        method: req.method,
        path: req.path,
        body: req.body
    });
}

// Error handling middleware
function errorHandler(err, req, res, next) {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

// API Key validation middleware
function validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.API_KEY;

    if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or missing API key'
        });
    }

    next();
}

// Routes
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        apis: {
            elevenLabs: !!ELEVEN_LABS_API_KEY,
            openAI: !!OPENAI_API_KEY
        }
    });
});

// ElevenLabs Text-to-Speech endpoint
app.post('/api/tts', validateApiKey, async (req, res) => {
    logRequest(req, 'TTS Request Received');

    if (!ELEVEN_LABS_API_KEY) {
        return res.status(500).json({ 
            error: 'ElevenLabs API key not configured',
            details: 'No API key found in environment variables'
        });
    }

    try {
        const { 
            text, 
            voiceId = 'pNInz6obpgDQGcFmaJgB', // Default masculine voice
            modelId = 'eleven_monolingual_v1',
            stability = 0.5,
            similarityBoost = 0.75
        } = req.body;

        // Validate input
        if (!text) {
            return res.status(400).json({ 
                error: 'Text is required', 
                details: 'No text provided for speech generation' 
            });
        }

        // Limit text length
        if (text.length > 5000) {
            return res.status(400).json({ 
                error: 'Text too long', 
                details: 'Maximum text length is 5000 characters' 
            });
        }

        // Make request to ElevenLabs API
        const response = await axios({
            method: 'POST',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVEN_LABS_API_KEY
            },
            data: {
                text,
                model_id: modelId,
                voice_settings: {
                    stability,
                    similarity_boost: similarityBoost
                }
            },
            responseType: 'arraybuffer'
        });

        // Send audio response
        res.set('Content-Type', 'audio/mpeg');
        res.send(response.data);
    } catch (error) {
        console.error('ElevenLabs API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        // Detailed error response
        if (error.response) {
            res.status(error.response.status).json({
                error: 'ElevenLabs API Error',
                status: error.response.status,
                details: error.response.data
            });
        } else {
            res.status(500).json({
                error: 'Speech Generation Failed',
                details: error.message
            });
        }
    }
});

// OpenAI Whisper Transcription endpoint
app.post('/api/transcribe', upload.single('file'), validateApiKey, async (req, res) => {
    logRequest(req, 'Transcription Request Received');

    if (!OPENAI_API_KEY) {
        return res.status(500).json({ 
            error: 'OpenAI API key not configured',
            details: 'No API key found in environment variables'
        });
    }

    if (!req.file) {
        return res.status(400).json({ 
            error: 'No file uploaded',
            details: 'Audio file is required for transcription' 
        });
    }

    try {
        const formData = new FormData();
        
        // Create a buffer stream from the file buffer
        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);

        // Append file and parameters
        formData.append('file', bufferStream, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });
        formData.append('model', 'whisper-1');

        // Optional parameters from request
        if (req.body.language) formData.append('language', req.body.language);
        if (req.body.prompt) formData.append('prompt', req.body.prompt);
        if (req.body.temperature) formData.append('temperature', req.body.temperature);

        // Make request to OpenAI API
        const response = await axios({
            method: 'POST',
            url: 'https://api.openai.com/v1/audio/transcriptions',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                ...formData.getHeaders()
            },
            data: formData
        });

        // Send transcription response
        res.json(response.data);
    } catch (error) {
        console.error('OpenAI Transcription Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        // Detailed error response
        if (error.response) {
            res.status(error.response.status).json({
                error: 'Transcription API Error',
                status: error.response.status,
                details: error.response.data
            });
        } else {
            res.status(500).json({
                error: 'Transcription Failed',
                details: error.message
            });
        }
    }
});

// Fallback route to serve index.html for all unmatched routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Start server
function startServer() {
    try {
        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════╗
║    T-101 AI Voice Terminal Server Started    ║
╠═══════════════════════════════════════════════╣
║ Port:     ${PORT}                            ║
║ ENV:      ${process.env.NODE_ENV || 'development'}                    ║
║ ElevenLabs: ${ELEVEN_LABS_API_KEY ? '✓ Configured' : '✗ Not Configured'}       ║
║ OpenAI:     ${OPENAI_API_KEY ? '✓ Configured' : '✗ Not Configured'}       ║
╚═══════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('Server startup error:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();