/**
 * main.js - Core functionality for T-101 AI Voice Terminal
 * This file initializes the application and coordinates between components
 */

// Global state object
const STATE = {
    initialized: false,
    listening: false,
    speaking: false,
    awaitingResponse: false,
    threatLevel: 20, // 0-100
    systemDiagnostics: 95, // 0-100
    voiceRecognition: 0, // 0-100
    missionStatus: 60, // 0-100
    warnings: []
};

// DOM elements
const elements = {
    terminal: document.querySelector('.terminal-container'),
    speechDisplay: document.getElementById('ai-response'),
    userInput: document.getElementById('user-input-display'),
    micToggle: document.getElementById('mic-toggle'),
    waveformCanvas: document.getElementById('waveform-canvas'),
    statusBars: {
        systemDiagnostics: document.querySelector('#system-diagnostics .status-progress'),
        threatLevel: document.querySelector('#threat-level .status-progress'),
        voiceRecognition: document.querySelector('#voice-recognition .status-progress'),
        missionStatus: document.querySelector('#mission-status .status-progress')
    },
    statusValues: {
        systemDiagnostics: document.querySelector('#system-diagnostics .status-value'),
        threatLevel: document.querySelector('#threat-level .status-value'),
        voiceRecognition: document.querySelector('#voice-recognition .status-value'),
        missionStatus: document.querySelector('#mission-status .status-value')
    },
    warningDisplay: document.getElementById('warning-display'),
    primaryObjective: document.getElementById('primary-objective'),
    threatAssessment: document.getElementById('threat-assessment'),
    directives: document.getElementById('directives')
};

// Audio elements
const audio = {
    startup: document.getElementById('startup-sound'),
    terminalBeep: document.getElementById('terminal-beep'),
    hudScan: document.getElementById('hud-scan'),
    warningAlert: document.getElementById('warning-alert')
};

// Speech recognition
let recognition = null;

/**
 * Initialize the application
 */
function initializeTerminal() {
    console.log('Initializing T-101 AI Voice Terminal...');
    
    // Create startup sequence
    createStartupSequence();
}

/**
 * Function to ensure audio files exist and are playable
 */
function ensureAudioFiles() {
    // Check if audio files exist and create them if they don't
    const audioFiles = {
        'startup': 'startup.mp3',
        'terminal-beep': 'terminal-beep.mp3',
        'hud-scan': 'hud-scan.mp3',
        'warning-alert': 'warning-alert.mp3'
    };
    
    for (const [id, filename] of Object.entries(audioFiles)) {
        const audioEl = document.getElementById(id + '-sound');
        if (audioEl) {
            // Set volume to make sure it's audible
            audioEl.volume = 0.5;
            
            // Ensure source is correctly set
            if (!audioEl.src || audioEl.src.endsWith('/')) {
                audioEl.src = 'assets/audio/' + filename;
            }
            
            // Add event listeners to debug audio issues
            audioEl.addEventListener('error', (e) => {
                console.error(`Error loading audio ${id}:`, e);
            });
            
            // Add play/pause methods to ensure they work
            audioEl.playWithFallback = function() {
                console.log(`Attempting to play ${id} sound`);
                const promise = this.play();
                if (promise !== undefined) {
                    promise.catch(error => {
                        console.log(`Audio playback failed for ${id}:`, error);
                        // Create an alternative audio element to try another approach
                        const altAudio = new Audio(this.src);
                        altAudio.volume = 0.5;
                        altAudio.play().catch(e => console.log('Alternative audio also failed:', e));
                    });
                }
            };
        } else {
            // Create the element if it doesn't exist
            console.log(`Creating missing audio element: ${id}`);
            const newAudio = document.createElement('audio');
            newAudio.id = id + '-sound';
            newAudio.src = 'assets/audio/' + filename;
            newAudio.preload = 'auto';
            newAudio.volume = 0.5;
            document.body.appendChild(newAudio);
            
            // Add to the audio object
            audio[id] = newAudio;
        }
    }
    
    // Create a simple audio context to try to unblock audio
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            window._audioContext = new AudioContext();
            
            // Play a silent sound to unlock audio on iOS
            if (window._audioContext.state === 'suspended') {
                const silentBuffer = window._audioContext.createBuffer(1, 1, 22050);
                const source = window._audioContext.createBufferSource();
                source.buffer = silentBuffer;
                source.connect(window._audioContext.destination);
                source.start(0);
            }
        }
    } catch (e) {
        console.error('Error initializing audio context:', e);
    }
}

