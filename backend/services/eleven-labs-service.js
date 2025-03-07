/**
 * T-101 Terminal - ElevenLabs Service
 * Integrates with ElevenLabs API for text-to-speech functionality
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

// Base URL for ElevenLabs API
const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1';

// Get API key from environment variables
const apiKey = process.env.ELEVEN_LABS_API_KEY;

// Configure axios instance for ElevenLabs
const elevenLabsApi = axios.create({
    baseURL: ELEVEN_LABS_API_URL,
    headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
    },
    responseType: 'json'
});

/**
 * Generate speech from text using ElevenLabs
 * @param {Object} options Speech generation options
 * @param {string} options.text Text to convert to speech
 * @param {string} options.voice_id Voice ID to use
 * @param {string} options.model_id Model ID to use
 * @param {Object} options.voice_settings Voice settings
 * @returns {Promise<Buffer>} Audio buffer
 */
exports.generateSpeech = async (options) => {
    if (!apiKey && process.env.NODE_ENV !== 'development') {
        throw new Error('ElevenLabs API key is not set');
    }
    
    try {
        // In development mode without API key, return mock audio
        if (!apiKey && process.env.NODE_ENV === 'development') {
            console.log('Using mock audio in development mode (no API key)');
            return getMockAudio();
        }
        
        const { text, voice_id, model_id, voice_settings } = options;
        const voice = voice_id || process.env.ELEVEN_LABS_DEFAULT_VOICE;
        const model = model_id || 'eleven_monolingual_v1';
        
        const response = await elevenLabsApi({
            method: 'POST',
            url: `/text-to-speech/${voice}`,
            data: {
                text,
                model_id: model,
                voice_settings
            },
            responseType: 'arraybuffer'
        });
        
        return Buffer.from(response.data);
    } catch (error) {
        handleApiError(error);
    }
};

/**
 * Stream speech generation for longer texts
 * @param {Object} options Speech generation options
 * @returns {Promise<Readable>} Audio stream
 */
