/**
 * T-101 Terminal - Speech Controller
 * Handles text-to-speech using ElevenLabs API
 */

const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const elevenLabsService = require('../services/eleven-labs-service');
const errorHandler = require('../utils/error-handler');

// Cache directory for storing generated speech files
const CACHE_DIR = path.join(__dirname, '../cache/speech');

// Initialize cache directory
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Generate speech from text using ElevenLabs
 */
exports.generateSpeech = async (req, res) => {
    try {
        const { text, voiceId, stability, similarity_boost, style, use_speaker_boost } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required for speech generation'
            });
        }
        
        // Check text length constraints
        if (text.length > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Text exceeds maximum length of 5000 characters'
            });
        }
        
        // Create a hash of the request for caching purposes
        const requestHash = Buffer.from(JSON.stringify({
            text,
            voiceId: voiceId || 'default',
            stability: stability || 0.5,
            similarity_boost: similarity_boost || 0.75,
            style: style || 0,
            use_speaker_boost: use_speaker_boost || true
        })).toString('base64');
        
        const cacheFilePath = path.join(CACHE_DIR, `${requestHash}.mp3`);
        
        // Check if we have a cached version
        if (fs.existsSync(cacheFilePath)) {
            console.log('Serving cached speech file');
            return res.sendFile(cacheFilePath);
        }
        
        // Generate speech using ElevenLabs
        const audioBuffer = await elevenLabsService.generateSpeech({
            text,
            voice_id: voiceId || process.env.ELEVEN_LABS_DEFAULT_VOICE,
            model_id: 'eleven_turbo_v2',
            voice_settings: {
                stability: stability || 0.5,
                similarity_boost: similarity_boost || 0.75,
                style: style || 0,
                use_speaker_boost: use_speaker_boost || true
            }
        });
        
        // Save to cache
        fs.writeFileSync(cacheFilePath, audioBuffer);
        
        // Set appropriate headers
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length
        });
        
        // Send audio data
        res.send(audioBuffer);
    } catch (error) {
        errorHandler.handleError(error, req, res);
    }
};

/**
 * Stream speech generation for longer texts
 */
exports.streamSpeech = async (req, res) => {
    try {
        const { text, voiceId, stability, similarity_boost } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required for speech generation'
            });
        }
        
        // Set appropriate headers for streaming
        res.set({
            'Content-Type': 'audio/mpeg',
            'Transfer-Encoding': 'chunked'
        });
        
        // Stream audio from ElevenLabs
        const stream = await elevenLabsService.streamSpeech({
            text,
            voice_id: voiceId || process.env.ELEVEN_LABS_DEFAULT_VOICE,
            model_id: 'eleven_turbo_v2',
            voice_settings: {
                stability: stability || 0.5,
                similarity_boost: similarity_boost || 0.75
            }
        });
        
        // Pipe stream to response
        stream.pipe(res);
        
        // Handle errors
        stream.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Stream error: ' + error.message
                });
            } else if (!res.writableEnded) {
                res.end();
            }
        });
    } catch (error) {
        errorHandler.handleError(error, req, res);
    }
};

/**
 * Get available voices from ElevenLabs
 */
exports.getVoices = async (req, res) => {
    try {
        const voices = await elevenLabsService.getVoices();
        res.json({
            success: true,
            voices
        });
    } catch (error) {
        errorHandler.handleError(error, req, res);
    }
};

/**
 * Health check endpoint for the speech service
 */
exports.healthCheck = async (req, res) => {
    try {
        // Check ElevenLabs API status
        const status = await elevenLabsService.checkHealth();
        
        res.json({
            success: true,
            status,
            cacheSize: await getCacheSize(),
            cachedItems: await getCachedItemsCount()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Speech service health check failed',
            error: error.message
        });
    }
};

/**
 * Get the size of the cache directory
 */
async function getCacheSize() {
    try {
        let totalSize = 0;
        const files = fs.readdirSync(CACHE_DIR);
        
        for (const file of files) {
            const stats = fs.statSync(path.join(CACHE_DIR, file));
            totalSize += stats.size;
        }
        
        // Convert to MB
        return (totalSize / (1024 * 1024)).toFixed(2) + ' MB';
    } catch (error) {
        console.error('Error calculating cache size:', error);
        return 'Unknown';
    }
}

/**
 * Get the number of cached items
 */
async function getCachedItemsCount() {
    try {
        const files = fs.readdirSync(CACHE_DIR);
        return files.length;
    } catch (error) {
        console.error('Error counting cached items:', error);
        return 0;
    }
}

/**
 * Clear the speech cache
 */
exports.clearCache = async (req, res) => {
    try {
        const files = fs.readdirSync(CACHE_DIR);
        
        for (const file of files) {
            fs.unlinkSync(path.join(CACHE_DIR, file));
        }
        
        res.json({
            success: true,
            message: `Cleared ${files.length} cached speech files`
        });
    } catch (error) {
        errorHandler.handleError(error, req, res);
    }
};

/**
 * Simple text-only endpoint for testing without API calls
 */
exports.testSpeech = async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required'
            });
        }
        
        // In development mode without API keys, return a mock audio file
        const mockAudioPath = path.join(__dirname, '../assets/sample-speech.mp3');
        
        // Check if mock file exists, if not create a simple one
        if (!fs.existsSync(mockAudioPath)) {
            // Just return success message since we can't generate a file
            return res.json({
                success: true,
                message: 'Test successful. In production, this would return audio.',
                text: text
            });
        }
        
        res.sendFile(mockAudioPath);
    } catch (error) {
        errorHandler.handleError(error, req, res);
    }
};