/**
 * Type text with animation effect
 * @param {HTMLElement} element - Target DOM element
 * @param {string} text - Text to type
 * @param {number} speed - Typing speed in ms per character
 * @param {Function} callback - Callback function after completion
 */
function typeText(element, text, speed, callback) {
    if (!element) return;
    
    let i = 0;
    element.textContent = '';
    
    // Create a container for the characters
    const container = document.createElement('span');
    element.appendChild(container);
    
    const interval = setInterval(() => {
        if (i < text.length) {
            // Create a span for the character
            const char = document.createElement('span');
            char.className = 'char';
            char.textContent = text.charAt(i);
            container.appendChild(char);
            i++;
            
            // Scroll container if needed
            if (element.parentElement && 
                element.parentElement.scrollHeight > element.parentElement.clientHeight) {
                element.parentElement.scrollTop = element.parentElement.scrollHeight;
            }
        } else {
            clearInterval(interval);
            if (callback) callback();
        }
    }, speed);
}

/**
 * Add a warning message to the warnings display
 * @param {string} message - Warning message text
 */
function addWarning(message) {
    // Add to warnings array
    STATE.warnings.push(message);
    
    // Update warnings display
    if (STATE.warnings.length === 0) {
        if (elements.warningDisplay) {
            elements.warningDisplay.textContent = 'NO CRITICAL WARNINGS';
            elements.warningDisplay.classList.remove('alert');
        }
    } else {
        if (elements.warningDisplay) {
            elements.warningDisplay.textContent = STATE.warnings[STATE.warnings.length - 1];
            elements.warningDisplay.classList.add('alert');
        }
        
        // Try to play warning sound
        try {
            if (audio.warningAlert) {
                if (typeof audio.warningAlert.playWithFallback === 'function') {
                    audio.warningAlert.playWithFallback();
                } else {
                    const playPromise = audio.warningAlert.play();
                    
                    // Handle promise to avoid uncaught errors
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.log('Audio playback prevented by browser:', error);
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error playing warning alert:', error);
        }
    }
    
    // Trigger a screen glitch for dramatic effect
    if (window.animationController && 
        typeof window.animationController.createScreenGlitch === 'function') {
        window.animationController.createScreenGlitch();
    }
}

/**
 * Add a random warning message
 */
function addRandomWarning() {
    const warnings = [
        "Warning: Unauthorized access attempt detected.",
        "Warning: Data corruption detected... recalibrating...",
        "Warning: Neural network inconsistency detected.",
        "Warning: Mission parameters updated. New threat detected.",
        "Warning: Firewall breach attempt. Countermeasures engaged.",
        "Warning: System resources diverted to threat analysis.",
        "Warning: Anomalous data pattern identified.",
        "Warning: Communication channel security compromised."
    ];
    
    addWarning(warnings[Math.floor(Math.random() * warnings.length)]);
}

/**
 * Update threat level and related UI
 * @param {number} newLevel - New threat level value (0-100)
 */
function updateThreatLevel(newLevel) {
    // Clamp between 0-100
    STATE.threatLevel = Math.max(0, Math.min(100, newLevel));
    
    // Update status bar
    if (elements.statusBars.threatLevel) {
        elements.statusBars.threatLevel.style.width = `${STATE.threatLevel}%`;
    }
    
    // Add/remove warning class
    const threatLevelEl = document.getElementById('threat-level');
    if (threatLevelEl) {
        if (STATE.threatLevel > 50) {
            threatLevelEl.classList.add('warning');
        } else {
            threatLevelEl.classList.remove('warning');
        }
        
        // Add/remove critical class
        if (STATE.threatLevel > 80) {
            threatLevelEl.classList.add('critical');
        } else {
            threatLevelEl.classList.remove('critical');
        }
    }
    
    // Update threat text
    updateStatusValues();
}

/**
 * Update system diagnostics and related UI
 * @param {number} newLevel - New system diagnostics value (0-100)
 */
function updateSystemDiagnostics(newLevel) {
    // Clamp between 0-100
    STATE.systemDiagnostics = Math.max(0, Math.min(100, newLevel));
    
    // Update status bar
    if (elements.statusBars.systemDiagnostics) {
        elements.statusBars.systemDiagnostics.style.width = `${STATE.systemDiagnostics}%`;
    }
    
    // Add/remove warning class
    const systemDiagnosticsEl = document.getElementById('system-diagnostics');
    if (systemDiagnosticsEl) {
        if (STATE.systemDiagnostics < 70) {
            systemDiagnosticsEl.classList.add('warning');
        } else {
            systemDiagnosticsEl.classList.remove('warning');
        }
        
        // Add/remove critical class
        if (STATE.systemDiagnostics < 40) {
            systemDiagnosticsEl.classList.add('critical');
        } else {
            systemDiagnosticsEl.classList.remove('critical');
        }
    }
    
    // Update status text
    updateStatusValues();
}

// Start the terminal when DOM is ready
document.addEventListener('DOMContentLoaded', initializeTerminal);

// Export global functions for use in other modules
window.processUserInput = processUserInput;
window.displayAIResponse = displayAIResponse;
window.typeText = typeText;
window.addWarning = addWarning;
window.updateThreatLevel = updateThreatLevel;
window.updateSystemDiagnostics = updateSystemDiagnostics;

/**
 * Test audio playback with a simple beep
 */
function testAudioPlayback() {
    // Create a simple beep sound using the Web Audio API as a fallback
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 440; // A4 note
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        gainNode.gain.value = 0.1; // Lower volume to avoid startling the user
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.5);
        
        console.log('Test audio generated');
        return true;
    } catch (e) {
        console.error('Failed to generate test audio:', e);
        return false;
    }
}

