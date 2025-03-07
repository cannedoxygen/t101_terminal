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

/**
 * Initialize the application
 */
function initializeTerminal() {
    console.log('Initializing T-101 AI Voice Terminal...');
    
    // Create startup sequence
    createStartupSequence();
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
    
    // Initialize components
    initializeStatusBars();
    initializeCharacterProfile();
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
 * Set up event listeners
 */
function setupEventListeners() {
    // Microphone button click
    if (elements.micToggle) {
        elements.micToggle.addEventListener('click', () => {
            toggleVoiceInput();
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
                toggleVoiceInput(); // Turn off listening
            }
        }
    });
    
    // Let users type directly into the user input display
    if (elements.userInput) {
        elements.userInput.setAttribute('contenteditable', 'true');
        elements.userInput.addEventListener('focus', () => {
            if (!STATE.listening) {
                toggleVoiceInput(); // Turn on listening when user focuses the input
            }
        });
    }
}

/**
 * Toggle voice input state
 */
function toggleVoiceInput() {
    STATE.listening = !STATE.listening;
    
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
                const playPromise = audio.terminalBeep.play();
                
                // Handle promise to avoid uncaught errors
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Audio playback prevented by browser:', error);
                    });
                }
            }
        } catch (error) {
            console.error('Error playing terminal beep:', error);
        }
        
        // Add voice wave visualization
        if (window.animationController && 
            typeof window.animationController.createScreenGlitch === 'function') {
            window.animationController.createScreenGlitch();
        }
        // Reduce system diagnostics
        updateSystemDiagnostics(STATE.systemDiagnostics - 15);
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
    
    // Display the AI response
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
    
    // Try to play HUD scan sound
    try {
        if (audio.hudScan) {
            const playPromise = audio.hudScan.play();
            
            // Handle promise to avoid uncaught errors
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Audio playback prevented by browser:', error);
                });
            }
        }
    } catch (error) {
        console.error('Error playing HUD scan sound:', error);
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
                const playPromise = audio.warningAlert.play();
                
                // Handle promise to avoid uncaught errors
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Audio playback prevented by browser:', error);
                    });
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
document.addEventListener('DOMContentLoaded', initializeTerminal);createVoiceWaves === 'function') {
            
            const userInputContainer = document.querySelector('.user-input-container');
            if (userInputContainer) {
                window.animationController.createVoiceWaves(userInputContainer);
            }
        }
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
    }
}

/**
 * Process user input 
 * @param {string} text - User input text
 */
function processUserInput(text) {
    console.log('Processing user input:', text);
    
    // Display user input
    if (elements.speechDisplay) {
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
 * Generate AI response
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
        if (window.animationController && 
            typeof window.animationController.