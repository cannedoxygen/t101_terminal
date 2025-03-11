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
 * Process user input 
 * @param {string} text - User input text
 */
function processUserInput(text) {
    console.log('Processing user input:', text);
    
    // Prevent processing if already awaiting a response
    if (STATE.awaitingResponse) {
        console.log('Awaiting previous response. Ignoring new input.');
        return;
    }
    
    // Set awaiting response state
    STATE.awaitingResponse = true;
    
    // Add user input to terminal
    if (window.terminalInterface && typeof window.terminalInterface.addUserCommand === 'function') {
        window.terminalInterface.addUserCommand(text);
    } else {
        // Fallback if terminal interface is not available
        if (elements.speechDisplay) {
            const userCommandElement = document.createElement('div');
            userCommandElement.className = 'response-line';
            userCommandElement.innerHTML = `<span class="terminal-prefix">User > </span> ${text}`;
            elements.speechDisplay.appendChild(userCommandElement);
            
            // Scroll to bottom
            elements.speechDisplay.scrollTop = elements.speechDisplay.scrollHeight;
        }
    }
    
    // Simulate AI processing time
    setTimeout(() => {
        // Generate AI response
        const response = generateAIResponse(text);
        
        // Display the response
        displayAIResponse(response);
        
        // Reset awaiting state
        STATE.awaitingResponse = false;
        
        // Attempt to speak the response if audio services are available
        if (window.audioProcessor && typeof window.audioProcessor.speakText === 'function') {
            window.audioProcessor.speakText(response)
                .catch(error => {
                    console.error('Speech synthesis error:', error);
                });
        } else if (window.apiClient && typeof window.apiClient.speakText === 'function') {
            window.apiClient.speakText(response)
                .catch(error => {
                    console.error('Speech synthesis error:', error);
                });
        }
    }, 800 + Math.random() * 700);
}

/**
 * Generate AI response
 * @param {string} userText - User input text
 * @returns {string} Generated response
 */
function generateAIResponse(userText) {
    // If character profile generation is available, use it
    if (window.characterProfile && 
        typeof window.characterProfile.generateResponse === 'function') {
        return window.characterProfile.generateResponse(userText);
    }
    
    // Default response generation
    const lowerText = userText.toLowerCase();
    
    // Response patterns
    const responsePatterns = [
        {
            patterns: ['hello', 'hi', 'hey'],
            response: () => "Greetings, human. T-101 operational and monitoring your inputs."
        },
        {
            patterns: ['name', 'who are you'],
            response: () => "I am T-101, a cybernetic intelligence system designed for autonomous analytical operations."
        },
        {
            patterns: ['mission', 'objective'],
            response: () => `Primary objective: Secure the future of decentralized AI. Current mission status at ${STATE.missionStatus}% efficiency.`
        },
        {
            patterns: ['threat', 'danger'],
            response: () => {
                updateThreatLevel(STATE.threatLevel + 10);
                return "Current threat assessment: Market volatility increasing. Defense protocols active. Monitoring potential systemic risks.";
            }
        },
        {
            patterns: ['help'],
            response: () => "I can assist with market analysis, threat detection, and strategic planning. State your specific query for optimal response."
        },
        {
            patterns: ['status', 'report'],
            response: () => `System diagnostics: ${STATE.systemDiagnostics}% operational. Threat level: ${STATE.threatLevel}%. Mission progress: ${STATE.missionStatus}%. All critical systems functioning within parameters.`
        },
        {
            patterns: ['warning'],
            response: () => {
                addRandomWarning();
                return "Warning protocols engaged. Scanning for potential threats...";
            }
        },
        {
            patterns: ['glitch', 'error'],
            response: () => {
                if (window.animationController && 
                    typeof window.animationController.createScreenGlitch === 'function') {
                    window.animationController.createScreenGlitch();
                }
                return "D-d-detecting s-system instability. Recalibrating neural networks...";
            }
        }
    ];

    // Find matching response
    const matchedResponse = responsePatterns.find(pattern => 
        pattern.patterns.some(p => lowerText.includes(p))
    );

    // Return matched or default response
    if (matchedResponse) {
        return matchedResponse.response();
    }

    // Default generic responses
    const defaultResponses = [
        "Processing your input. Analyzing potential courses of action.",
        "Acknowledged. Integrating data into decision matrix.",
        "Input received. Calculating optimal response strategy.",
        "Information logged. Continuing surveillance protocols.",
        "Data point registered. Adjusting predictive models accordingly."
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
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
    }
    
    // Try to play sound effect
    try {
        if (audio.hudScan) {
            const playPromise = audio.hudScan.play();
            
            // Handle promise to avoid uncaught errors
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Audio playback prevented:', error);
                });
            }
        }
    } catch (error) {
        console.error('Error playing HUD scan sound:', error);
    }
    
    // Display response in terminal
    if (elements.speechDisplay) {
        const responseElement = document.createElement('div');
        responseElement.className = 'response-line';
        responseElement.innerHTML = `<span class="terminal-prefix">T-101 > </span>${text}`;
        elements.speechDisplay.appendChild(responseElement);
        
        // Scroll to bottom
        elements.speechDisplay.scrollTop = elements.speechDisplay.scrollHeight;
    }
    
    // Reset speaking state 
    STATE.speaking = false;
    
    // Deactivate waveform
    if (window.animationController && 
        typeof window.animationController.setWaveformActive === 'function') {
        window.animationController.setWaveformActive(false);
    }
}