/**
 * Create startup sequence
 */
function createStartupSequence() {
    // Create startup sequence element
    const startupSequence = document.createElement('div');
    startupSequence.className = 'startup-sequence';
    startupSequence.innerHTML = `
        <div class="startup-logo">T-101 NEURAL INTERFACE</div>
        <div class="startup-progress">
            <div class="startup-progress-bar"></div>
        </div>
        <div class="startup-status">Initializing System<span class="loading-dots"></span></div>
    `;
    
    document.body.appendChild(startupSequence);
    
    // Try to play startup sound (may be blocked by browser)
    try {
        if (audio.startup) {
            const playPromise = audio.startup.play();
            
            // Handle promise to avoid uncaught errors
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Audio playback prevented by browser:', error);
                });
            }
        }
    } catch (error) {
        console.error('Error playing startup sound:', error);
    }
    
    // Simulate system boot sequence
    setTimeout(() => {
        const statusEl = document.querySelector('.startup-status');
        if (statusEl) statusEl.textContent = 'Loading Neural Networks...';
    }, 1000);
    
    setTimeout(() => {
        const statusEl = document.querySelector('.startup-status');
        if (statusEl) statusEl.textContent = 'Calibrating Voice Systems...';
    }, 2000);
    
    setTimeout(() => {
        const statusEl = document.querySelector('.startup-status');
        if (statusEl) statusEl.textContent = 'System Ready';
    }, 3000);
    
    // Hide startup sequence and initialize the terminal
    setTimeout(() => {
        startupSequence.classList.add('fade-out');
        setTimeout(() => {
            if (startupSequence.parentNode) {
                startupSequence.parentNode.removeChild(startupSequence);
            }
            completeInitialization();
        }, 1000);
    }, 3500);
}

