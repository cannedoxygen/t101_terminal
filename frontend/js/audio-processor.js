/**
 * audio-processor.js - Audio processing for T-101 AI Voice Terminal
 * Handles speech recognition, audio visualization, and text-to-speech
 */

// Audio state
const audioState = {
    recognition: null,      // Speech recognition instance
    recognizing: false,     // Whether recognition is active
    audioContext: null,     // Audio context for visualization
    analyser: null,         // Audio analyser for visualization
    stream: null,           // Media stream for visualization
    speaking: false,        // Whether TTS is active
    initialized: false,     // Whether audio processor is initialized
    permissionGranted: false, // Whether microphone permission is granted
    fallbackMode: false,    // Whether we're using fallback methods
    recognitionTimeout: null // Timeout for recognition
};

/**
 * Initialize audio processor
 */
function initializeAudioProcessor() {
    console.log('Initializing audio processor...');
    
    if (audioState.initialized) {
        console.log('Audio processor already initialized');
        return;
    }
    
    // Setup speech recognition
    setupSpeechRecognition();
    
    // Setup audio context for visualizations
    setupAudioContext();
    
    // Test browser audio capabilities
    testAudioCapabilities();
    
    audioState.initialized = true;
}

/**
 * Test browser audio capabilities and log results
 */
function testAudioCapabilities() {
    const capabilities = {
        webAudioAPI: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
        speechRecognition: typeof SpeechRecognition !== 'undefined' || typeof webkitSpeechRecognition !== 'undefined',
        speechSynthesis: typeof window.speechSynthesis !== 'undefined',
        mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    };
    
    console.log('Browser audio capabilities:', capabilities);
    
    // Log warning for missing capabilities
    const missing = Object.entries(capabilities)
        .filter(([_, supported]) => !supported)
        .map(([name]) => name);
    
    if (missing.length > 0) {
        console.warn('Missing audio capabilities:', missing.join(', '));
        
        // Show warning in terminal if significant capabilities are missing
        if (missing.includes('speechRecognition') || missing.includes('mediaDevices')) {
            if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
                window.terminalInterface.addSystemMessage(
                    `Warning: Your browser may not fully support audio features (${missing.join(', ')}). For best experience, use Chrome, Edge, or Safari.`,
                    'warning'
                );
            }
        }
    }
}

/**
 * Setup speech recognition with error handling
 */
