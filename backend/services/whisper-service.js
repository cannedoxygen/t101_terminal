/**
 * T-101 Terminal - Whisper Service
 * Integrates with OpenAI Whisper API for speech recognition
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Base URL for OpenAI API
const OPENAI_API_URL = 'https://api.openai.com/v1';

// Get API key from environment variables
const apiKey = process.env.OPENAI_API_KEY;

// Configure axios instance for OpenAI API
const openAiApi = axios.create({
    baseURL: OPENAI_API_URL,
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    },
    responseType: 'json'
});

/**
 * Transcribe audio using OpenAI Whisper
 * @param {string} audioFilePath Path to audio file
 * @param {Object} options Transcription options
 * @returns {Promise<string>} Transcription text
 */
exports.transcribeAudio = async (audioFilePath, options = {}) => {
    if (!apiKey && process.env.NODE_ENV !== 'development') {
        throw new Error('OpenAI API key is not set');
    }
    
    try {
        // In development mode without API key, return mock transcription
        if (!apiKey && process.env.NODE_ENV === 'development') {
            console.log('Using mock transcription in development mode (no API key)');
            return getMockTranscription(audioFilePath);
        }
        
        // Default options
        const {
            model = 'whisper-1',
            language = 'en',
            prompt = '',
            response_format = 'json',
            temperature = 0
        } = options;
        
        // Check if file exists
        if (!fs.existsSync(audioFilePath)) {
            throw new Error(`Audio file not found: ${audioFilePath}`);
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('file', fs.createReadStream(audioFilePath));
        formData.append('model', model);
        
        if (language) {
            formData.append('language', language);
        }
        
        if (prompt) {
            formData.append('prompt', prompt);
        }
        
        formData.append('response_format', response_format);
        formData.append('temperature', temperature.toString());
        
        // Make API request
        const response = await axios.post(
            `${OPENAI_API_URL}/audio/transcriptions`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    ...formData.getHeaders()
                }
            }
        );
        
        // Return transcription text
        if (response_format === 'json') {
            return response.data.text;
        } else {
            return response.data;
        }
    } catch (error) {
        handleApiError(error);
    }
};

/**
 * Translate audio to English using OpenAI Whisper
 * @param {string} audioFilePath Path to audio file
 * @param {Object} options Translation options
 * @returns {Promise<string>} Translation text
 */
exports.translateAudio = async (audioFilePath, options = {}) => {
    if (!apiKey && process.env.NODE_ENV !== 'development') {
        throw new Error('OpenAI API key is not set');
    }
    
    try {
        // In development mode without API key, return mock translation
        if (!apiKey && process.env.NODE_ENV === 'development') {
            console.log('Using mock translation in development mode (no API key)');
            return getMockTranslation(audioFilePath);
        }
        
        // Default options
        const {
            model = 'whisper-1',
            prompt = '',
            response_format = 'json',
            temperature = 0
        } = options;
        
        // Check if file exists
        if (!fs.existsSync(audioFilePath)) {
            throw new Error(`Audio file not found: ${audioFilePath}`);
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('file', fs.createReadStream(audioFilePath));
        formData.append('model', model);
        
        if (prompt) {
            formData.append('prompt', prompt);
        }
        
        formData.append('response_format', response_format);
        formData.append('temperature', temperature.toString());
        
        // Make API request
        const response = await axios.post(
            `${OPENAI_API_URL}/audio/translations`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    ...formData.getHeaders()
                }
            }
        );
        
        // Return translation text
        if (response_format === 'json') {
            return response.data.text;
        } else {
            return response.data;
        }
    } catch (error) {
        handleApiError(error);
    }
};

/**
 * Check if audio file format is supported by Whisper
 * @param {string} filePath Path to audio file
 * @returns {boolean} Whether the file format is supported
 */
exports.isFormatSupported = (filePath) => {
    if (!filePath) return false;
    
    const extension = path.extname(filePath).toLowerCase();
    const supportedFormats = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
    
    return supportedFormats.includes(extension);
};

/**
 * Get file size in megabytes
 * @param {string} filePath Path to file
 * @returns {number} File size in MB
 */
exports.getFileSizeMB = (filePath) => {
    try {
        const stats = fs.statSync(filePath);
        return stats.size / (1024 * 1024); // Convert bytes to MB
    } catch (error) {
        console.error('Error getting file size:', error);
        return 0;
    }
};

/**
 * Check if file is within size limits for Whisper API
 * @param {string} filePath Path to file
 * @returns {boolean} Whether the file is within size limits
 */
exports.isWithinSizeLimit = (filePath) => {
    const MAX_SIZE_MB = 25; // 25MB limit for Whisper API
    return exports.getFileSizeMB(filePath) <= MAX_SIZE_MB;
};

/**
 * Handle OpenAI API errors
 * @param {Error} error Error object
 */
function handleApiError(error) {
    console.error('OpenAI API Error:', error?.response?.data || error.message);
    
    // Handle specific API errors
    if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
            throw new Error('OpenAI API authentication failed. Check your API key.');
        } else if (status === 429) {
            throw new Error('OpenAI rate limit exceeded. Please try again later.');
        } else if (data && data.error) {
            throw new Error(`OpenAI API error: ${data.error.message}`);
        }
    }
    
    throw error;
};

/**
 * Get mock transcription for development without API key
 * @param {string} audioFilePath Path to audio file
 * @returns {string} Mock transcription
 */
function getMockTranscription(audioFilePath) {
    // Get filename for context
    const fileName = path.basename(audioFilePath);
    
    // Return different mock responses based on file name patterns
    // This helps with testing different scenarios
    if (fileName.includes('question')) {
        return "What is your primary mission?";
    } else if (fileName.includes('status')) {
        return "System status report.";
    } else if (fileName.includes('terminate')) {
        return "Terminate all processes immediately.";
    } else if (fileName.includes('identify')) {
        return "Identify yourself and state your purpose.";
    } else {
        // Default mock responses
        const mockResponses = [
            "Hello T-101, are you operational?",
            "What is the current threat assessment?",
            "Initiate security protocol alpha.",
            "Can you access the main database?",
            "Run a diagnostic on all systems.",
            "When was your last mission completed?"
        ];
        
        // Return random mock response
        return mockResponses[Math.floor(Math.random() * mockResponses.length)];
    }
}

/**
 * Get mock translation for development without API key
 * @param {string} audioFilePath Path to audio file
 * @returns {string} Mock translation
 */
function getMockTranslation(audioFilePath) {
    // Similar to getMockTranscription, but for translations
    const mockTranslations = [
        "I need immediate assistance with the security protocols.",
        "The system is malfunctioning, please advise on next steps.",
        "When will the mission briefing be uploaded to my database?",
        "There are unauthorized personnel in the facility.",
        "Initiating defensive countermeasures now."
    ];
    
    return mockTranslations[Math.floor(Math.random() * mockTranslations.length)];
}

module.exports = exports;