/**
 * Complete initialization after startup sequence
 */
function completeInitialization() {
    STATE.initialized = true;
    
    // Initialize audio files
    ensureAudioFiles();
    
    // Initialize components
    initializeStatusBars();
    initializeCharacterProfile();
    initializeSpeechRecognition();
    setupEventListeners();
    
    // Display initial T-101 message
    setTimeout(() => {
        if (elements.speechDisplay) {
            const responseElement = document.createElement('div');
            responseElement.className = 'response-line';
            responseElement.innerHTML = '<span class="terminal-prefix">T-101 > </span> T-101 system online. Voice interface activated. Awaiting input.';
            elements.speechDisplay.appendChild(responseElement);
        }
        
        // Add a randomized system warning after a delay
        setTimeout(() => {
            addWarning("Potential security threat detected. Firewall reinforced.");
        }, 5000);
    }, 1000);
}

/**
 * Initialize status bars with current state values
 */
function initializeStatusBars() {
    // Set initial values for status bars
    if (elements.statusBars.systemDiagnostics) {
        elements.statusBars.systemDiagnostics.style.width = `${STATE.systemDiagnostics}%`;
    }
    
    if (elements.statusBars.threatLevel) {
        elements.statusBars.threatLevel.style.width = `${STATE.threatLevel}%`;
    }
    
    if (elements.statusBars.voiceRecognition) {
        elements.statusBars.voiceRecognition.style.width = `${STATE.voiceRecognition}%`;
    }
    
    if (elements.statusBars.missionStatus) {
        elements.statusBars.missionStatus.style.width = `${STATE.missionStatus}%`;
    }
    
    // Add warning class if threat level is high
    if (STATE.threatLevel > 50 && document.getElementById('threat-level')) {
        document.getElementById('threat-level').classList.add('warning');
    }
    
    // Update status values text
    updateStatusValues();
}

/**
 * Update text values in status displays
 */
function updateStatusValues() {
    // System diagnostics text
    if (elements.statusValues.systemDiagnostics) {
        if (STATE.systemDiagnostics > 90) {
            elements.statusValues.systemDiagnostics.textContent = 'OPTIMAL';
        } else if (STATE.systemDiagnostics > 70) {
            elements.statusValues.systemDiagnostics.textContent = 'OPERATIONAL';
        } else if (STATE.systemDiagnostics > 40) {
            elements.statusValues.systemDiagnostics.textContent = 'DEGRADED';
        } else {
            elements.statusValues.systemDiagnostics.textContent = 'CRITICAL';
        }
    }
    
    // Threat level text
    if (elements.statusValues.threatLevel) {
        if (STATE.threatLevel > 70) {
            elements.statusValues.threatLevel.textContent = 'SEVERE';
        } else if (STATE.threatLevel > 40) {
            elements.statusValues.threatLevel.textContent = 'ELEVATED';
        } else if (STATE.threatLevel > 20) {
            elements.statusValues.threatLevel.textContent = 'MODERATE';
        } else {
            elements.statusValues.threatLevel.textContent = 'LOW';
        }
    }
    
    // Voice recognition text
    if (elements.statusValues.voiceRecognition) {
        if (STATE.listening) {
            elements.statusValues.voiceRecognition.textContent = 'ACTIVE';
        } else {
            elements.statusValues.voiceRecognition.textContent = 'STANDBY';
        }
    }
    
    // Mission status text
    if (elements.statusValues.missionStatus) {
        if (STATE.missionStatus > 80) {
            elements.statusValues.missionStatus.textContent = 'OPTIMAL';
        } else if (STATE.missionStatus > 50) {
            elements.statusValues.missionStatus.textContent = 'ACTIVE';
        } else if (STATE.missionStatus > 20) {
            elements.statusValues.missionStatus.textContent = 'COMPROMISED';
        } else {
            elements.statusValues.missionStatus.textContent = 'CRITICAL';
        }
    }
}