function setupSpeechRecognition() {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            audioState.fallbackMode = true;
            return;
        }
        
        audioState.recognition = new SpeechRecognition();
        audioState.recognition.continuous = false;  // Less prone to errors
        audioState.recognition.interimResults = true;
        audioState.recognition.lang = 'en-US';
        audioState.recognition.maxAlternatives = 3; // Get multiple alternatives
        
        // Set up handlers
        audioState.recognition.onstart = () => {
            console.log('Recognition started');
            audioState.recognizing = true;
            updateMicUI(true);
            startAudioVisualization();
            
            // Set a timeout to automatically stop if no results in 10 seconds
            audioState.recognitionTimeout = setTimeout(() => {
                if (audioState.recognizing) {
                    console.log('Recognition timeout - stopping recognition');
                    try {
                        audioState.recognition.stop();
                    } catch (e) {
                        console.error('Error stopping recognition after timeout:', e);
                    }
                }
            }, 10000);
        };
        
        audioState.recognition.onend = () => {
            console.log('Recognition ended');
            audioState.recognizing = false;
            updateMicUI(false);
            stopAudioVisualization();
            
            // Clear timeout if set
            if (audioState.recognitionTimeout) {
                clearTimeout(audioState.recognitionTimeout);
                audioState.recognitionTimeout = null;
            }
        };
        
        audioState.recognition.onresult = (event) => {
            // Clear timeout since we got a result
            if (audioState.recognitionTimeout) {
                clearTimeout(audioState.recognitionTimeout);
                audioState.recognitionTimeout = null;
            }
            
            // Get interim and final results
            let finalText = '';
            let interimText = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalText += event.results[i][0].transcript;
                    console.log(`Final result: "${event.results[i][0].transcript}" (confidence: ${event.results[i][0].confidence.toFixed(2)})`);
                } else {
                    interimText += event.results[i][0].transcript;
                }
            }
            
            if (finalText) {
                displayText(finalText, true);
                // Process command
                if (typeof processUserInput === 'function') {
                    processUserInput(finalText);
                } else if (window.terminalInterface && typeof window.terminalInterface.addUserCommand === 'function') {
                    window.terminalInterface.addUserCommand(finalText);
                }
                
                // Stop recognition after final result
                try {
                    audioState.recognition.stop();
                } catch (e) {
                    console.error('Error stopping recognition after final result:', e);
                }
            }
            
            if (interimText) {
                displayText(interimText, false);
            }
        };
        
        audioState.recognition.onerror = (event) => {
            console.error('Recognition error:', event.error);
            
            // Provide more detailed error feedback
            const errorMessages = {
                'no-speech': 'No speech detected. Please try again and speak clearly.',
                'audio-capture': 'Microphone not connected or is being used by another application.',
                'not-allowed': 'Microphone permission denied. Please allow access in your browser settings.',
                'network': 'Network error. Check your internet connection.',
                'aborted': 'Speech recognition was aborted.',
                'service-not-allowed': 'Speech service not allowed in this browser.',
                'bad-grammar': 'Grammar compilation error.'
            };
            
            const message = errorMessages[event.error] || `Recognition error: ${event.error}`;
            
            // Display error in terminal
            if (window.terminalInterface && 
                typeof window.terminalInterface.addSystemMessage === 'function') {
                window.terminalInterface.addSystemMessage(message, 'error');
            }
            
            audioState.recognizing = false;
            updateMicUI(false);
            
            // Clear timeout if set
            if (audioState.recognitionTimeout) {
                clearTimeout(audioState.recognitionTimeout);
                audioState.recognitionTimeout = null;
            }
        };
        
        console.log('Speech recognition initialized successfully');
    } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
        audioState.fallbackMode = true;
        
        // Display error in terminal
        if (window.terminalInterface && 
            typeof window.terminalInterface.addSystemMessage === 'function') {
            window.terminalInterface.addSystemMessage(
                `Speech recognition initialization error: ${error.message}. Using fallback mode.`,
                'error'
            );
        }
    }
}

/**
 * Setup audio context for visualizations
 */
function setupAudioContext() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            console.warn('AudioContext not supported');
            return;
        }
        
        audioState.audioContext = new AudioContext();
        audioState.analyser = audioState.audioContext.createAnalyser();
        
        // Configure analyzer for visualization
        audioState.analyser.fftSize = 256;
        audioState.analyser.smoothingTimeConstant = 0.8;
        
        console.log('Audio context initialized successfully');
    } catch (error) {
        console.error('Failed to initialize audio context:', error);
        
        // Display error in terminal
        if (window.terminalInterface && 
            typeof window.terminalInterface.addSystemMessage === 'function') {
            window.terminalInterface.addSystemMessage(
                `Audio visualization error: ${error.message}. Visualizations may not work properly.`,
                'warning'
            );
        }
    }
}

/**
 * Request microphone permission explicitly
 * @returns {Promise<boolean>} Whether permission was granted
 */
async function requestMicrophonePermission() {
    if (audioState.permissionGranted) {
        return true;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Stop all tracks right away - we just wanted the permission
        stream.getTracks().forEach(track => track.stop());
        
        audioState.permissionGranted = true;
        console.log('Microphone permission granted');
        return true;
    } catch (error) {
        console.error('Microphone permission denied:', error);
        
        // Display error in terminal
        if (window.terminalInterface && 
            typeof window.terminalInterface.addSystemMessage === 'function') {
            
            let errorMessage = 'Microphone access denied: ';
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage += 'Permission denied. Please allow microphone access in your browser settings.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage += 'No microphone found. Please connect a microphone and try again.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage += 'Microphone is already in use by another application.';
            } else {
                errorMessage += error.message;
            }
            
            window.terminalInterface.addSystemMessage(errorMessage, 'error');
        }
        
        audioState.permissionGranted = false;
        return false;
    }
}