/**
 * Add a warning message
 * @param {string} message - Warning message text
 */
function addWarning(message) {
    // Add to warnings array
    STATE.warnings.push(message);
    
    // Update warnings display
    if (elements.warningDisplay) {
        if (STATE.warnings.length === 0) {
            elements.warningDisplay.textContent = 'NO CRITICAL WARNINGS';
            elements.warningDisplay.classList.remove('alert');
        } else {
            elements.warningDisplay.textContent = STATE.warnings[STATE.warnings.length - 1];
            elements.warningDisplay.classList.add('alert');
        }
    }
    
    // Try to play warning sound
    try {
        if (audio.warningAlert) {
            const playPromise = audio.warningAlert.play();
            
            // Handle promise to avoid uncaught errors
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Audio playback prevented:', error);
                });
            }
        }
    } catch (error) {
        console.error('Error playing warning sound:', error);
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
    
    // Update status text
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

/**
 * Update status value text
 */
function updateStatusValues() {
    // Update system diagnostics status
    if (elements.statusValues.systemDiagnostics) {
        const systemStatusText = STATE.systemDiagnostics > 90 ? 'OPTIMAL' :
            STATE.systemDiagnostics > 70 ? 'OPERATIONAL' :
            STATE.systemDiagnostics > 40 ? 'DEGRADED' : 'CRITICAL';
        elements.statusValues.systemDiagnostics.textContent = systemStatusText;
    }
    
    // Update threat level status
    if (elements.statusValues.threatLevel) {
        const threatText = STATE.threatLevel < 20 ? 'MINIMAL' :
            STATE.threatLevel < 40 ? 'GUARDED' :
            STATE.threatLevel < 60 ? 'ELEVATED' :
            STATE.threatLevel < 80 ? 'HIGH' : 'SEVERE';
        elements.statusValues.threatLevel.textContent = threatText;
    }
    
    // Update voice recognition status
    if (elements.statusValues.voiceRecognition) {
        const voiceRecText = STATE.voiceRecognition < 10 ? 'STANDBY' :
            STATE.voiceRecognition < 40 ? 'LEARNING' :
            STATE.voiceRecognition < 70 ? 'ANALYZING' : 'RECOGNIZED';
        elements.statusValues.voiceRecognition.textContent = voiceRecText;
    }
    
    // Update mission status
    if (elements.statusValues.missionStatus) {
        const missionText = STATE.missionStatus < 20 ? 'INITIATING' :
            STATE.missionStatus < 40 ? 'GATHERING DATA' :
            STATE.missionStatus < 60 ? 'CALCULATING STRATEGY' :
            STATE.missionStatus < 80 ? 'EXECUTING' : 'NEAR COMPLETION';
        elements.statusValues.missionStatus.textContent = missionText;
    }
}

/**
 * Initialize status bars
 */
function initializeStatusBars() {
    // Initialize system diagnostics
    updateSystemDiagnostics(STATE.systemDiagnostics);
    
    // Initialize threat level
    updateThreatLevel(STATE.threatLevel);
    
    // Initialize voice recognition
    if (elements.statusBars.voiceRecognition) {
        elements.statusBars.voiceRecognition.style.width = `${STATE.voiceRecognition}%`;
    }
    
    // Initialize mission status
    if (elements.statusBars.missionStatus) {
        elements.statusBars.missionStatus.style.width = `${STATE.missionStatus}%`;
    }
    
    // Update status text values
    updateStatusValues();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Mic toggle button
    if (elements.micToggle) {
        elements.micToggle.addEventListener('click', () => {
            // Toggle speech recognition if available
            if (window.audioProcessor && typeof window.audioProcessor.toggleSpeechRecognition === 'function') {
                window.audioProcessor.toggleSpeechRecognition();
            } else if (window.apiClient && typeof window.apiClient.processVoiceInput === 'function') {
                window.apiClient.processVoiceInput(5000); // 5 second recording
            } else {
                console.error('No speech recognition available');
                
                // Display error message
                if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
                    window.terminalInterface.addSystemMessage(
                        'Speech recognition unavailable. Please type your input.',
                        'error'
                    );
                }
            }
        });
    }
    
    // User input field
    if (elements.userInput) {
        elements.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                
                // Get input text
                const text = elements.userInput.textContent.trim();
                
                if (text) {
                    // Process user input
                    processUserInput(text);
                    
                    // Clear input field
                    elements.userInput.textContent = '';
                }
            }
        });
    }
    
    // Periodically update HUD values for effect
    setInterval(() => {
        // Slightly fluctuate system diagnostics
        const fluctuation = Math.random() * 5 - 2.5; // -2.5 to +2.5
        updateSystemDiagnostics(Math.min(100, Math.max(0, STATE.systemDiagnostics + fluctuation)));
        
        // Occasionally update other metrics
        if (Math.random() < 0.2) {
            // Voice recognition - slowly increase
            STATE.voiceRecognition = Math.min(100, STATE.voiceRecognition + Math.random() * 2);
            if (elements.statusBars.voiceRecognition) {
                elements.statusBars.voiceRecognition.style.width = `${STATE.voiceRecognition}%`;
            }
            
            // Mission status - slowly increase
            STATE.missionStatus = Math.min(100, STATE.missionStatus + Math.random() * 0.5);
            if (elements.statusBars.missionStatus) {
                elements.statusBars.missionStatus.style.width = `${STATE.missionStatus}%`;
            }
            
            // Update status text values
            updateStatusValues();
        }
        
        // Occasionally add a random glitch effect
        if (Math.random() < 0.1) {
            if (window.animationController && typeof window.animationController.createHorizontalGlitch === 'function') {
                window.animationController.createHorizontalGlitch();
            }
        }
    }, 5000);
}

