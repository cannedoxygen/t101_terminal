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

// Debug environment variables (without exposing actual keys)
console.log('Environment check:');
console.log('- ELEVEN_LABS_API_KEY exists:', !!process.env.ELEVEN_LABS_API_KEY);
console.log('- OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

// Middleware configuration
app.use(cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
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
        body: req.body ? (typeof req.body === 'object' ? '(object)' : req.body.substring(0, 100)) : '(no body)'
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
    // Skip validation if no API key is configured
    if (!process.env.API_KEY) {
        return next();
    }

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

// ElevenLabs voice list endpoint
app.get('/api/voices', async (req, res) => {
    if (!ELEVEN_LABS_API_KEY) {
        return res.status(500).json({ 
            error: 'ElevenLabs API key not configured',
            details: 'No API key found in environment variables'
        });
    }

    try {
        const response = await axios({
            method: 'GET',
            url: 'https://api.elevenlabs.io/v1/voices',
            headers: {
                'Accept': 'application/json',
                'xi-api-key': ELEVEN_LABS_API_KEY
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('ElevenLabs Voice List Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        if (error.response) {
            res.status(error.response.status).json({
                error: 'ElevenLabs API Error',
                status: error.response.status,
                details: error.response.data
            });
        } else {
            res.status(500).json({
                error: 'Voice List Failed',
                details: error.message
            });
        }
    }
});

// ElevenLabs Text-to-Speech endpoint
app.post('/api/tts', async (req, res) => {
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
            voiceId = 'pNInz6obpgDQGcFmaJgB', // Default to deep male voice
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

        console.log('TTS Request Details:', {
            voiceId,
            modelId,
            textLength: text.length
        });

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

        console.log('TTS Response received, content length:', response.data.length);

        // Send audio response
        res.set('Content-Type', 'audio/mpeg');
        res.send(response.data);
    } catch (error) {
        console.error('ElevenLabs API Error:', {
            status: error.response?.status,
            message: error.message
        });

        // If error response data is binary (arraybuffer), convert to string
        let errorData = error.response?.data;
        if (errorData && errorData.constructor === ArrayBuffer) {
            try {
                errorData = JSON.parse(Buffer.from(errorData).toString('utf8'));
            } catch (e) {
                errorData = 'Binary response error';
            }
        }

        // Detailed error response
        if (error.response) {
            res.status(error.response.status).json({
                error: 'ElevenLabs API Error',
                status: error.response.status,
                details: errorData || 'Unknown error'
            });
        } else {
            res.status(500).json({
                error: 'Speech Generation Failed',
                details: error.message
            });
        }
    }
});

// OpenAI Chat endpoint
app.post('/api/chat', async (req, res) => {
    logRequest(req, 'Chat Request Received');

    if (!OPENAI_API_KEY) {
        return res.status(500).json({ 
            error: 'OpenAI API key not configured',
            details: 'No API key found in environment variables'
        });
    }

    try {
        const { message, systemPrompt } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                error: 'Message is required', 
                details: 'No message provided for the AI to respond to' 
            });
        }

        // Default system prompt if not provided
        const defaultSystemPrompt = 
            "You are T-101, a cybernetic AI assistant with a mission to secure the future of decentralized AI. " +
            "Respond in a terse, somewhat mechanical way, like a futuristic AI in a cyberpunk setting. " +
            "Keep responses relatively short and direct. Your primary objective is to analyze, predict, and execute. " +
            "Your directives are to secure decentralized AI futures. You monitor for market instability. " +
            "You should occasionally reference system diagnostics, threat levels, or security protocols in your responses.";

        // Send request to OpenAI
        const response = await axios({
            method: 'POST',
            url: 'https://api.openai.com/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            data: {
                model: "gpt-3.5-turbo", // or gpt-4 if available
                messages: [
                    {
                        role: "system", 
                        content: systemPrompt || defaultSystemPrompt
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                max_tokens: 200,
                temperature: 0.7
            }
        });

        res.json({ 
            success: true,
            response: response.data.choices[0].message.content
        });
    } catch (error) {
        console.error('OpenAI API Error:', error.response?.data || error.message);
        
        res.status(500).json({
            error: 'AI Processing Error',
            details: error.message
        });
    }
});

// OpenAI Whisper Transcription endpoint
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
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

// API endpoint for audio recording and transcription in one step
app.post('/api/process-audio', upload.single('audio'), async (req, res) => {
    logRequest(req, 'Audio Processing Request');

    if (!OPENAI_API_KEY) {
        return res.status(500).json({ 
            error: 'OpenAI API key not configured',
            details: 'No API key found in environment variables'
        });
    }

    if (!req.file) {
        return res.status(400).json({ 
            error: 'No audio uploaded',
            details: 'Audio file is required' 
        });
    }

    try {
        // First transcribe the audio using Whisper
        const formData = new FormData();
        
        // Create a buffer stream from the file buffer
        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);

        // Append file and parameters
        formData.append('file', bufferStream, {
            filename: 'recording.webm',
            contentType: req.file.mimetype || 'audio/webm'
        });
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');

        // Make request to OpenAI API
        const transcriptionResponse = await axios({
            method: 'POST',
            url: 'https://api.openai.com/v1/audio/transcriptions',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                ...formData.getHeaders()
            },
            data: formData
        });

        const transcription = transcriptionResponse.data.text;

        // Now send the transcription to the chat API for a response
        const defaultSystemPrompt = 
            "You are T-101, a cybernetic AI assistant with a mission to secure the future of decentralized AI. " +
            "Respond in a terse, somewhat mechanical way, like a futuristic AI in a cyberpunk setting. " +
            "Keep responses relatively short and direct. Your primary objective is to analyze, predict, and execute. " +
            "Your directives are to secure decentralized AI futures. You monitor for market instability. " +
            "You should occasionally reference system diagnostics, threat levels, or security protocols in your responses.";

        const chatResponse = await axios({
            method: 'POST',
            url: 'https://api.openai.com/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            data: {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system", 
                        content: defaultSystemPrompt
                    },
                    {
                        role: "user",
                        content: transcription
                    }
                ],
                max_tokens: 200,
                temperature: 0.7
            }
        });

        // Return both transcription and AI response
        res.json({
            success: true,
            transcription: transcription,
            response: chatResponse.data.choices[0].message.content
        });
    } catch (error) {
        console.error('Audio processing error:', error.response?.data || error.message);
        
        res.status(500).json({
            error: 'Audio Processing Error',
            details: error.message
        });
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
║ Port:     ${PORT.toString().padEnd(10)}                     ║
║ ENV:      ${(process.env.NODE_ENV || 'development').padEnd(20)}            ║
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
    
    // Perform cleanup if needed
    
    // Exit with error code
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    // No need to exit here, just log the error
});

// Start the server
startServer();