/**
 * Start speech recognition with permission check
 */
async function startSpeechRecognition() {
    if (audioState.recognizing) {
        console.log('Speech recognition already active');
        return false;
    }
    
    // First, request microphone permission
    const permissionGranted = await requestMicrophonePermission();
    if (!permissionGranted) {
        console.error('Cannot start recognition without microphone permission');
        return false;
    }
    
    if (!audioState.recognition) {
        console.warn('Speech recognition not available');
        
        // Display error in terminal
        if (window.terminalInterface && 
            typeof window.terminalInterface.addSystemMessage === 'function') {
            window.terminalInterface.addSystemMessage(
                'Speech recognition not available in this browser. Try using Chrome or Edge.',
                'error'
            );
        }
        
        return false;
    }
    
    try {
        audioState.recognition.start();
        console.log('Speech recognition started');
        
        // Create a debug indicator for testing
        const debugIndicator = document.createElement('div');
        debugIndicator.textContent = 'Speech Recognition Active';
        debugIndicator.style.position = 'fixed';
        debugIndicator.style.bottom = '10px';
        debugIndicator.style.left = '10px';
        debugIndicator.style.backgroundColor = 'rgba(255, 42, 42, 0.7)';
        debugIndicator.style.color = '#fff';
        debugIndicator.style.padding = '5px 10px';
        debugIndicator.style.borderRadius = '3px';
        debugIndicator.style.zIndex = '9999';
        debugIndicator.style.fontSize = '12px';
        debugIndicator.id = 'speech-debug-indicator';
        document.body.appendChild(debugIndicator);
        
        // Remove the indicator after 10 seconds (failsafe)
        setTimeout(() => {
            const indicator = document.getElementById('speech-debug-indicator');
            if (indicator) indicator.remove();
        }, 10000);
        
        return true;
    } catch (error) {
        console.error('Error starting recognition:', error);
        
        // Display error in terminal
        if (window.terminalInterface && 
            typeof window.terminalInterface.addSystemMessage === 'function') {
            window.terminalInterface.addSystemMessage(
                `Error starting recognition: ${error.message}`,
                'error'
            );
        }
        
        return false;
    }
}

/**
 * Stop speech recognition
 */
function stopSpeechRecognition() {
    if (!audioState.recognition || !audioState.recognizing) {
        console.log('No active recognition to stop');
        return false;
    }
    
    try {
        audioState.recognition.stop();
        console.log('Speech recognition stopped');
        
        // Remove the debug indicator if it exists
        const indicator = document.getElementById('speech-debug-indicator');
        if (indicator) indicator.remove();
        
        return true;
    } catch (error) {
        console.error('Error stopping recognition:', error);
        
        // Force state reset in case of error
        audioState.recognizing = false;
        updateMicUI(false);
        
        return false;
    }
}

/**
 * Toggle speech recognition
 * @returns {boolean} New recognition state
 */
async function toggleSpeechRecognition() {
    return audioState.recognizing ? 
        stopSpeechRecognition() : 
        await startSpeechRecognition();
}

/**
 * Display recognized text
 * @param {string} text - Text to display
 * @param {boolean} isFinal - Whether this is the final result
 */
function displayText(text, isFinal) {
    // Find user input display
    const userInput = document.getElementById('user-input-display');
    if (!userInput) return;
    
    // Update text content
    userInput.textContent = text;
    
    // Add/remove interim class
    if (isFinal) {
        userInput.classList.remove('interim');
    } else {
        userInput.classList.add('interim');
    }
}

/**
 * Update microphone UI
 * @param {boolean} isRecording - Whether recording is active
 */
function updateMicUI(isRecording) {
    const micToggle = document.getElementById('mic-toggle');
    if (!micToggle) return;
    
    if (isRecording) {
        micToggle.classList.add('recording');
        const micStatus = micToggle.querySelector('.mic-status');
        if (micStatus) micStatus.textContent = 'RECORDING...';
    } else {
        micToggle.classList.remove('recording');
        const micStatus = micToggle.querySelector('.mic-status');
        if (micStatus) micStatus.textContent = 'VOICE INPUT READY';
    }
}

