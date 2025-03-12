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
    voiceId: '2EiwWnXFnvU5JabPnv8n', // Default to a deep, masculine voice
    modelId: 'eleven_monolingual_v1',
    stability: 0.75,
    similarityBoost: 0.8,
    
    // Status
    initialized: false,
    requestsInProgress: 0,
    lastError: null,
    permissionGranted: false,
    
    // Queue for speech requests
    speechQueue: [],
    processingQueue: false,
    
    // Debug mode
    debug: false
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
    } else if (localStorage.getItem('elevenLabsApiKey')) {
        apiState.elevenLabsApiKey = localStorage.getItem('elevenLabsApiKey');
    }
    
    if (config.openAiApiKey) {
        apiState.openAiApiKey = config.openAiApiKey;
    } else if (localStorage.getItem('openAiApiKey')) {
        apiState.openAiApiKey = localStorage.getItem('openAiApiKey');
    }
    
    if (config.voiceId) {
        apiState.voiceId = config.voiceId;
    } else if (localStorage.getItem('voiceId')) {
        apiState.voiceId = localStorage.getItem('voiceId');
    }
    
    if (config.modelId) {
        apiState.modelId = config.modelId;
    } else if (localStorage.getItem('modelId')) {
        apiState.modelId = localStorage.getItem('modelId');
    }
    
    if (config.stability !== undefined) {
        apiState.stability = config.stability;
    } else if (localStorage.getItem('stability')) {
        apiState.stability = parseFloat(localStorage.getItem('stability'));
    }
    
    if (config.similarityBoost !== undefined) {
        apiState.similarityBoost = config.similarityBoost;
    } else if (localStorage.getItem('similarityBoost')) {
        apiState.similarityBoost = parseFloat(localStorage.getItem('similarityBoost'));
    }
    
    if (config.debug !== undefined) {
        apiState.debug = config.debug;
    }
    
    // Mark as initialized
    apiState.initialized = true;
    
    // Check for API keys
    const hasElevenLabsKey = !!apiState.elevenLabsApiKey;
    const hasOpenAiKey = !!apiState.openAiApiKey;
    
    if (!hasElevenLabsKey || !hasOpenAiKey) {
        console.warn(`API keys missing: ${!hasElevenLabsKey ? 'ElevenLabs ' : ''}${!hasOpenAiKey ? 'OpenAI' : ''}`);
        
        // Display warning in terminal interface if available
        if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
            window.terminalInterface.addSystemMessage(
                `Warning: API keys missing. ${!hasElevenLabsKey ? 'Speech synthesis' : ''} ${!hasOpenAiKey ? 'Voice recognition' : ''} may use fallback methods.`,
                'warning'
            );
        }
    }
    
    // Check browser capabilities
    checkBrowserCapabilities();
    
    // Test API connections
    if (hasElevenLabsKey || hasOpenAiKey) {
        testApiConnections();
    }
    
    // Request microphone permission to check early
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                // Stop all tracks immediately, we just wanted to check permission
                stream.getTracks().forEach(track => track.stop());
                apiState.permissionGranted = true;
                
                if (apiState.debug) {
                    console.log('Microphone permission granted');
                }
            })
            .catch(error => {
                console.warn('Microphone permission check failed:', error);
                apiState.permissionGranted = false;
            });
    }
    
    return apiState.initialized;
}

/**
 * Check browser capabilities for required features
 */
