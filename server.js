/**
 * server.js - Backend server for T-101 AI Voice Terminal
 * Handles API requests to external services and serves the frontend
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Set up middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Set up multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
});

// Environment variables for API keys
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Check if API keys are set
if (!ELEVEN_LABS_API_KEY) {
    console.warn('Warning: ELEVEN_LABS_API_KEY not set. ElevenLabs features will not work.');
}

if (!OPENAI_API_KEY) {
    console.warn('Warning: OPENAI_API_KEY not set. Whisper features will not work.');
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ElevenLabs - Text to Speech
app.post('/api/tts', async (req, res) => {
    if (!ELEVEN_LABS_API_KEY) {
        return res.status(500).json({ error: 'ElevenLabs API key not configured on server' });
    }
    
    try {
        const { text, voiceId, modelId, stability, similarityBoost } = req.body;
        
        // Validate required fields
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const voice = voiceId || 'pNInz6obpgDQGcFmaJgB'; // Default to a deep, masculine voice
        const model = modelId || 'eleven_monolingual_v1';
        
        // Make request to ElevenLabs API
        const response = await axios({
            method: 'post',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVEN_LABS_API_KEY
            },
            data: {
                text,
                model_id: model,
                voice_settings: {
                    stability: stability || 0.75,
                    similarity_boost: similarityBoost || 0.8
                }
            },
            responseType: 'arraybuffer'
        });
        
        // Send audio data back to client
        res.set('Content-Type', 'audio/mpeg');
        res.send(response.data);
    } catch (error) {
        console.error('ElevenLabs API error:', error.response?.data || error.message);
        
        if (error.response?.status) {
            res.status(error.response.status).json({ 
                error: `ElevenLabs API error: ${error.response.status}`,
                details: error.response.data
            });
        } else {
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    }
});

// ElevenLabs - Get Voices
app.get('/api/voices', async (req, res) => {
    if (!ELEVEN_LABS_API_KEY) {
        return res.status(500).json({ error: 'ElevenLabs API key not configured on server' });
    }
    
    try {
        // Make request to ElevenLabs API
        const response = await axios({
            method: 'get',
            url: 'https://api.elevenlabs.io/v1/voices',
            headers: {
                'xi-api-key': ELEVEN_LABS_API_KEY
            }
        });
        
        // Send voices data back to client
        res.json(response.data);
    } catch (error) {
        console.error('ElevenLabs API error:', error.response?.data || error.message);
        
        if (error.response?.status) {
            res.status(error.response.status).json({ 
                error: `ElevenLabs API error: ${error.response.status}`,
                details: error.response.data
            });
        } else {
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    }
});

// OpenAI Whisper - Transcribe Audio
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
    if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key not configured on server' });
    }
    
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
    }
    
    try {
        // Create form data
        const formData = new FormData();
        
        // Convert buffer to blob
        const audioBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append('file', audioBlob, req.file.originalname);
        formData.append('model', req.body.model || 'whisper-1');
        
        if (req.body.language) {
            formData.append('language', req.body.language);
        }
        
        if (req.body.prompt) {
            formData.append('prompt', req.body.prompt);
        }
        
        if (req.body.temperature) {
            formData.append('temperature', req.body.temperature);
        }
        
        // Make request to OpenAI API
        const response = await axios({
            method: 'post',
            url: 'https://api.openai.com/v1/audio/transcriptions',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'multipart/form-data'
            },
            data: formData
        });
        
        // Send transcription data back to client
        res.json(response.data);
    } catch (error) {
        console.error('OpenAI API error:', error.response?.data || error.message);
        
        if (error.response?.status) {
            res.status(error.response.status).json({ 
                error: `OpenAI API error: ${error.response.status}`,
                details: error.response.data
            });
        } else {
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    }
});

// Handle errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
});

// Start server
app.listen(port, () => {
    console.log(`T-101 AI Voice Terminal server running on port ${port}`);
    console.log(`Open http://localhost:${port} in your browser`);
    
    // Log API status
    console.log(`ElevenLabs API: ${ELEVEN_LABS_API_KEY ? 'Configured' : 'Not configured'}`);
    console.log(`OpenAI API: ${OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
});