/**
 * Start audio visualization
 */
function startAudioVisualization() {
    if (!audioState.audioContext || !audioState.analyser) {
        console.warn('Audio visualization not available');
        return;
    }
    
    try {
        // Resume context if suspended
        if (audioState.audioContext.state === 'suspended') {
            audioState.audioContext.resume();
        }
        
        // Request microphone access for visualization
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                audioState.stream = stream;
                const source = audioState.audioContext.createMediaStreamSource(stream);
                source.connect(audioState.analyser);
                
                // Start visualization loop
                visualize();
            })
            .catch(error => {
                console.error('Microphone access error:', error);
                
                // Attempt visualization without microphone
                visualizeFallback();
            });
    } catch (error) {
        console.error('Visualization error:', error);
        
        // Attempt visualization without microphone
        visualizeFallback();
    }
}

/**
 * Visualize audio from analyser
 */
function visualize() {
    if (!audioState.analyser || !audioState.recognizing) return;
    
    // Get frequency data
    const dataArray = new Uint8Array(audioState.analyser.frequencyBinCount);
    audioState.analyser.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    
    // Update waveform based on volume
    if (window.animationController && 
        typeof window.animationController.setWaveformActive === 'function') {
        // Scale amplitude based on volume (min 10, max 100)
        const amplitude = Math.max(10, Math.min(100, avg * 2));
        // Scale frequency based on volume (min 1, max 3)
        const frequency = 1 + (avg / 255) * 2;
        
        window.animationController.setWaveformActive(true, amplitude, frequency);
    }
    
    // Continue loop
    requestAnimationFrame(visualize);
}

/**
 * Fallback visualization when microphone access fails
 */
function visualizeFallback() {
    // Use simple animation without audio input
    if (window.animationController && 
        typeof window.animationController.setWaveformActive === 'function') {
        window.animationController.setWaveformActive(true, 40, 2);
        
        // Simulate some movement using timing
        let counter = 0;
        const interval = setInterval(() => {
            if (!audioState.recognizing) {
                clearInterval(interval);
                window.animationController.setWaveformActive(false);
                return;
            }
            
            const amplitude = 30 + Math.sin(counter / 10) * 20;
            const frequency = 1.5 + Math.sin(counter / 15) * 0.5;
            
            window.animationController.setWaveformActive(true, amplitude, frequency);
            counter++;
        }, 100);
    }
}

/**
 * Stop audio visualization
 */
function stopAudioVisualization() {
    // Stop media stream if active
    if (audioState.stream) {
        audioState.stream.getTracks().forEach(track => track.stop());
        audioState.stream = null;
    }
    
    // Deactivate waveform
    if (window.animationController && 
        typeof window.animationController.setWaveformActive === 'function') {
        window.animationController.setWaveformActive(false);
    }
    
    // Remove the debug indicator if it exists
    const indicator = document.getElementById('speech-debug-indicator');
    if (indicator) indicator.remove();
}

/**
 * Record audio from microphone
 * @param {number} maxDuration - Maximum recording duration in milliseconds
 * @returns {Promise<Blob>} Audio blob
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
                // Create recorder with options for better compatibility
                const options = { mimeType: 'audio/webm' };
                let mediaRecorder;
                
                try {
                    mediaRecorder = new MediaRecorder(stream, options);
                } catch (e) {
                    // Try without options if the specified mime type isn't supported
                    console.warn('MediaRecorder with options failed, trying without options:', e);
                    mediaRecorder = new MediaRecorder(stream);
                }
                
                // Store audio chunks
                const audioChunks = [];
                
                // Set up event handlers
                mediaRecorder.addEventListener('dataavailable', event => {
                    // Check data size to ensure we got actual audio
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
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
                
                mediaRecorder.addEventListener('stop', () => {
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                    
                    // Check if we have any audio data
                    if (audioChunks.length === 0) {
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
                    
                    // Add debug log of blob size
                    console.log(`Recorded audio blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
                    
                    // Deactivate waveform
                    if (window.animationController && 
                        typeof window.animationController.setWaveformActive === 'function') {
                        window.animationController.setWaveformActive(false);
                    }
                    
                    // Resolve with blob
                    resolve(audioBlob);
                });
                
                // Start recording with 10ms timeslice for more frequent dataavailable events
                mediaRecorder.start(10);
                console.log('MediaRecorder started', mediaRecorder);
                
                // Show recording indicator
                if (window.hudController && 
                    typeof window.hudController.activateScanning === 'function') {
                    window.hudController.activateScanning(true);
                }
                
                // Update mic button if exists
                updateMicUI(true);
                
                // Create voice wave visualization
                if (window.animationController && 
                    typeof window.animationController.createVoiceWaves === 'function') {
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
                        if (window.hudController && 
                            typeof window.hudController.activateScanning === 'function') {
                            window.hudController.activateScanning(false);
                        }
                        
                        // Update mic button if exists
                        updateMicUI(false);
                        
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
 * Process voice input: record, transcribe, and process
 * @param {number} maxDuration - Maximum recording duration in milliseconds
 * @returns {Promise<string>} Transcribed text
 */
