/**
 * api-client.js - API client for T-101 AI Voice Terminal
 * Handles API requests to ElevenLabs and OpenAI's Whisper
 */

// API client state
const apiState = {
    // API keys
    elevenLabsApiKey: '',
    openAiApiKey: '',
    
    // API endpoints
    elevenLabsEndpoint: 'https://api.elevenlabs.io/v1',
    openAiEndpoint: 'https://api.openai.com/v1',
    
    // Voice settings
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Default to a deep, masculine voice
    modelId: 'eleven_monolingual_v1',
    stability: 0.75,
    similarityBoost: 0.8,
    
    // Status
    initialized: false,
    requestsInProgress: 0,
    lastError: null,
    
    // Queue for speech requests
    speechQueue: [],
    processingQueue: false
};

/**
 * Initialize API client
 * @param {Object} config - Configuration options
 */
function initializeApiClient(config = {}) {
    console.log('Initializing API client...');
    
    // Apply config
    if (config.elevenLabsApiKey) {
        apiState.elevenLabsApiKey = config.elevenLabsApiKey;
    }
    
    if (config.openAiApiKey) {
        apiState.openAiApiKey = config.openAiApiKey;
    }
    
    if (config.voiceId) {
        apiState.voiceId = config.voiceId;
    }
    
    if (config.modelId) {
        apiState.modelId = config.modelId;
    }
    
    if (config.stability !== undefined) {
        apiState.stability = config.stability;
    }
    
    if (config.similarityBoost !== undefined) {
        apiState.similarityBoost = config.similarityBoost;
    }
    
    // Mark as initialized
    apiState.initialized = true;
    
    // Test API connections
    testApiConnections();
}

/**
 * Test API connections to ensure keys are valid
 */
