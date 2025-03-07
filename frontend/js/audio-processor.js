/**
 * audio-processor.js - Audio processing functionality for T-101 AI Voice Terminal
 * Handles speech recognition, audio visualization, and speech synthesis
 */

// Audio processing state
const audioState = {
    // Speech recognition
    recognition: null,
    recognizing: false,
    lastRecognizedText: '',
    interimResult: '',
    
    // Audio visualization
    audioContext: null,
    analyser: null,
    dataArray: null,
    microphoneStream: null,
    visualizationActive: false,
    
    // Speech synthesis
    speechSynthesis: null,
    voices: [],
    selectedVoice: null,
    speaking: false,
    
    // API status
    elevenLabsApiKey: '',
    whisperApiKey: '',
    useLocalFallback: true,  // Use browser's APIs if external APIs unavailable
    apiInitialized: false
};

/**
 * Initialize audio processor
 * @param {Object} config - Configuration options
 */
function initializeAudioProcessor(config = {}) {
    console.log('Initializing audio processor...');
    
    // Apply config
    if (config.elevenLabsApiKey) {
        audioState.elevenLabsApiKey = config.elevenLabsApiKey;
    }
    
    if (config.whisperApiKey) {
        audioState.whisperApiKey = config.whisperApiKey;
    }
    
    if (config.useLocalFallback !== undefined) {
        audioState.useLocalFallback = config.useLocalFallback;
    }
    
    // Initialize audio context for visualizations
    initializeAudioContext();
    
    // Initialize speech recognition
    initializeSpeechRecognition();
    
    // Initialize speech synthesis
    initializeSpeechSynthesis();
    
    // Mark as initialized
    audioState.apiInitialized = true;
}

/**
 * Initialize Audio Context for visualizations
 */
function initializeAudioContext() {
    try {
        // Create audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioState.audioContext = new AudioContext();
        
        // Create analyser
        audioState.analyser = audioState.audioContext.createAnalyser();
        audioState.analyser.fftSize = 256;
        
        // Create data array for visualization
        const bufferLength = audioState.analyser.frequencyBinCount;
        audioState.dataArray = new Uint8Array(bufferLength);
        
        console.log('Audio context initialized');
    } catch (error) {
        console.error('Error initializing audio context:', error);
    }
}

/**
 * Initialize speech recognition
 */
function initializeSpeechRecognition() {
    // Check if Web Speech API is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported in this browser');
        return;
    }
    
    // Create speech recognition object
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    audioState.recognition = new SpeechRecognition();
    
    // Configure
    audioState.recognition.continuous = true;
    audioState.recognition.interimResults = true;
    audioState.recognition.lang = 'en-US';
    
    // Set up event handlers
    audioState.recognition.onstart = () => {
        console.log('Speech recognition started');
        audioState.recognizing = true;
        
        // Trigger UI updates
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
    };
    
    audioState.recognition.onend = () => {
        console.log('Speech recognition ended');
        audioState.recognizing = false;
        
        // Trigger UI updates
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
    };
    
    audioState.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        // Process results
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update state
        if (finalTranscript) {
            audioState.lastRecognizedText = finalTranscript;
            
            // Display recognized text
            displayRecognizedText(finalTranscript, true);
            
            // Process the command
            if (typeof processUserInput === 'function') {
                processUserInput(finalTranscript);
            }
        }
        
        if (interimTranscript) {
            audioState.interimResult = interimTranscript;
            
            // Display interim result
            displayRecognizedText(interimTranscript, false);
        }
    };
    
    audioState.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Show error in UI
        const errorMessages = {
            'no-speech': 'No speech detected',
            'audio-capture': 'Audio capture failed',
            'not-allowed': 'Microphone access denied',
            'network': 'Network error',
            'aborted': 'Recognition aborted',
            'service-not-allowed': 'Service not allowed'
        };
        
        const errorMessage = errorMessages[event.error] || `Error: ${event.error}`;
        
        // Display error in terminal if available
        if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
            window.terminalInterface.addSystemMessage(errorMessage, 'error');
        } else {
            console.error(errorMessage);
        }
        
        // Stop recognition
        stopSpeechRecognition();
    };
    
    console.log('Speech recognition initialized');
}

/**
 * Initialize speech synthesis
 */
function initializeSpeechSynthesis() {
    // Check if Web Speech API synthesis is available
    if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported in this browser');
        return;
    }
    
    // Store reference
    audioState.speechSynthesis = window.speechSynthesis;
    
    // Load available voices
    loadVoices();
    
    // Chrome loads voices asynchronously, so we need to wait for them
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    console.log('Speech synthesis initialized');
}

/**
 * Load available voices for speech synthesis
 */