async function processVoiceInput(maxDuration = 5000) {
    // First check for permission to avoid unnecessary UI updates
    const permissionGranted = await requestMicrophonePermission();
    if (!permissionGranted) {
        throw new Error('Microphone permission denied');
    }
    
    // Display processing message
    if (window.terminalInterface && 
        typeof window.terminalInterface.addSystemMessage === 'function') {
        window.terminalInterface.addSystemMessage('Listening...', 'default');
    }
    
    return new Promise((resolve, reject) => {
        // First try built-in speech recognition if available
        if (!audioState.fallbackMode && audioState.recognition) {
            try {
                // Set up one-time result handler
                const resultHandler = (event) => {
                    // Get results
                    const results = event.results;
                    if (results.length > 0 && results[0].isFinal) {
                        const text = results[0][0].transcript;
                        
                        // Clean up event listener
                        audioState.recognition.removeEventListener('result', resultHandler);
                        
                        // Process the text
                        displayAndProcessText(text)
                            .then(resolve)
                            .catch(reject);
                    }
                };
                
                // Set up one-time error handler
                const errorHandler = (event) => {
                    console.error('Recognition error:', event);
                    
                    // Clean up event listeners
                    audioState.recognition.removeEventListener('result', resultHandler);
                    audioState.recognition.removeEventListener('error', errorHandler);
                    
                    // Fall back to recording method
                    console.log('Falling back to recording method');
                    processVoiceWithRecording(maxDuration)
                        .then(resolve)
                        .catch(reject);
                };
                
                // Set up one-time end handler without result
                const endHandler = () => {
                    // Only handle if we haven't already processed a result
                    if (audioState.recognition) {
                        // Clean up event listeners
                        audioState.recognition.removeEventListener('result', resultHandler);
                        audioState.recognition.removeEventListener('error', errorHandler);
                        audioState.recognition.removeEventListener('end', endHandler);
                        
                        // Fall back to recording method if no result
                        console.log('Recognition ended without result, falling back to recording method');
                        processVoiceWithRecording(maxDuration)
                            .then(resolve)
                            .catch(reject);
                    }
                };
                
                // Add event listeners
                audioState.recognition.addEventListener('result', resultHandler);
                audioState.recognition.addEventListener('error', errorHandler);
                audioState.recognition.addEventListener('end', endHandler);
                
                // Start recognition
                audioState.recognition.start();
                
                // Set timeout to cancel if taking too long
                setTimeout(() => {
                    if (audioState.recognizing) {
                        try {
                            // Stop recognition
                            audioState.recognition.stop();
                        } catch (e) {
                            console.error('Error stopping recognition after timeout:', e);
                        }
                    }
                }, maxDuration);
            } catch (error) {
                console.error('Error starting built-in recognition:', error);
                
                // Fall back to recording method
                processVoiceWithRecording(maxDuration)
                    .then(resolve)
                    .catch(reject);
            }
        } else {
            // Use recording method as fallback
            processVoiceWithRecording(maxDuration)
                .then(resolve)
                .catch(reject);
        }
    });
}