exports.streamSpeech = async (options) => {
    if (!apiKey && process.env.NODE_ENV !== 'development') {
        throw new Error('ElevenLabs API key is not set');
    }
    
    try {
        // In development mode without API key, return mock audio stream
        if (!apiKey && process.env.NODE_ENV === 'development') {
            console.log('Using mock audio stream in development mode (no API key)');
            return getMockAudioStream();
        }
        
        const { text, voice_id, model_id, voice_settings } = options;
        const voice = voice_id || process.env.ELEVEN_LABS_DEFAULT_VOICE;
        const model = model_id || 'eleven_monolingual_v1';
        
        const response = await elevenLabsApi({
            method: 'POST',
            url: `/text-to-speech/${voice}/stream`,
            data: {
                text,
                model_id: model,
                voice_settings
            },
            responseType: 'stream'
        });
        
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

/**
 * Get available voices from ElevenLabs
 * @returns {Promise<Array>} List of available voices
 */
exports.getVoices = async () => {
    if (!apiKey && process.env.NODE_ENV !== 'development') {
        throw new Error('ElevenLabs API key is not set');
    }
    
    try {
        // In development mode without API key, return mock voices
        if (!apiKey && process.env.NODE_ENV === 'development') {
            console.log('Using mock voices in development mode (no API key)');
            return getMockVoices();
        }
        
        const response = await elevenLabsApi.get('/voices');
        return response.data.voices;
    } catch (error) {
        handleApiError(error);
    }
};

/**
 * Check ElevenLabs API health
 * @returns {Promise<Object>} API status information
 */
exports.checkHealth = async () => {
    if (!apiKey && process.env.NODE_ENV !== 'development') {
        throw new Error('ElevenLabs API key is not set');
    }
    
    try {
        // In development mode without API key, return mock status
        if (!apiKey && process.env.NODE_ENV === 'development') {
            console.log('Using mock health status in development mode (no API key)');
            return {
                status: 'ok',
                message: 'Development mode - no actual API check performed'
            };
        }
        
        const response = await elevenLabsApi.get('/user/subscription');
        
        // Check if we can access the subscription data
        if (response.data && response.data.tier) {
            return {
                status: 'ok',
                tier: response.data.tier,
                charactersUsed: response.data.character_count,
                charactersLimit: response.data.character_limit
            };
        }
        
        throw new Error('Unable to verify API health');
    } catch (error) {
        // Don't throw, just return error status
        return {
            status: 'error',
            message: error.message
        };
    }
};

/**
 * Get a user's subscription information
 * @returns {Promise<Object>} Subscription information
 */
exports.getSubscription = async () => {
    if (!apiKey) {
        throw new Error('ElevenLabs API key is not set');
    }
    
    try {
        const response = await elevenLabsApi.get('/user/subscription');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

/**
 * Create a new voice
 * @param {Object} options Voice creation options
 * @returns {Promise<Object>} Created voice information
 */
exports.createVoice = async (options) => {
    if (!apiKey) {
        throw new Error('ElevenLabs API key is not set');
    }
    
    try {
        const { name, files, description } = options;
        
        const formData = new FormData();
        formData.append('name', name);
        
        if (description) {
            formData.append('description', description);
        }
        
        files.forEach((file, index) => {
            formData.append(`files`, file, `sample_${index}.mp3`);
        });
        
        const response = await elevenLabsApi.post('/voices/add', formData, {
            headers: {
                ...elevenLabsApi.defaults.headers,
                'Content-Type': 'multipart/form-data'
            }
        });
        
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

/**
 * Edit an existing voice
 * @param {Object} options Voice edit options
 * @returns {Promise<Object>} Updated voice information
 */
exports.editVoice = async (options) => {
    if (!apiKey) {
        throw new Error('ElevenLabs API key is not set');
    }
    
    try {
        const { voice_id, name, description } = options;
        
        const response = await elevenLabsApi.post(`/voices/${voice_id}/edit`, {
            name,
            description
        });
        
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

/**
 * Delete a voice
 * @param {string} voiceId Voice ID to delete
 * @returns {Promise<Object>} Deletion result
 */
exports.deleteVoice = async (voiceId) => {
    if (!apiKey) {
        throw new Error('ElevenLabs API key is not set');
    }
    
    try {
        const response = await elevenLabsApi.delete(`/voices/${voiceId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

/**
 * Handle ElevenLabs API errors
 * @param {Error} error Error object
 */
function handleApiError(error) {
    console.error('ElevenLabs API Error:', error?.response?.data || error.message);
    
    // Handle specific API errors
    if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
            throw new Error('ElevenLabs API authentication failed. Check your API key.');
        } else if (status === 429) {
            throw new Error('ElevenLabs rate limit exceeded. Please try again later.');
        } else if (data && data.detail) {
            throw new Error(`ElevenLabs API error: ${data.detail}`);
        }
    }
    
    throw error;
}

/**
 * Get mock audio for development without API key
 * @returns {Promise<Buffer>} Mock audio buffer
 */
function getMockAudio() {
    // Check if we have a mock audio file
    const mockPath = path.join(__dirname, '../assets/mock-speech.mp3');
    
    if (fs.existsSync(mockPath)) {
        return fs.readFileSync(mockPath);
    }
    
    // Return an empty buffer if no mock file exists
    return Buffer.from([]);
}

/**
 * Get mock audio stream for development without API key
 * @returns {Readable} Mock audio stream
 */
function getMockAudioStream() {
    // Check if we have a mock audio file
    const mockPath = path.join(__dirname, '../assets/mock-speech.mp3');
    
    if (fs.existsSync(mockPath)) {
        return fs.createReadStream(mockPath);
    }
    
    // Return an empty stream if no mock file exists
    return new Readable({
        read() {
            this.push(null);
        }
    });
}

/**
 * Get mock voices for development without API key
 * @returns {Array} Mock voices list
 */
function getMockVoices() {
    return [
        {
            voice_id: 'terminator',
            name: 'T-101',
            preview_url: '',
            description: 'The voice of the T-101 terminator unit',
            labels: { accent: 'american', age: 'adult', gender: 'male' }
        },
        {
            voice_id: 'mock-voice-1',
            name: 'Mock Voice 1',
            preview_url: '',
            description: 'A mock voice for development',
            labels: { accent: 'british', age: 'adult', gender: 'female' }
        },
        {
            voice_id: 'mock-voice-2',
            name: 'Mock Voice 2',
            preview_url: '',
            description: 'Another mock voice for development',
            labels: { accent: 'australian', age: 'adult', gender: 'male' }
        }
    ];
}

module.exports = exports;