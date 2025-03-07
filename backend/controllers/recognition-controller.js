/**
 * T-101 Terminal - Speech Recognition Controller
 * Handles processing audio for OpenAI Whisper speech recognition
 */

const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const whisperService = require('../services/whisper-service');
const errorHandler = require('../utils/error-handler');

// Maximum recording time in milliseconds
const MAX_RECORDING_TIME = 30000; // 30 seconds

/**
 * Process audio chunks from client and send to Whisper for transcription
 */
exports.processAudio = async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'] || Date.now().toString();
        const audioDir = path.join(__dirname, '../temp', sessionId);
        
        // Create temp directory if it doesn't exist
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }
        
        // Generate temporary filename for this audio
        const tempFilePath = path.join(audioDir, `recording-${Date.now()}.webm`);
        
        // Save audio stream to file
        const writeStream = fs.createWriteStream(tempFilePath);
        
        await pipeline(
            req,
            writeStream
        );
        
        console.log(`Audio saved to ${tempFilePath}`);
        
        // Process with Whisper
        const transcription = await whisperService.transcribeAudio(tempFilePath);
        
        // Clean up temp file
        fs.unlinkSync(tempFilePath);
        
        // Return transcription to client
        res.json({
            success: true,
            text: transcription
        });
    } catch (error) {
        errorHandler.handleError(error, req, res);
    }
};

/**
 * Process real-time audio stream using Whisper
 */
exports.processAudioStream = async (req, res) => {
    // Set appropriate headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const sessionId = req.headers['x-session-id'] || Date.now().toString();
    const startTime = Date.now();
    let audioChunks = [];
    
    // Set up timeout to end recording if it exceeds MAX_RECORDING_TIME
    const recordingTimeout = setTimeout(() => {
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({
                event: 'timeout',
                message: 'Recording exceeded maximum allowed time'
            })}\n\n`);
            res.end();
        }
    }, MAX_RECORDING_TIME);
    
    try {
        // Handle incoming audio chunks
        req.on('data', (chunk) => {
            audioChunks.push(chunk);
        });
        
        // Handle end of audio stream
        req.on('end', async () => {
            clearTimeout(recordingTimeout);
            
            if (audioChunks.length === 0) {
                res.write(`data: ${JSON.stringify({
                    event: 'error',
                    message: 'No audio data received'
                })}\n\n`);
                return res.end();
            }
            
            try {
                // Create temp directory if it doesn't exist
                const audioDir = path.join(__dirname, '../temp', sessionId);
                if (!fs.existsSync(audioDir)) {
                    fs.mkdirSync(audioDir, { recursive: true });
                }
                
                // Save combined audio chunks to temp file
                const tempFilePath = path.join(audioDir, `stream-${Date.now()}.webm`);
                fs.writeFileSync(tempFilePath, Buffer.concat(audioChunks));
                
                // Send progress update
                res.write(`data: ${JSON.stringify({
                    event: 'processing',
                    message: 'Processing audio with Whisper...'
                })}\n\n`);
                
                // Process with Whisper
                const transcription = await whisperService.transcribeAudio(tempFilePath);
                
                // Send result to client
                res.write(`data: ${JSON.stringify({
                    event: 'result',
                    text: transcription,
                    processingTime: Date.now() - startTime
                })}\n\n`);
                
                // Clean up temp file
                fs.unlinkSync(tempFilePath);
                
                res.end();
            } catch (error) {
                console.error('Error processing audio stream:', error);
                res.write(`data: ${JSON.stringify({
                    event: 'error',
                    message: 'Error processing audio: ' + error.message
                })}\n\n`);
                res.end();
            }
        });
        
        // Handle connection close
        req.on('close', () => {
            clearTimeout(recordingTimeout);
            if (!res.writableEnded) {
                res.end();
            }
        });
        
        // Handle errors
        req.on('error', (error) => {
            clearTimeout(recordingTimeout);
            console.error('Stream error:', error);
            if (!res.writableEnded) {
                res.write(`data: ${JSON.stringify({
                    event: 'error',
                    message: 'Stream error: ' + error.message
                })}\n\n`);
                res.end();
            }
        });
    } catch (error) {
        clearTimeout(recordingTimeout);
        errorHandler.handleError(error, req, res);
    }
};

/**
 * Simple text-only endpoint for testing Whisper without audio
 */
exports.testWhisper = async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required'
            });
        }
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real app, you'd send audio to Whisper
        // This is just a mock response for testing
        res.json({
            success: true,
            text: text,
            confidence: 0.95
        });
    } catch (error) {
        errorHandler.handleError(error, req, res);
    }
};