/**
 * Process voice input using recording and API
 * @param {number} maxDuration - Maximum recording duration
 * @returns {Promise<string>} Transcribed text
 */
async function processVoiceWithRecording(maxDuration) {
    try {
        // Record audio
        const audioBlob = await recordAudio(maxDuration);
        
        // Display processing message
        if (window.terminalInterface && 
            typeof window.terminalInterface.addSystemMessage === 'function') {
            window.terminalInterface.addSystemMessage('Processing voice input...', 'default');
        }
        
        // Create FormData to send to server
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        
        // Send to server for processing
        const response = await fetch('/api/process-audio', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.transcription) {
            throw new Error(data.error || 'Failed to transcribe audio');
        }
        
        // Process the text
        const text = data.transcription;
        await displayAndProcessText(text);
        
        // If we have a response, add it
        if (data.response) {
            if (window.terminalInterface && 
                typeof window.terminalInterface.addAIResponse === 'function') {
                window.terminalInterface.addAIResponse(data.response);
            }
        }
        
        return text;
    } catch (error) {
        console.error('Error processing voice with recording:', error);
        throw error;
    }
}

/**
 * Display and process transcribed text
 * @param {string} text - Transcribed text
 * @returns {Promise<string>} The processed text
 */
async function displayAndProcessText(text) {
    // Display recognized text
    const userInput = document.getElementById('user-input-display');
    if (userInput) {
        userInput.textContent = text;
    }
    
    // Process user input
    if (typeof processUserInput === 'function') {
        processUserInput(text);
    } else if (window.terminalInterface && 
               typeof window.terminalInterface.addUserCommand === 'function') {
        window.terminalInterface.addUserCommand(text);
    }
    
    return text;
}

/**
 * Speak text using speech synthesis
 * @param {string} text - Text to speak
 * @param {Object} options - Speech options
 * @returns {Promise} Promise that resolves when speech completes
 */
function speakText(text, options = {}) {
    return new Promise((resolve) => {
        // First try to use API client if available
        if (window.apiClient && typeof window.apiClient.speakText === 'function' && !options.useNative) {
            window.apiClient.speakText(text, options)
                .then(resolve)
                .catch(error => {
                    console.error('API client speech error, falling back to native:', error);
                    speakTextNative(text, options).then(resolve);
                });
            return;
        }
        
        // Fall back to native speech synthesis
        speakTextNative(text, options).then(resolve);
    });
}

/**
 * Speak text using browser's native speech synthesis
 * @param {string} text - Text to speak
 * @param {Object} options - Speech options
 * @returns {Promise} Promise that resolves when speech completes
 */
function speakTextNative(text, options = {}) {
    return new Promise((resolve) => {
        try {
            // Check if speech synthesis is available
            if (!window.speechSynthesis) {
                console.warn('Speech synthesis not available');
                resolve(); // Resolve instead of reject to prevent errors
                return;
            }
            
            // Create utterance
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Configure voice
            utterance.rate = options.rate || 0.9;  // Slightly slower
            utterance.pitch = options.pitch || 0.8; // Deeper voice
            utterance.volume = options.volume || 1.0;
            
            // Set a voice if available
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                // Try to find a suitable voice (male, deep, etc.)
                for (const voice of voices) {
                    if (voice.name.includes('Male') || 
                        voice.name.includes('David') || 
                        voice.name.includes('James') || 
                        voice.name.toLowerCase().includes('deep')) {
                        utterance.voice = voice;
                        break;
                    }
                }
                
                // If no suitable voice found, use the first one
                if (!utterance.voice && voices.length > 0) {
                    utterance.voice = voices[0];
                }
            }
            
            // Activate waveform if available
            if (window.animationController && 
                typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(true);
            }
            
            // Set speaking flag
            audioState.speaking = true;
            
            // Handle events
            utterance.onstart = () => {
                console.log('Speech started');
            };
            
            utterance.onend = () => {
                console.log('Speech ended');
                audioState.speaking = false;
                
                // Deactivate waveform
                if (window.animationController && 
                    typeof window.animationController.setWaveformActive === 'function') {
                    window.animationController.setWaveformActive(false);
                }
                
                resolve();
            };
            
            utterance.onerror = (error) => {
                console.error('Speech error:', error);
                audioState.speaking = false;
                
                // Deactivate waveform
                if (window.animationController && 
                    typeof window.animationController.setWaveformActive === 'function') {
                    window.animationController.setWaveformActive(false);
                }
                
                resolve(); // Resolve instead of reject to prevent errors
            };
            
            // Start speech
            window.speechSynthesis.speak(utterance);
            
            // Workaround for Chrome issue where onend doesn't fire
            const checkSpeaking = setInterval(() => {
                if (!window.speechSynthesis.speaking) {
                    clearInterval(checkSpeaking);
                    
                    // If onend hasn't fired after 500ms, manually trigger cleanup
                    setTimeout(() => {
                        if (audioState.speaking) {
                            console.log('Manual cleanup for speech synthesis');
                            audioState.speaking = false;
                            
                            // Deactivate waveform
                            if (window.animationController && 
                                typeof window.animationController.setWaveformActive === 'function') {
                                window.animationController.setWaveformActive(false);
                            }
                            
                            resolve();
                        }
                    }, 500);
                }
            }, 100);
        } catch (error) {
            console.error('Speech synthesis error:', error);
            audioState.speaking = false;
            
            // Deactivate waveform
            if (window.animationController && 
                typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(false);
            }
            
            resolve(); // Resolve instead of reject to prevent errors
        }
    });
}