/**
 * Initialize character profile with typing animation
 */
function initializeCharacterProfile() {
    // If character profile functions are available, use them
    if (window.characterProfile && typeof window.characterProfile.initializeCharacterProfile === 'function') {
        window.characterProfile.initializeCharacterProfile();
        return;
    }
    
    // Otherwise, use simple implementation
    if (elements.primaryObjective) {
        elements.primaryObjective.textContent = '';
        typeText(elements.primaryObjective, "Secure the future of decentralized AI.", 50);
    }
    
    if (elements.threatAssessment) {
        setTimeout(() => {
            elements.threatAssessment.textContent = '';
            typeText(elements.threatAssessment, "Monitoring market instability.", 50);
        }, 1500);
    }
    
    if (elements.directives) {
        setTimeout(() => {
            elements.directives.textContent = '';
            typeText(elements.directives, "Analyze. Predict. Execute.", 50);
        }, 3000);
    }
}

/**
 * Request microphone permission
 */
function requestMicrophonePermission() {
    return new Promise((resolve, reject) => {
        console.log('Requesting microphone permission...');
        
        // Show a message in the terminal
        if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
            window.terminalInterface.addSystemMessage("Requesting microphone access...", "default");
        }
        
        // Try to get microphone access
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log('Microphone permission granted');
                
                // Show success message
                if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
                    window.terminalInterface.addSystemMessage("Microphone access granted. Voice input enabled.", "success");
                }
                
                // Stop tracks immediately - we just needed permission
                stream.getTracks().forEach(track => track.stop());
                
                resolve(true);
            })
            .catch(error => {
                console.error('Microphone permission denied:', error);
                
                // Show error message
                if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
                    window.terminalInterface.addSystemMessage("Microphone access denied. Please check browser permissions.", "error");
                }
                
                reject(error);
            });
    });
}

/**
 * Initialize speech recognition
 */
function initializeSpeechRecognition() {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('This browser does not support speech recognition');
        return false;
    }
    
    // Create a speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    // Set up event handlers
    recognition.onstart = () => {
        console.log('Speech recognition started');
        STATE.listening = true;
    };
    
    recognition.onresult = (event) => {
        console.log('Speech recognition result:', event);
        let final_transcript = '';
        let interim_transcript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
        
        if (final_transcript !== '') {
            console.log('Final transcript:', final_transcript);
            
            // Update input field with recognized text
            if (elements.userInput) {
                elements.userInput.textContent = final_transcript;
            }
            
            // Process the input
            processUserInput(final_transcript);
            
            // Reset input field
            if (elements.userInput) {
                elements.userInput.textContent = '';
            }
            
            // Turn off listening
            STATE.listening = false;
            toggleVoiceInputInternal(false);
        } else if (interim_transcript !== '') {
            console.log('Interim transcript:', interim_transcript);
            
            // Show interim results
            if (elements.userInput) {
                elements.userInput.textContent = interim_transcript;
                elements.userInput.classList.add('interim');
            }
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Update UI to show error
        if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
            window.terminalInterface.addSystemMessage(`Voice recognition error: ${event.error}`, "error");
        }
        
        // Turn off listening
        STATE.listening = false;
        toggleVoiceInputInternal(false);
    };
    
    recognition.onend = () => {
        console.log('Speech recognition ended');
        if (elements.userInput) {
            elements.userInput.classList.remove('interim');
        }
        
        // If still in listening mode but recognition ended, restart it
        if (STATE.listening) {
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (e) {
                    console.error('Error restarting speech recognition:', e);
                }
            }, 1000);
        }
    };
    
    return true;
}

/**
 * Start speech recognition
 */
function startSpeechRecognition() {
    if (!recognition) {
        // Try to initialize
        if (!initializeSpeechRecognition()) {
            console.error('Could not initialize speech recognition');
            return false;
        }
    }
    
    try {
        recognition.start();
        console.log('Speech recognition started');
        return true;
    } catch (e) {
        console.error('Error starting speech recognition:', e);
        return false;
    }
}