function loadVoices() {
    // Get all available voices
    audioState.voices = audioState.speechSynthesis.getVoices();
    
    // Select a suitable voice (prefer deep, male voices for T-101)
    let selectedVoice = null;
    
    // Try to find a good match
    for (const voice of audioState.voices) {
        // Ideal matches
        if (voice.name.toLowerCase().includes('daniel') || 
            voice.name.toLowerCase().includes('google uk english male') ||
            voice.name.toLowerCase().includes('microsoft david')) {
            selectedVoice = voice;
            break;
        }
    }
    
    // If no ideal match, try any male voice
    if (!selectedVoice) {
        for (const voice of audioState.voices) {
            if (voice.name.toLowerCase().includes('male')) {
                selectedVoice = voice;
                break;
            }
        }
    }
    
    // Finally, just pick the first voice if still no match
    if (!selectedVoice && audioState.voices.length > 0) {
        selectedVoice = audioState.voices[0];
    }
    
    // Store selected voice
    audioState.selectedVoice = selectedVoice;
    
    console.log('Voices loaded, selected:', selectedVoice ? selectedVoice.name : 'None available');
}

/**
 * Start speech recognition
 */
function startSpeechRecognition() {
    if (!audioState.recognition) {
        console.warn('Speech recognition not initialized');
        return;
    }
    
    if (audioState.recognizing) {
        // Already recognizing, stop first
        audioState.recognition.stop();
    }
    
    try {
        audioState.recognition.start();
        
        // Start audio visualization
        startAudioVisualization();
        
        return true;
    } catch (error) {
        console.error('Error starting speech recognition:', error);
        return false;
    }
}

/**
 * Stop speech recognition
 */
function stopSpeechRecognition() {
    if (!audioState.recognition) return;
    
    try {
        if (audioState.recognizing) {
            audioState.recognition.stop();
        }
        
        // Stop audio visualization
        stopAudioVisualization();
        
        return true;
    } catch (error) {
        console.error('Error stopping speech recognition:', error);
        return false;
    }
}

/**
 * Toggle speech recognition
 * @returns {boolean} New recognition state
 */
function toggleSpeechRecognition() {
    if (audioState.recognizing) {
        return !stopSpeechRecognition();
    } else {
        return startSpeechRecognition();
    }
}

/**
 * Display recognized text in user input area
 * @param {string} text - Recognized text
 * @param {boolean} isFinal - Whether this is a final result
 */
function displayRecognizedText(text, isFinal) {
    // Get user input display element
    const userInput = document.getElementById('user-input-display');
    if (!userInput) return;
    
    // Update text
    userInput.textContent = text;
    
    // Add/remove interim class
    if (isFinal) {
        userInput.classList.remove('interim');
    } else {
        userInput.classList.add('interim');
    }
}

/**
 * Speak text using selected voice
 * @param {string} text - Text to speak
 * @param {Object} options - Speech options
 * @returns {Promise} Promise that resolves when speech completes
 */
function speakText(text, options = {}) {
    return new Promise((resolve, reject) => {
        // If ElevenLabs API key is set, try to use that
        if (audioState.elevenLabsApiKey && !options.useLocalFallback) {
            speakWithElevenLabs(text, options)
                .then(resolve)
                .catch(error => {
                    console.warn('ElevenLabs speech failed, falling back to local synthesis:', error);
                    
                    // Fall back to local synthesis
                    speakWithLocalSynthesis(text, options)
                        .then(resolve)
                        .catch(reject);
                });
            return;
        }
        
        // Otherwise use local speech synthesis
        speakWithLocalSynthesis(text, options)
            .then(resolve)
            .catch(reject);
    });
}

/**
 * Speak text using local speech synthesis
 * @param {string} text - Text to speak
 * @param {Object} options - Speech options
 * @returns {Promise} Promise that resolves when speech completes
 */
function speakWithLocalSynthesis(text, options = {}) {
    return new Promise((resolve, reject) => {
        if (!audioState.speechSynthesis) {
            reject(new Error('Speech synthesis not available'));
            return;
        }
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set options
        utterance.voice = audioState.selectedVoice;
        utterance.pitch = options.pitch !== undefined ? options.pitch : 0.8; // Lower pitch for T-101
        utterance.rate = options.rate !== undefined ? options.rate : 0.9;   // Slightly slower
        utterance.volume = options.volume !== undefined ? options.volume : 1.0;
        
        // Set up event handlers
        utterance.onstart = () => {
            console.log('Speech started');
            audioState.speaking = true;
            
            // Activate waveform if available
            if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(true);
            }
        };
        
        utterance.onend = () => {
            console.log('Speech ended');
            audioState.speaking = false;
            
            // Deactivate waveform
            if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(false);
            }
            
            resolve();
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            audioState.speaking = false;
            
            // Deactivate waveform
            if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(false);
            }
            
            reject(new Error(`Speech synthesis error: ${event.error}`));
        };
        
        // Speak
        audioState.speechSynthesis.speak(utterance);
    });
}