/**
 * Play sound file
 * @param {string} soundId - ID of audio element or sound name
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
function playSound(soundId, volume = 0.5) {
    try {
        // First try by ID
        let sound = document.getElementById(soundId);
        
        // If not found by ID, try by filename without extension
        if (!sound) {
            const possibleElements = [
                document.getElementById(`${soundId}-sound`),
                document.getElementById(soundId.replace('.mp3', '')),
                document.getElementById(soundId.replace('.wav', ''))
            ];
            
            sound = possibleElements.find(element => element !== null);
        }
        
        // If still not found, try common sound IDs
        if (!sound) {
            const commonSounds = {
                'beep': 'terminal-beep',
                'alert': 'warning-alert',
                'scan': 'hud-scan',
                'startup': 'startup-sound'
            };
            
            if (commonSounds[soundId]) {
                sound = document.getElementById(commonSounds[soundId]);
            }
        }
        
        if (!sound) {
            console.warn(`Sound not found: ${soundId}`);
            return;
        }
        
        // Clone the sound to allow overlapping playback
        const soundClone = sound.cloneNode();
        soundClone.volume = volume;
        
        // Play with error handling
        soundClone.play().catch(error => {
            console.warn('Sound playback error:', error);
            
            // Try with user interaction if autoplay was blocked
            if (error.name === 'NotAllowedError') {
                // We can't play automatically, would need user interaction
                console.warn('Autoplay blocked by browser');
            }
        });
        
        // Remove when finished to prevent memory leaks
        soundClone.onended = () => soundClone.remove();
    } catch (error) {
        console.error('Sound error:', error);
    }
}

/**
 * Check if browser supports necessary audio features
 * @returns {Object} Object containing support status for various features
 */
function checkAudioSupport() {
    return {
        speechRecognition: typeof window.SpeechRecognition !== 'undefined' || 
                         typeof window.webkitSpeechRecognition !== 'undefined',
        speechSynthesis: typeof window.speechSynthesis !== 'undefined',
        audioContext: typeof window.AudioContext !== 'undefined' || 
                    typeof window.webkitAudioContext !== 'undefined',
        mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        mediaRecorder: typeof window.MediaRecorder !== 'undefined'
    };
}

// Export functions for use in other files
window.audioProcessor = {
    initializeAudioProcessor,
    startSpeechRecognition,
    stopSpeechRecognition,
    toggleSpeechRecognition,
    speakText,
    playSound,
    checkAudioSupport,
    processVoiceInput
};

// Initialize when DOM is loaded if not being imported by another script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAudioProcessor);
} else {
    // If DOM is already loaded
    setTimeout(initializeAudioProcessor, 0);
}