function checkBrowserCapabilities() {
    const capabilities = {
        speechRecognition: typeof window.SpeechRecognition !== 'undefined' || 
                         typeof window.webkitSpeechRecognition !== 'undefined',
        speechSynthesis: typeof window.speechSynthesis !== 'undefined',
        audioContext: typeof window.AudioContext !== 'undefined' || 
                    typeof window.webkitAudioContext !== 'undefined',
        mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        mediaRecorder: typeof window.MediaRecorder !== 'undefined',
        fetch: typeof window.fetch !== 'undefined',
        blob: typeof window.Blob !== 'undefined',
        localStorage: typeof window.localStorage !== 'undefined'
    };
    
    const missingFeatures = Object.entries(capabilities)
        .filter(([_, supported]) => !supported)
        .map(([name]) => name);
    
    if (missingFeatures.length > 0) {
        console.warn('Missing browser capabilities:', missingFeatures.join(', '));
        
        // Display warning for critical missing features
        const criticalFeatures = ['mediaDevices', 'fetch', 'blob'];
        const missingCritical = missingFeatures.filter(feature => criticalFeatures.includes(feature));
        
        if (missingCritical.length > 0 && 
            window.terminalInterface && 
            typeof window.terminalInterface.addSystemMessage === 'function') {
            window.terminalInterface.addSystemMessage(
                `Warning: Your browser is missing critical features: ${missingCritical.join(', ')}. The terminal may not work properly.`,
                'error'
            );
        }
    }
    
    return capabilities;
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
                'Accept': 'application/json',
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
            if (apiState.debug) {
                console.log('ElevenLabs API connection successful, available voices:', data.voices.length);
            }
            
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
                    if (apiState.debug) {
                        console.log('Selected voice:', suitableVoices[0].name);
                    }
                    
                    // Store voice ID in localStorage for future sessions
                    try {
                        localStorage.setItem('voiceId', apiState.voiceId);
                    } catch (e) {
                        console.warn('Could not save voice ID to localStorage:', e);
                    }
                } else if (voices.length > 0) {
                    apiState.voiceId = voices[0].voice_id;
                    if (apiState.debug) {
                        console.log('Using default voice:', voices[0].name);
                    }
                    
                    // Store voice ID in localStorage
                    try {
                        localStorage.setItem('voiceId', apiState.voiceId);
                    } catch (e) {
                        console.warn('Could not save voice ID to localStorage:', e);
                    }
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
            if (apiState.debug) {
                console.log('OpenAI API connection successful, available models:', data.data.length);
            }
            
            // Check if Whisper is available
            const whisperAvailable = data.data.some(model => model.id.includes('whisper'));
            
            if (whisperAvailable) {
                if (apiState.debug) {
                    console.log('Whisper model is available');
                }
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
 * @returns {Promise<Blob>} Promise that resolves with audio blob
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
        
        if (apiState.debug) {
            console.log('Generating speech with params:', {
                voiceId,
                modelId: requestBody.model_id,
                textLength: text.length,
                stability: requestBody.voice_settings.stability,
                similarityBoost: requestBody.voice_settings.similarity_boost
            });
        }
        
        // Activate waveform if available while waiting for API
        if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
            window.animationController.setWaveformActive(true, 30, 1.5);
        }
        
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
            
            if (apiState.debug) {
                console.log(`Received audio blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
            }
            
            // Resolve with audio blob
            resolve(audioBlob);
        })
        .catch(error => {
            // Decrement requests counter
            apiState.requestsInProgress--;
            
            // Deactivate waveform if request failed
            if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(false);
            }
            
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
            if (apiState.debug) {
                console.log('Audio started playing');
            }
            
            // Activate waveform if available
            if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(true);
            }
        };
        
        audioElement.onended = () => {
            if (apiState.debug) {
                console.log('Audio finished playing');
            }
            
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
            
            // Deactivate waveform
            if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(false);
            }
            
            // Clean up blob URL
            URL.revokeObjectURL(audioElement.src);
            
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
        // Use a queue for multiple speech requests
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
    
    // Check if we should use TTS at all (for silent mode)
    if (item.options.silent) {
        // Resolve immediately for silent mode
        item.resolve();
        
        // Process next item
        processNextInQueue();
        return;
    }
    
    // First try ElevenLabs if API key available
    if (apiState.elevenLabsApiKey && !item.options.useNative) {
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
                console.error('ElevenLabs speech error, falling back to native speech:', error);
                
                // Fall back to browser's native speech synthesis
                speakWithNativeSynthesis(item.text, item.options)
                    .then(() => {
                        // Resolve promise
                        item.resolve();
                    })
                    .catch(nativeError => {
                        // Log error but still resolve - we tried both methods
                        console.error('Native speech synthesis also failed:', nativeError);
                        item.resolve();
                    })
                    .finally(() => {
                        // Process next item regardless of outcome
                        processNextInQueue();
                    });
            });
    } else {
        // Use browser's native speech synthesis directly
        speakWithNativeSynthesis(item.text, item.options)
            .then(() => {
                // Resolve promise
                item.resolve();
            })
            .catch(error => {
                // Log error but still resolve - we don't have another fallback
                console.error('Native speech synthesis failed:', error);
                item.resolve();
            })
            .finally(() => {
                // Process next item regardless of outcome
                processNextInQueue();
            });
    }
}

/**
 * Speak text using browser's native speech synthesis
 * @param {string} text - Text to speak
 * @param {Object} options - Optional parameters
 * @returns {Promise} Promise that resolves when speech completes
 */
function speakWithNativeSynthesis(text, options = {}) {
    return new Promise((resolve, reject) => {
        // Check if speech synthesis is available
        if (!window.speechSynthesis) {
            reject(new Error('Speech synthesis not available in this browser'));
            return;
        }
        
        try {
            // Create utterance
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Configure voice
            utterance.rate = options.rate || 0.9;  // Slightly slower
            utterance.pitch = options.pitch || 0.8; // Deeper voice
            utterance.volume = options.volume || 1.0;
            
            // Set a voice if available
            if (window.speechSynthesis.getVoices().length === 0) {
                // If voices aren't loaded yet, wait for them
                window.speechSynthesis.onvoiceschanged = () => {
                    setVoiceAndSpeak(utterance, resolve, reject);
                };
            } else {
                // If voices are already loaded, set voice and speak
                setVoiceAndSpeak(utterance, resolve, reject);
            }
        } catch (error) {
            console.error('Error configuring speech synthesis:', error);
            reject(error);
        }
    });
}

/**
 * Helper function to set voice and start speaking
 * @param {SpeechSynthesisUtterance} utterance - Utterance to speak
 * @param {Function} resolve - Promise resolve function
 * @param {Function} reject - Promise reject function
 */
function setVoiceAndSpeak(utterance, resolve, reject) {
    try {
        const voices = window.speechSynthesis.getVoices();
        
        // Try to find a deep male voice
        let selectedVoice = null;
        
        // First try to find a deep male voice
        for (const voice of voices) {
            const lowerName = voice.name.toLowerCase();
            if ((lowerName.includes('male') || lowerName.includes('man')) && 
                (lowerName.includes('deep') || lowerName.includes('bass') || 
                 lowerName.includes('low') || lowerName.includes('daniel') || 
                 lowerName.includes('david') || lowerName.includes('james'))) {
                selectedVoice = voice;
                break;
            }
        }
        
        // If no deep male voice found, try any male voice
        if (!selectedVoice) {
            for (const voice of voices) {
                const lowerName = voice.name.toLowerCase();
                if (lowerName.includes('male') || lowerName.includes('man')) {
                    selectedVoice = voice;
                    break;
                }
            }
        }
        
        // If still no voice found, use the first one
        if (!selectedVoice && voices.length > 0) {
            selectedVoice = voices[0];
        }
        
        // Set selected voice
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            if (apiState.debug) {
                console.log(`Using voice: ${selectedVoice.name}`);
            }
        }
        
        // Activate waveform if available
        if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
            window.animationController.setWaveformActive(true);
        }
        
        // Handle events
        utterance.onstart = () => {
            if (apiState.debug) {
                console.log('Speech started');
            }
        };
        
        utterance.onend = () => {
            if (apiState.debug) {
                console.log('Speech ended');
            }
            
            // Deactivate waveform
            if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(false);
            }
            
            resolve();
        };
        
        utterance.onerror = (error) => {
            console.error('Speech error:', error);
            
            // Deactivate waveform
            if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(false);
            }
            
            reject(error);
        };
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
        
        // Workaround for Chrome issue where onend doesn't fire
        const checkSpeaking = setInterval(() => {
            if (!window.speechSynthesis.speaking) {
                clearInterval(checkSpeaking);
                
                // If onend hasn't fired after 500ms, manually trigger cleanup
                setTimeout(() => {
                    // Deactivate waveform
                    if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                        window.animationController.setWaveformActive(false);
                    }
                    
                    resolve();
                }, 500);
            }
        }, 100);
    } catch (error) {
        console.error('Error setting voice or speaking:', error);
        
        // Deactivate waveform
        if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
            window.animationController.setWaveformActive(false);
        }
        
        reject(error);
    }
}

/**
 * Transcribe audio using Whisper API
 * @param {File|Blob} audioFile - Audio file to transcribe
 * @param {Object} options - Optional parameters
 * @returns {Promise<string>} Promise that resolves with transcription
 */
function transcribeAudio(audioFile, options = {}) {
    return new Promise((resolve, reject) => {
        if (!apiState.initialized) {
            reject(new Error('API client not initialized'));
            return;
        }
        
        if (!apiState.openAiApiKey) {
            // Try server-side transcription instead if no API key
            transcribeWithServer(audioFile, options)
                .then(resolve)
                .catch(reject);
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
            
            if (apiState.debug) {
                console.log('Transcription received:', data);
            }
            
            resolve(data.text);
        })
        .catch(error => {
            // Decrement requests counter
            apiState.requestsInProgress--;
            
            // Store error
            apiState.lastError = error.message;
            
            console.error('Whisper API error:', error);
            
            // Try server-side transcription as fallback
            transcribeWithServer(audioFile, options)
                .then(resolve)
                .catch(() => {
                    // If both methods fail, reject with original error
                    reject(error);
                });
        });
    });
}

/**
 * Transcribe audio using server API
 * @param {File|Blob} audioFile - Audio file to transcribe
 * @param {Object} options - Optional parameters
 * @returns {Promise<string>} Promise that resolves with transcription
 */
function transcribeWithServer(audioFile, options = {}) {
    return new Promise((resolve, reject) => {
        // Create form data
        const formData = new FormData();
        formData.append('file', audioFile, 'recording.webm');
        
        if (options.language) {
            formData.append('language', options.language);
        }
        
        if (options.prompt) {
            formData.append('prompt', options.prompt);
        }
        
        // Send to server endpoint
        fetch('/api/transcribe', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server transcription error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.text) {
                resolve(data.text);
            } else {
                throw new Error('No transcription text in response');
            }
        })
        .catch(error => {
            console.error('Server transcription error:', error);
            reject(error);
        });
    });
}

/**
 * Request microphone permission explicitly
 * @returns {Promise<boolean>} Whether permission was granted
 */
async function requestMicrophonePermission() {
    if (apiState.permissionGranted) {
        return true;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Stop all tracks right away - we just wanted the permission
        stream.getTracks().forEach(track => track.stop());
        
        apiState.permissionGranted = true;
        
        if (apiState.debug) {
            console.log('Microphone permission granted');
        }
        
        return true;
    } catch (error) {
        console.error('Microphone permission error:', error);
        apiState.permissionGranted = false;
        
        // Generate specific error message based on error type
        let errorMessage = 'Microphone access error: ';
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage += 'Permission denied. Please allow microphone access.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMessage += 'No microphone found. Please connect a microphone.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMessage += 'Microphone is already in use by another application.';
        } else {
            errorMessage += error.message;
        }
        
        // Display error in terminal if available
        if (window.terminalInterface && 
            typeof window.terminalInterface.addSystemMessage === 'function') {
            window.terminalInterface.addSystemMessage(errorMessage, 'error');
        }
        
        return false;
    }
}

/**
 * Record audio from microphone
 * @param {number} maxDuration - Maximum recording duration in milliseconds
 * @returns {Promise<Blob>} Promise that resolves with audio blob
 */
async function recordAudio(maxDuration = 10000) {
    // First, request microphone permission
    const permissionGranted = await requestMicrophonePermission();
    if (!permissionGranted) {
        throw new Error('Microphone permission denied');
    }
    
    return new Promise((resolve, reject) => {
        // Check if MediaRecorder is available
        if (!window.MediaRecorder) {
            reject(new Error('MediaRecorder not supported in this browser'));
            return;
        }
        
        // Activate waveform if available
        if (window.animationController && 
            typeof window.animationController.setWaveformActive === 'function') {
            window.animationController.setWaveformActive(true, 30, 1.5);
        }
        
        // Request microphone access
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                // Try different MIME types for better compatibility
                const mimeTypes = [
                    'audio/webm',
                    'audio/mp4',
                    'audio/ogg',
                    'audio/wav'
                ];
                
                let options = {};
                
                // Find a supported MIME type
                for (const mimeType of mimeTypes) {
                    if (MediaRecorder.isTypeSupported(mimeType)) {
                        options.mimeType = mimeType;
                        break;
                    }
                }
                
                // Create recorder with options if supported
                let mediaRecorder;
                try {
                    mediaRecorder = new MediaRecorder(stream, options);
                    
                    if (apiState.debug) {
                        console.log(`Using MediaRecorder with mimeType: ${mediaRecorder.mimeType}`);
                    }
                } catch (e) {
                    // Fallback to default options
                    console.warn('MediaRecorder with specified options failed, using default:', e);
                    mediaRecorder = new MediaRecorder(stream);
                }
                
                // Store audio chunks
                const audioChunks = [];
                
                // Set up event handlers
                mediaRecorder.addEventListener('dataavailable', event => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                });
                
                mediaRecorder.addEventListener('stop', () => {
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                    
                    // Check if we have any audio data
                    if (audioChunks.length === 0 || audioChunks.every(chunk => chunk.size === 0)) {
                        console.error('No audio data recorded');
                        
                        // Deactivate waveform
                        if (window.animationController && 
                            typeof window.animationController.setWaveformActive === 'function') {
                            window.animationController.setWaveformActive(false);
                        }
                        
                        reject(new Error('No audio data recorded'));
                        return;
                    }
                    
                    // Create blob with appropriate mime type
                    const mimeType = mediaRecorder.mimeType || 'audio/webm';
                    const audioBlob = new Blob(audioChunks, { type: mimeType });
                    
                    if (apiState.debug) {
                        console.log(`Recorded audio blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
                    }
                    
                    // Deactivate waveform
                    if (window.animationController && 
                        typeof window.animationController.setWaveformActive === 'function') {
                        window.animationController.setWaveformActive(false);
                    }
                    
                    // Resolve with blob
                    resolve(audioBlob);
                });
                
                mediaRecorder.addEventListener('error', error => {
                    console.error('MediaRecorder error:', error);
                    
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                    
                    // Deactivate waveform
                    if (window.animationController && 
                        typeof window.animationController.setWaveformActive === 'function') {
                        window.animationController.setWaveformActive(false);
                    }
                    
                    reject(error);
                });
                
                // Start recording with small timeslice for more frequent data availability
                mediaRecorder.start(100);
                
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
                
                // Debug indicator for testing
                let debugIndicator = null;
                if (apiState.debug) {
                    debugIndicator = document.createElement('div');
                    debugIndicator.textContent = 'Recording Active';
                    debugIndicator.style.position = 'fixed';
                    debugIndicator.style.bottom = '10px';
                    debugIndicator.style.left = '10px';
                    debugIndicator.style.backgroundColor = 'rgba(255, 42, 42, 0.7)';
                    debugIndicator.style.color = '#fff';
                    debugIndicator.style.padding = '5px 10px';
                    debugIndicator.style.borderRadius = '3px';
                    debugIndicator.style.zIndex = '9999';
                    debugIndicator.style.fontSize = '12px';
                    debugIndicator.id = 'recording-debug-indicator';
                    document.body.appendChild(debugIndicator);
                }
                
                // Stop after maxDuration
                setTimeout(() => {
                    if (mediaRecorder.state === 'recording') {
                        try {
                            mediaRecorder.stop();
                        } catch (error) {
                            console.error('Error stopping MediaRecorder:', error);
                        }
                        
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
                        
                        // Remove debug indicator
                        if (debugIndicator) {
                            debugIndicator.remove();
                        }
                    }
                }, maxDuration);
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                
                // Deactivate waveform
                if (window.animationController && 
                    typeof window.animationController.setWaveformActive === 'function') {
                    window.animationController.setWaveformActive(false);
                }
                
                // Generate appropriate error message
                let errorMessage = 'Error accessing microphone: ';
                
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    errorMessage += 'Permission denied. Please allow microphone access.';
                } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                    errorMessage += 'No microphone found. Please connect a microphone.';
                } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                    errorMessage += 'Microphone is already in use by another application.';
                } else {
                    errorMessage += error.message;
                }
                
                reject(new Error(errorMessage));
            });
    });
}