function testApiConnections() {
    // Test ElevenLabs if key is provided
    if (apiState.elevenLabsApiKey) {
        // Get available voices
        fetch(`${apiState.elevenLabsEndpoint}/voices`, {
            method: 'GET',
            headers: {
                'xi-api-key': apiState.elevenLabsApiKey
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('ElevenLabs API connection successful, available voices:', data.voices.length);
            
            // Look for a suitable voice
            const voices = data.voices;
            if (voices && voices.length > 0) {
                // Try to find a deep, masculine voice
                const suitableVoices = voices.filter(voice => 
                    voice.name.toLowerCase().includes('male') || 
                    voice.name.toLowerCase().includes('deep') ||
                    voice.name.toLowerCase().includes('adam') ||
                    voice.name.toLowerCase().includes('josh') ||
                    voice.name.toLowerCase().includes('daniel')
                );
                
                if (suitableVoices.length > 0) {
                    apiState.voiceId = suitableVoices[0].voice_id;
                    console.log('Selected voice:', suitableVoices[0].name);
                } else {
                    apiState.voiceId = voices[0].voice_id;
                    console.log('Using default voice:', voices[0].name);
                }
            }
        })
        .catch(error => {
            console.error('ElevenLabs API connection test failed:', error);
            apiState.lastError = error.message;
            
            // Display error in terminal if available
            if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
                window.terminalInterface.addSystemMessage(`ElevenLabs API error: ${error.message}`, 'error');
            }
        });
    }
    
    // Test OpenAI if key is provided
    if (apiState.openAiApiKey) {
        // Make a simple request to check API key validity
        fetch(`${apiState.openAiEndpoint}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiState.openAiApiKey}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('OpenAI API connection successful, available models:', data.data.length);
            
            // Check if Whisper is available
            const whisperAvailable = data.data.some(model => model.id.includes('whisper'));
            
            if (whisperAvailable) {
                console.log('Whisper model is available');
            } else {
                console.warn('Whisper model may not be available for your API key');
            }
        })
        .catch(error => {
            console.error('OpenAI API connection test failed:', error);
            apiState.lastError = error.message;
            
            // Display error in terminal if available
            if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
                window.terminalInterface.addSystemMessage(`OpenAI API error: ${error.message}`, 'error');
            }
        });
    }
}

/**
 * Generate speech using ElevenLabs API
 * @param {string} text - Text to convert to speech
 * @param {Object} options - Optional parameters
 * @returns {Promise} Promise that resolves with audio blob
 */
function generateSpeech(text, options = {}) {
    return new Promise((resolve, reject) => {
        if (!apiState.initialized) {
            reject(new Error('API client not initialized'));
            return;
        }
        
        if (!apiState.elevenLabsApiKey) {
            reject(new Error('ElevenLabs API key not provided'));
            return;
        }
        
        // Increment requests counter
        apiState.requestsInProgress++;
        
        // Use provided voice ID or default
        const voiceId = options.voiceId || apiState.voiceId;
        
        // API endpoint
        const apiUrl = `${apiState.elevenLabsEndpoint}/text-to-speech/${voiceId}`;
        
        // Request parameters
        const requestBody = {
            text: text,
            model_id: options.modelId || apiState.modelId,
            voice_settings: {
                stability: options.stability !== undefined ? options.stability : apiState.stability,
                similarity_boost: options.similarityBoost !== undefined ? options.similarityBoost : apiState.similarityBoost
            }
        };
        
        // Set up request
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiState.elevenLabsApiKey
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
            }
            return response.blob();
        })
        .then(audioBlob => {
            // Decrement requests counter
            apiState.requestsInProgress--;
            
            // Resolve with audio blob
            resolve(audioBlob);
        })
        .catch(error => {
            // Decrement requests counter
            apiState.requestsInProgress--;
            
            // Store error
            apiState.lastError = error.message;
            
            console.error('ElevenLabs API error:', error);
            reject(error);
        });
    });
}

/**
 * Play audio blob with visualization
 * @param {Blob} audioBlob - Audio blob to play
 * @returns {Promise} Promise that resolves when audio finishes playing
 */
function playAudioBlob(audioBlob) {
    return new Promise((resolve, reject) => {
        // Create audio element
        const audioElement = new Audio();
        audioElement.src = URL.createObjectURL(audioBlob);
        
        // Set up event handlers
        audioElement.onplay = () => {
            console.log('Audio started playing');
            
            // Activate waveform if available
            if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(true);
            }
        };
        
        audioElement.onended = () => {
            console.log('Audio finished playing');
            
            // Deactivate waveform
            if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(false);
            }
            
            // Clean up blob URL
            URL.revokeObjectURL(audioElement.src);
            
            resolve();
        };
        
        audioElement.onerror = (error) => {
            console.error('Error playing audio:', error);
            
            // Deactivate waveform
            if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(false);
            }
            
            // Clean up blob URL
            URL.revokeObjectURL(audioElement.src);
            
            reject(new Error('Error playing audio'));
        };
        
        // Play the audio
        audioElement.play().catch(error => {
            console.error('Error starting audio playback:', error);
            reject(error);
        });
    });
}

/**
 * Speak text using ElevenLabs API
 * @param {string} text - Text to speak
 * @param {Object} options - Optional parameters
 * @returns {Promise} Promise that resolves when speech completes
 */
function speakText(text, options = {}) {
    return new Promise((resolve, reject) => {
        // Add to queue
        apiState.speechQueue.push({
            text,
            options,
            resolve,
            reject
        });
        
        // Process queue if not already processing
        if (!apiState.processingQueue) {
            processNextInQueue();
        }
    });
}

/**
 * Process next item in speech queue
 */
function processNextInQueue() {
    // If queue is empty, mark as not processing
    if (apiState.speechQueue.length === 0) {
        apiState.processingQueue = false;
        return;
    }
    
    // Mark as processing
    apiState.processingQueue = true;
    
    // Get next item
    const item = apiState.speechQueue.shift();
    
    // Generate speech
    generateSpeech(item.text, item.options)
        .then(audioBlob => {
            // Play audio
            return playAudioBlob(audioBlob);
        })
        .then(() => {
            // Resolve promise
            item.resolve();
            
            // Process next item
            processNextInQueue();
        })
        .catch(error => {
            // Reject promise
            item.reject(error);
            
            // Process next item
            processNextInQueue();
        });
}

/**
 * Transcribe audio using Whisper API
 * @param {File|Blob} audioFile - Audio file to transcribe
 * @param {Object} options - Optional parameters
 * @returns {Promise} Promise that resolves with transcription
 */
function transcribeAudio(audioFile, options = {}) {
    return new Promise((resolve, reject) => {
        if (!apiState.initialized) {
            reject(new Error('API client not initialized'));
            return;
        }
        
        if (!apiState.openAiApiKey) {
            reject(new Error('OpenAI API key not provided'));
            return;
        }
        
        // Increment requests counter
        apiState.requestsInProgress++;
        
        // Create form data
        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', options.model || 'whisper-1');
        
        if (options.language) {
            formData.append('language', options.language);
        }
        
        if (options.prompt) {
            formData.append('prompt', options.prompt);
        }
        
        if (options.temperature !== undefined) {
            formData.append('temperature', options.temperature.toString());
        }
        
        // Set up request
        fetch(`${apiState.openAiEndpoint}/audio/transcriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiState.openAiApiKey}`
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Decrement requests counter
            apiState.requestsInProgress--;
            
            console.log('Transcription received:', data);
            resolve(data.text);
        })
        .catch(error => {
            // Decrement requests counter
            apiState.requestsInProgress--;
            
            // Store error
            apiState.lastError = error.message;
            
            console.error('Whisper API error:', error);
            reject(error);
        });
    });
}

/**
 * Record audio from microphone
 * @param {number} maxDuration - Maximum recording duration in milliseconds
 * @returns {Promise} Promise that resolves with audio blob
 */
function recordAudio(maxDuration = 10000) {
    return new Promise((resolve, reject) => {
        // Check if MediaRecorder is available
        if (!window.MediaRecorder) {
            reject(new Error('MediaRecorder not supported in this browser'));
            return;
        }
        
        // Request microphone access
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                // Create recorder
                const mediaRecorder = new MediaRecorder(stream);
                
                // Store audio chunks
                const audioChunks = [];
                
                // Set up event handlers
                mediaRecorder.addEventListener('dataavailable', event => {
                    audioChunks.push(event.data);
                });
                
                mediaRecorder.addEventListener('stop', () => {
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                    
                    // Create blob
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    
                    // Resolve with blob
                    resolve(audioBlob);
                });
                
                // Start recording
                mediaRecorder.start();
                
                // Show recording indicator
                if (window.hudController && typeof window.hudController.activateScanning === 'function') {
                    window.hudController.activateScanning(true);
                }
                
                // Update mic button if exists
                const micButton = document.getElementById('mic-toggle');
                if (micButton) {
                    micButton.classList.add('recording');
                    const micStatus = micButton.querySelector('.mic-status');
                    if (micStatus) {
                        micStatus.textContent = 'RECORDING...';
                    }
                }
                
                // Create voice wave visualization
                if (window.animationController && typeof window.animationController.createVoiceWaves === 'function') {
                    const userInputContainer = document.querySelector('.user-input-container');
                    if (userInputContainer) {
                        window.animationController.createVoiceWaves(userInputContainer);
                    }
                }
                
                // Stop after maxDuration
                setTimeout(() => {
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                        
                        // Hide recording indicator
                        if (window.hudController && typeof window.hudController.activateScanning === 'function') {
                            window.hudController.activateScanning(false);
                        }
                        
                        // Update mic button if exists
                        const micButton = document.getElementById('mic-toggle');
                        if (micButton) {
                            micButton.classList.remove('recording');
                            const micStatus = micButton.querySelector('.mic-status');
                            if (micStatus) {
                                micStatus.textContent = 'VOICE INPUT READY';
                            }
                        }
                        
                        // Remove voice wave visualization
                        const waveContainer = document.querySelector('.voice-wave-container');
                        if (waveContainer) {
                            waveContainer.remove();
                        }
                    }
                }, maxDuration);
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                reject(error);
            });
    });
}

/**
 * Process voice input: record, transcribe, and process
 * @param {number} maxDuration - Maximum recording duration in milliseconds
 * @returns {Promise} Promise that resolves when processing completes
 */
function processVoiceInput(maxDuration = 5000) {
    return new Promise((resolve, reject) => {
        // Display processing message
        if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
            window.terminalInterface.addSystemMessage('Listening...', 'default');
        }
        
        // Record audio
        recordAudio(maxDuration)
            .then(audioBlob => {
                // Display processing message
                if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
                    window.terminalInterface.addSystemMessage('Processing voice input...', 'default');
                }
                
                // Transcribe audio
                return transcribeAudio(audioBlob);
            })
            .then(text => {
                // Display recognized text
                const userInput = document.getElementById('user-input-display');
                if (userInput) {
                    userInput.textContent = text;
                }
                
                // Process user input
                if (typeof processUserInput === 'function') {
                    processUserInput(text);
                } else if (window.terminalInterface && typeof window.terminalInterface.addUserCommand === 'function') {
                    window.terminalInterface.addUserCommand(text);
                }
                
                resolve(text);
            })
            .catch(error => {
                console.error('Error processing voice input:', error);
                
                // Display error
                if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
                    window.terminalInterface.addSystemMessage(`Error: ${error.message}`, 'error');
                }
                
                reject(error);
            });
    });
}

// Export functions for use in other files
if (typeof window !== 'undefined') {
    // Add to window object for access from other scripts
    window.apiClient = {
        initializeApiClient,
        generateSpeech,
        speakText,
        transcribeAudio,
        recordAudio,
        processVoiceInput
    };
}