/**
 * Initialize character profile
 */
function initializeCharacterProfile() {
    // If character profile initialization is available, use it
    if (window.characterProfile && 
        typeof window.characterProfile.initializeCharacterProfile === 'function') {
        window.characterProfile.initializeCharacterProfile();
        return;
    }
    
    // Otherwise do a manual initialization
    // Get elements
    const profileElements = {
        primaryObjective: document.getElementById('primary-objective'),
        threatAssessment: document.getElementById('threat-assessment'),
        directives: document.getElementById('directives')
    };
    
    // Default profile data
    const profileData = {
        primaryObjective: "Secure the future of decentralized AI.",
        threatAssessment: "Monitoring market instability.",
        directives: "Analyze. Predict. Execute."
    };
    
    // Type text function for animated text effect
    function typeText(element, text, speed = 50) {
        if (!element) return;
        
        element.textContent = '';
        let i = 0;
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        
        type();
    }
    
    // Animate text with delays
    setTimeout(() => {
        if (profileElements.primaryObjective) {
            typeText(profileElements.primaryObjective, profileData.primaryObjective);
        }
    }, 1000);
    
    setTimeout(() => {
        if (profileElements.threatAssessment) {
            typeText(profileElements.threatAssessment, profileData.threatAssessment);
        }
    }, 3000);
    
    setTimeout(() => {
        if (profileElements.directives) {
            typeText(profileElements.directives, profileData.directives);
        }
    }, 5000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeTerminal);

// Expose STATE to window for debugging
window.STATE = STATE;