/**
 * Process voice input using multiple methods with fallbacks
 * @param {number} maxDuration - Maximum recording duration in milliseconds
 * @returns {Promise<string>} Promise that resolves with transcribed text
 */
async function processVoiceInput(maxDuration = 5000) {
    // Display processing message
    if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
        window.terminalInterface.addSystemMessage('Listening...', 'default');
    }
    
    try {
        // Try multiple methods in sequence
        
        // Method 1: Browser's built-in speech recognition via audio processor
        if (window.audioProcessor && typeof window.audioProcessor.processVoiceInput === 'function') {
            try {
                const text = await window.audioProcessor.processVoiceInput(maxDuration);
                if (text && text.trim()) {
                    return processRecognizedText(text);
                }
            } catch (error) {
                console.warn('Built-in speech recognition failed:', error);
                // Continue to next method
            }
        }
        
        // Method 2: Record and send to server-side processing
        try {
            // Record audio
            const audioBlob = await recordAudio(maxDuration);
            
            // Update status message
            if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
                window.terminalInterface.addSystemMessage('Processing voice input...', 'default');
            }
            
            // Create FormData for server request
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            // Send to the server endpoint that handles both transcription and response
            const response = await fetch('/api/process-audio', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.transcription) {
                const text = data.transcription;
                
                // Process the recognized text
                await processRecognizedText(text);
                
                // If the server also returned an AI response, display it
                if (data.response) {
                    if (window.terminalInterface && typeof window.terminalInterface.addAIResponse === 'function') {
                        window.terminalInterface.addAIResponse(data.response);
                    }
                    
                    // Also speak the response if needed
                    if (!data.silent && window.audioProcessor && typeof window.audioProcessor.speakText === 'function') {
                        await window.audioProcessor.speakText(data.response);
                    }
                }
                
                return text;
            } else {
                throw new Error(data.error || 'Failed to transcribe audio');
            }
        } catch (error) {
            console.error('Server-side voice processing failed:', error);
            throw error; // Re-throw as we don't have another fallback
        }
    } catch (error) {
        console.error('All voice processing methods failed:', error);
        
        // Display error message
        if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
            window.terminalInterface.addSystemMessage(`Voice recognition error: ${error.message}`, 'error');
        }
        
        throw error;
    }
}