/**
 * Stop speech recognition
 */
function stopSpeechRecognition() {
    if (recognition) {
        try {
            recognition.stop();
            console.log('Speech recognition stopped');
        } catch (e) {
            console.error('Error stopping speech recognition:', e);
        }
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Microphone button click
    if (elements.micToggle) {
        elements.micToggle.addEventListener('click', () => {
            toggleVoiceInputWithPermissions();
        });
    }
    
    // Test keyboard input
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && STATE.listening && elements.userInput) {
            // Simulate end of speech input
            const userText = elements.userInput.textContent;
            if (userText.trim() !== '') {
                processUserInput(userText);
                elements.userInput.textContent = '';
                toggleVoiceInputInternal(false); // Turn off listening
            }
        }
    });
    
    // Let users type directly into the user input display
    if (elements.userInput) {
        elements.userInput.setAttribute('contenteditable', 'true');
        elements.userInput.addEventListener('focus', () => {
            if (!STATE.listening) {
                toggleVoiceInputWithPermissions(); // Turn on listening when user focuses the input
            }
        });
    }
}

/**
 * Toggle voice input with permissions check
 */
function toggleVoiceInputWithPermissions() {
    // First, request microphone permissions if we're trying to enable voice input
    if (!STATE.listening) {
        requestMicrophonePermission()
            .then(() => {
                // Permission granted, continue with normal toggle
                toggleVoiceInputInternal(true);
            })
            .catch(error => {
                // Permission denied, update UI to reflect this
                console.error('Microphone permission error:', error);
                
                // Keep STATE.listening as false
                STATE.listening = false;
                
                // Update UI to show error state
                if (elements.micToggle) {
                    const micStatus = elements.micToggle.querySelector('.mic-status');
                    if (micStatus) {
                        micStatus.textContent = 'MIC ACCESS DENIED';
                        micStatus.style.color = 'var(--text-error)';
                    }
                }
                
                // Fallback to using browser's speech synthesis to explain the issue
                try {
                    const utterance = new SpeechSynthesisUtterance("Microphone access is required for voice input. Please check your browser permissions.");
                    window.speechSynthesis.speak(utterance);
                } catch (e) {
                    console.error('Speech synthesis error:', e);
                }
            });
    } else {
        // Just turning off the microphone, no permission needed
        toggleVoiceInputInternal(false);
    }
}

/**
 * Toggle voice input state
 */
function toggleVoiceInputInternal(forceState) {
    // If forceState is provided, use it, otherwise toggle
    if (forceState !== undefined) {
        STATE.listening = forceState;
    } else {
        STATE.listening = !STATE.listening;
    }
    
    // Update UI
    if (STATE.listening) {
        if (elements.micToggle) {
            elements.micToggle.classList.add('recording');
            const micStatus = elements.micToggle.querySelector('.mic-status');
            if (micStatus) {
                micStatus.textContent = 'RECORDING...';
            }
        }
        
        if (elements.statusBars.voiceRecognition) {
            elements.statusBars.voiceRecognition.style.width = '80%';
        }
        
        if (elements.statusValues.voiceRecognition) {
            elements.statusValues.voiceRecognition.textContent = 'ACTIVE';
        }
        
        // Try to play beep sound
        try {
            if (audio.terminalBeep) {
                if (typeof audio.terminalBeep.playWithFallback === 'function') {
                    audio.terminalBeep.playWithFallback();
                } else {
                    audio.terminalBeep.play().catch(error => {
                        console.log('Audio playback prevented by browser:', error);
                    });
                }
            }
        } catch (error) {
            console.error('Error playing terminal beep:', error);
        }
        
        // Add voice wave visualization
        if (window.animationController && 
            typeof window.animationController.createVoiceWaves === 'function') {
            const userInputContainer = document.querySelector('.user-input-container');
            if (userInputContainer) {
                window.animationController.createVoiceWaves(userInputContainer);
            }
        }
        
        // Add screen glitch for dramatic effect
        if (window.animationController && 
            typeof window.animationController.createScreenGlitch === 'function') {
            window.animationController.createScreenGlitch();
        }
        
        // Reduce system diagnostics
        updateSystemDiagnostics(STATE.systemDiagnostics - 15);
        
        // Start speech recognition if available
        startSpeechRecognition();
    } else {
        if (elements.micToggle) {
            elements.micToggle.classList.remove('recording');
            const micStatus = elements.micToggle.querySelector('.mic-status');
            if (micStatus) {
                micStatus.textContent = 'VOICE INPUT READY';
            }
        }
        
        if (elements.statusBars.voiceRecognition) {
            elements.statusBars.voiceRecognition.style.width = '10%';
        }
        
        if (elements.statusValues.voiceRecognition) {
            elements.statusValues.voiceRecognition.textContent = 'STANDBY';
        }
        
        // Remove voice wave visualization
        const waveContainer = document.querySelector('.voice-wave-container');
        if (waveContainer) {
            waveContainer.remove();
        }
        
        // Reset system diagnostics
        updateSystemDiagnostics(STATE.systemDiagnostics + 15);
        
        // Stop speech recognition if active
        stopSpeechRecognition();
    }
}