/**
 * Speak text using ElevenLabs API
 * @param {string} text - Text to speak
 * @param {Object} options - Speech options
 * @returns {Promise} Promise that resolves when speech completes
 */
function speakWithElevenLabs(text, options = {}) {
    return new Promise((resolve, reject) => {
        if (!audioState.elevenLabsApiKey) {
            reject(new Error('ElevenLabs API key not set'));
            return;
        }
        
        // Define the voice ID to use
        // This should be replaced with an actual voice ID from ElevenLabs
        const voiceId = options.voiceId || 'pNInz6obpgDQGcFmaJgB'; // Default to a deep, masculine voice
        
        // API endpoint
        const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        
        // Request parameters
        const requestBody = {
            text: text,
            model_id: options.modelId || 'eleven_monolingual_v1',
            voice_settings: {
                stability: options.stability !== undefined ? options.stability : 0.75,
                similarity_boost: options.similarityBoost !== undefined ? options.similarityBoost : 0.8
            }
        };
        
        // Set up request
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': audioState.elevenLabsApiKey
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
            // Create audio element
            const audioElement = new Audio();
            audioElement.src = URL.createObjectURL(audioBlob);
            
            // Set up event handlers
            audioElement.onplay = () => {
                console.log('ElevenLabs speech started');
                audioState.speaking = true;
                
                // Activate waveform if available
                if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                    window.animationController.setWaveformActive(true);
                }
            };
            
            audioElement.onended = () => {
                console.log('ElevenLabs speech ended');
                audioState.speaking = false;
                
                // Clean up blob URL
                URL.revokeObjectURL(audioElement.src);
                
                // Deactivate waveform
                if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                    window.animationController.setWaveformActive(false);
                }
                
                resolve();
            };
            
            audioElement.onerror = (error) => {
                console.error('Error playing ElevenLabs audio:', error);
                audioState.speaking = false;
                
                // Clean up blob URL
                URL.revokeObjectURL(audioElement.src);
                
                // Deactivate waveform
                if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                    window.animationController.setWaveformActive(false);
                }
                
                reject(new Error('Error playing ElevenLabs audio'));
            };
            
            // Play the audio
            audioElement.play();
        })
        .catch(error => {
            console.error('ElevenLabs API error:', error);
            reject(error);
        });
    });
}

/**
 * Start audio visualization
 */
function startAudioVisualization() {
    if (!audioState.audioContext || audioState.visualizationActive) return;
    
    // Get user media
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
            // Store stream
            audioState.microphoneStream = stream;
            
            // Create source from microphone
            const source = audioState.audioContext.createMediaStreamSource(stream);
            
            // Connect to analyser
            source.connect(audioState.analyser);
            
            // Mark as active
            audioState.visualizationActive = true;
            
            // Start visualization loop
            visualize();
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
        });
}

/**
 * Stop audio visualization
 */
function stopAudioVisualization() {
    if (!audioState.visualizationActive) return;
    
    // Stop all tracks
    if (audioState.microphoneStream) {
        audioState.microphoneStream.getTracks().forEach(track => track.stop());
        audioState.microphoneStream = null;
    }
    
    // Mark as inactive
    audioState.visualizationActive = false;
}

/**
 * Visualize audio data
 */
function visualize() {
    if (!audioState.visualizationActive) return;
    
    // Get waveform data
    audioState.analyser.getByteFrequencyData(audioState.dataArray);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < audioState.dataArray.length; i++) {
        sum += audioState.dataArray[i];
    }
    const average = sum / audioState.dataArray.length;
    
    // Map average to amplitude
    const amplitude = Math.max(10, average * 2);
    
    // Update waveform if available
    if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
        window.animationController.setWaveformActive(true, amplitude, 3);
    }
    
    // Continue visualization loop
    requestAnimationFrame(visualize);
}

/**
 * Transcribe audio file using Whisper API
 * @param {File} audioFile - Audio file to transcribe
 * @returns {Promise} Promise that resolves with transcription
 */
function transcribeAudioFile(audioFile) {
    return new Promise((resolve, reject) => {
        if (!audioState.whisperApiKey) {
            reject(new Error('Whisper API key not set'));
            return;
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', 'whisper-1');
        
        // Set up request
        fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${audioState.whisperApiKey}`
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
            console.log('Transcription received:', data);
            resolve(data.text);
        })
        .catch(error => {
            console.error('Whisper API error:', error);
            reject(error);
        });
    });
}

// Export functions for use in other files
if (typeof window !== 'undefined') {
    // Add to window object for access from other scripts
    window.audioProcessor = {
        initializeAudioProcessor,
        startSpeechRecognition,
        stopSpeechRecognition,
        toggleSpeechRecognition,
        speakText,
        transcribeAudioFile
    };
}