/**
 * Process recognized text
 * @param {string} text - Recognized text to process
 * @returns {Promise<string>} The processed text
 */
async function processRecognizedText(text) {
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
    
    return text;
}

/**
 * Read file contents - reimplements the window.fs.readFile functionality for browser context
 * @param {string} filename - The name of the file to read
 * @param {Object} options - Optional parameters
 * @returns {Promise} Promise that resolves with file contents
 */
function readFile(filename, options = {}) {
    return new Promise((resolve, reject) => {
        // In the browser context, we need to make a server request to get the file
        fetch(`/api/files/${encodeURIComponent(filename)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to read file ${filename}: ${response.status} ${response.statusText}`);
                }
                
                // Check if response should be returned as text or buffer
                if (options.encoding === 'utf8') {
                    return response.text();
                } else {
                    return response.arrayBuffer().then(buffer => new Uint8Array(buffer));
                }
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                console.error('Error reading file:', error);
                reject(error);
            });
    });
}

/**
 * Set API configuration
 * @param {Object} config - Configuration object
 */
function setApiConfig(config) {
    // Update the configuration
    if (config.elevenLabsApiKey) {
        apiState.elevenLabsApiKey = config.elevenLabsApiKey;
        try {
            localStorage.setItem('elevenLabsApiKey', config.elevenLabsApiKey);
        } catch (e) {
            console.warn('Could not save API key to localStorage:', e);
        }
    }
    
    if (config.openAiApiKey) {
        apiState.openAiApiKey = config.openAiApiKey;
        try {
            localStorage.setItem('openAiApiKey', config.openAiApiKey);
        } catch (e) {
            console.warn('Could not save API key to localStorage:', e);
        }
    }
    
    if (config.voiceId) {
        apiState.voiceId = config.voiceId;
        try {
            localStorage.setItem('voiceId', config.voiceId);
        } catch (e) {
            console.warn('Could not save voice ID to localStorage:', e);
        }
    }
    
    if (config.modelId) {
        apiState.modelId = config.modelId;
        try {
            localStorage.setItem('modelId', config.modelId);
        } catch (e) {
            console.warn('Could not save model ID to localStorage:', e);
        }
    }
    
    if (config.stability !== undefined) {
        apiState.stability = config.stability;
        try {
            localStorage.setItem('stability', config.stability.toString());
        } catch (e) {
            console.warn('Could not save stability to localStorage:', e);
        }
    }
    
    if (config.similarityBoost !== undefined) {
        apiState.similarityBoost = config.similarityBoost;
        try {
            localStorage.setItem('similarityBoost', config.similarityBoost.toString());
        } catch (e) {
            console.warn('Could not save similarityBoost to localStorage:', e);
        }
    }
    
    if (config.debug !== undefined) {
        apiState.debug = config.debug;
    }
    
    // Test API connections with new config
    if (apiState.elevenLabsApiKey || apiState.openAiApiKey) {
        testApiConnections();
    }
    
    return true;
}

/**
 * Get current API configuration
 * @returns {Object} Current API configuration
 */
function getApiConfig() {
    return {
        elevenLabsApiKey: apiState.elevenLabsApiKey ? '****' : '',
        openAiApiKey: apiState.openAiApiKey ? '****' : '',
        voiceId: apiState.voiceId,
        modelId: apiState.modelId,
        stability: apiState.stability,
        similarityBoost: apiState.similarityBoost,
        initialized: apiState.initialized,
        permissionGranted: apiState.permissionGranted
    };
}

// Export functions for use in other files
if (typeof window !== 'undefined') {
    // Add file system API to window for compatibility
    window.fs = {
        readFile: readFile
    };
    
    // Add to window object for access from other scripts
    window.apiClient = {
        initializeApiClient,
        generateSpeech,
        speakText,
        transcribeAudio,
        recordAudio,
        processVoiceInput,
        readFile,
        setApiConfig,
        getApiConfig
    };
}

// Initialize when DOM is loaded if not being imported by another script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize with default settings
        initializeApiClient({
            debug: false // Set to true for verbose logging
        });
    });
} else {
    // If DOM is already loaded
    setTimeout(() => {
        initializeApiClient({
            debug: false // Set to true for verbose logging
        });
    }, 0);
}