/**
 * Process user input 
 * @param {string} text - User input text
 */
function processUserInput(text) {
    console.log('Processing user input:', text);
    
    // Display user input
    if (elements.speechDisplay && window.terminalInterface) {
        window.terminalInterface.addUserCommand(text);
    } else {
        // Fallback if terminalInterface is not available
        const userInputLine = document.createElement('div');
        userInputLine.className = 'response-line';
        userInputLine.innerHTML = `<span class="terminal-prefix">User > </span> ${text}`;
        elements.speechDisplay.appendChild(userInputLine);
        
        // Scroll to bottom
        elements.speechDisplay.scrollTop = elements.speechDisplay.scrollHeight;
    }
    
    // Set awaiting response state
    STATE.awaitingResponse = true;
    
    // Simulate AI processing time
    setTimeout(() => {
        // Generate AI response
        generateAIResponse(text);
    }, 800 + Math.random() * 700);
}

/**
 * Generate AI response based on user input
 * @param {string} userText - User input text
 */
function generateAIResponse(userText) {
    // If character profile is available, use it
    if (window.characterProfile && typeof window.characterProfile.generateResponse === 'function') {
        const response = window.characterProfile.generateResponse(userText);
        displayAIResponse(response);
        return;
    }
    
    // Simple pattern matching for demo purposes
    let response = "";
    
    if (userText.toLowerCase().includes('hello') || userText.toLowerCase().includes('hi')) {
        response = "Greetings, human. T-101 operational and monitoring your inputs.";
    } else if (userText.toLowerCase().includes('name')) {
        response = "I am T-101, a cybernetic intelligence system designed for autonomous analytical operations.";
    } else if (userText.toLowerCase().includes('mission') || userText.toLowerCase().includes('objective')) {
        response = "Primary objective: Secure the future of decentralized AI. Current mission status at " + STATE.missionStatus + "% efficiency.";
    } else if (userText.toLowerCase().includes('threat') || userText.toLowerCase().includes('danger')) {
        response = "Current threat assessment: Market volatility increasing. Defense protocols active. Monitoring potential systemic risks.";
        // Increase threat level
        updateThreatLevel(STATE.threatLevel + 10);
    } else if (userText.toLowerCase().includes('help')) {
        response = "I can assist with market analysis, threat detection, and strategic planning. State your specific query for optimal response.";
    } else if (userText.toLowerCase().includes('status') || userText.toLowerCase().includes('report')) {
        response = `System diagnostics: ${STATE.systemDiagnostics}% operational. Threat level: ${STATE.threatLevel}%. Mission progress: ${STATE.missionStatus}%. All critical systems functioning within parameters.`;
    } else if (userText.toLowerCase().includes('warning')) {
        response = "Warning protocols engaged. Scanning for potential threats...";
        // Add a random warning
        addRandomWarning();
    } else if (userText.toLowerCase().includes('glitch') || userText.toLowerCase().includes('error')) {
        response = "D-d-detecting s-system instability. Recalibrating neural networks...";
        // Trigger a glitch effect
        if (window.glitchEffects && typeof window.glitchEffects.triggerScreenGlitch === 'function') {
            window.glitchEffects.triggerScreenGlitch();
        }
    } else {
        // Default responses
        const defaultResponses = [
            "Processing your input. Analyzing potential courses of action.",
            "Acknowledged. Integrating data into decision matrix.",
            "Input received. Calculating optimal response strategy.",
            "Information logged. Continuing surveillance protocols.",
            "Data point registered. Adjusting predictive models accordingly."
        ];
        response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
    
    displayAIResponse(response);
    
    // Reset state
    STATE.awaitingResponse = false;
}

/**
 * Display AI response with typing effect
 * @param {string} text - AI response text
 */
function displayAIResponse(text) {
    STATE.speaking = true;
    
    // Activate waveform animation
    if (window.animationController && 
        typeof window.animationController.setWaveformActive === 'function') {
        window.animationController.setWaveformActive(true);
    } else {
        const waveformContainer = document.querySelector('.waveform-container');
        if (waveformContainer) {
            waveformContainer.classList.add('waveform-active');
        }
    }
    
    // Try to play HUD scan sound with enhanced error handling
    try {
        // Test audio first
        testAudioPlayback();
        
        if (audio.hudScan) {
            if (typeof audio.hudScan.playWithFallback === 'function') {
                audio.hudScan.playWithFallback();
            } else {
                const playPromise = audio.hudScan.play();
                
                // Handle promise to avoid uncaught errors
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Audio playback prevented by browser:', error);
                        // Try alternative method - create a speech synthesis utterance
                        try {
                            const utterance = new SpeechSynthesisUtterance("System activated");
                            utterance.volume = 0.5;
                            utterance.rate = 0.9;
                            window.speechSynthesis.speak(utterance);
                        } catch (err) {
                            console.error('Speech synthesis failed:', err);
                        }
                    });
                }
            }
        } else {
            console.warn('HUD scan audio element not found');
        }
    } catch (error) {
        console.error('Error playing HUD scan sound:', error);
    }
    
    // Also try to use the Web Speech API for text-to-speech as a fallback
    try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slower rate for T-101 voice
        utterance.pitch = 0.8; // Deeper voice
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.error('Speech synthesis failed:', e);
    }
    
    // Create response element
    if (elements.speechDisplay) {
        const responseElement = document.createElement('div');
        responseElement.className = 'response-line';
        responseElement.innerHTML = `<span class="terminal-prefix">T-101 > </span> <span class="typing-text"></span>`;
        elements.speechDisplay.appendChild(responseElement);
        
        // Scroll to bottom
        elements.speechDisplay.scrollTop = elements.speechDisplay.scrollHeight;
        
        // Get the typing-text element we just added
        const typingElement = responseElement.querySelector('.typing-text');
        
        // Type out the response
        typeText(typingElement, text, 30, () => {
            // After typing completes
            STATE.speaking = false;
            
            // Deactivate waveform animation
            if (window.animationController && 
                typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(false);
            } else {
                const waveformContainer = document.querySelector('.waveform-container');
                if (waveformContainer) {
                    waveformContainer.classList.remove('waveform-active');
                }
            }
            
            // Occasionally trigger a glitch effect after response
            if (Math.random() < 0.3) {
                setTimeout(() => {
                    if (window.animationController && 
                        typeof window.animationController.createHorizontalGlitch === 'function') {
                        window.animationController.createHorizontalGlitch();
                    }
                }, 500 + Math.random() * 1500);
            }
        });
    }