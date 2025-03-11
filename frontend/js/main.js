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
            audio.startup.volume = 0.5; // Lower volume
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
    initializeVoiceIntegration();
    initializeStatusBars();
    setupEventListeners();
    
    // Initialize character profile if available
    if (window.characterProfile && 
        typeof window.characterProfile.initializeCharacterProfile === 'function') {
        window.characterProfile.initializeCharacterProfile();
    }
    
    // Display initial T-101 message
    setTimeout(() => {
        if (elements.speechDisplay) {
            const responseElement = document.createElement('div');
            responseElement.className = 'response-line';
            responseElement.innerHTML = '<span class="terminal-prefix">T-101 > </span> T-101 system online. Voice interface activated. Awaiting input.';
            elements.speechDisplay.appendChild(responseElement);
        }
        
        // Speak initial message with TTS if available
        if (window.apiClient && typeof window.apiClient.speakText === 'function') {
            window.apiClient.speakText("T-101 system online. Voice interface activated. Awaiting input.")
                .catch(error => {
                    console.error('Initial TTS error:', error);
                });
        }
        
        // Add a randomized system warning after a delay
        setTimeout(() => {
            addRandomWarning();
        }, 5000);
    }, 1000);
}

/**
 * Initialize voice integration with API client
 */
function initializeVoiceIntegration() {
    console.log('Initializing voice integration...');
    
    // Initialize API client
    if (window.apiClient && typeof window.apiClient.initializeApiClient === 'function') {
        window.apiClient.initializeApiClient();
    } else {
        console.warn('API client not available for voice integration');
    }
    
    // Set up microphone button
    const micButton = document.getElementById('mic-toggle');
    if (micButton) {
        micButton.addEventListener('click', () => {
            if (window.apiClient && typeof window.apiClient.processVoiceInput === 'function') {
                window.apiClient.processVoiceInput()
                    .then(text => {
                        console.log('Voice input processed:', text);
                    })
                    .catch(error => {
                        console.error('Voice input error:', error);
                    });
            } else {
                console.error('No voice processing functionality available');
                if (window.terminalInterface && 
                    typeof window.terminalInterface.addSystemMessage === 'function') {
                    window.terminalInterface.addSystemMessage('Voice processing not available', 'error');
                }
            }
        });
    }
}

/**
 * Initialize status bars and values
 */
function initializeStatusBars() {
    // Update status bars based on initial state
    updateStatusBars();
    
    // Set up periodic updates
    setInterval(() => {
        // Add small random fluctuations
        STATE.systemDiagnostics += (Math.random() * 2 - 1) * 2;
        STATE.systemDiagnostics = Math.max(0, Math.min(100, STATE.systemDiagnostics));
        
        STATE.voiceRecognition += (Math.random() * 2 - 1) * 3;
        STATE.voiceRecognition = Math.max(0, Math.min(100, STATE.voiceRecognition));
        
        STATE.missionStatus += (Math.random() * 2 - 1) * 1;
        STATE.missionStatus = Math.max(0, Math.min(100, STATE.missionStatus));
        
        // Update the display
        updateStatusBars();
    }, 5000);
}

/**
 * Update status bars and values based on current STATE
 */
function updateStatusBars() {
    // Update system diagnostics
    if (elements.statusBars.systemDiagnostics) {
        elements.statusBars.systemDiagnostics.style.width = `${STATE.systemDiagnostics}%`;
    }
    
    // Update threat level
    if (elements.statusBars.threatLevel) {
        elements.statusBars.threatLevel.style.width = `${STATE.threatLevel}%`;
    }
    
    // Update voice recognition
    if (elements.statusBars.voiceRecognition) {
        elements.statusBars.voiceRecognition.style.width = `${STATE.voiceRecognition}%`;
    }
    
    // Update mission status
    if (elements.statusBars.missionStatus) {
        elements.statusBars.missionStatus.style.width = `${STATE.missionStatus}%`;
    }
    
    // Update status values
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
        const voiceText = STATE.voiceRecognition < 20 ? 'STANDBY' :
                        STATE.voiceRecognition < 40 ? 'LISTENING' :
                        STATE.voiceRecognition < 60 ? 'PROCESSING' :
                        STATE.voiceRecognition < 80 ? 'ANALYZING' : 'ACTIVE';
        elements.statusValues.voiceRecognition.textContent = voiceText;
    }
    
    // Update mission status
    if (elements.statusValues.missionStatus) {
        const missionText = STATE.missionStatus < 20 ? 'INITIALIZING' :
                          STATE.missionStatus < 40 ? 'GATHERING DATA' :
                          STATE.missionStatus < 60 ? 'PRIMARY MISSION ACTIVE' :
                          STATE.missionStatus < 80 ? 'ADVANCED OPERATION' : 'FINAL PHASE';
        elements.statusValues.missionStatus.textContent = missionText;
    }
}

/**
 * Setup additional event listeners
 */
function setupEventListeners() {
    // Add click event for waveform toggle (for testing)
    const waveformContainer = document.getElementById('waveform-container');
    if (waveformContainer) {
        waveformContainer.addEventListener('click', () => {
            if (window.animationController && 
                typeof window.animationController.setWaveformActive === 'function') {
                const isActive = waveformContainer.classList.contains('waveform-active');
                window.animationController.setWaveformActive(!isActive);
            }
        });
    }
    
    // Add click handler for warning area to generate random warnings
    const warningDisplay = document.getElementById('warning-display');
    if (warningDisplay) {
        warningDisplay.addEventListener('click', () => {
            addRandomWarning();
        });
    }
}

/**
 * Process user input - Enhanced with TTS integration
 * @param {string} text - User input text
 */
function processUserInput(text) {
    console.log('Processing user input:', text);
    
    // Prevent processing if already awaiting a response
    if (STATE.awaitingResponse) {
        console.log('Awaiting previous response. Ignoring new input.');
        return;
    }
    
    // Add user command to terminal display
    if (window.terminalInterface && typeof window.terminalInterface.addUserCommand === 'function') {
        window.terminalInterface.addUserCommand(text);
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
    
    // Show loading indicator
    if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
        window.terminalInterface.addSystemMessage("Processing input...", 'default');
    }
    
    // Send to OpenAI API
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: text })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.response) {
            // Display the AI response
            displayAIResponse(data.response);
            
            // Speak the response if speech available
            if (window.audioProcessor && typeof window.audioProcessor.speakText === 'function') {
                window.audioProcessor.speakText(data.response)
                    .catch(error => {
                        console.error('Speech synthesis error:', error);
                    });
            }
        } else {
            // Handle error
            if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
                window.terminalInterface.addSystemMessage(`Error: ${data.error || 'Failed to get response from T-101'}`, 'error');
            }
            
            // Fall back to local response
            const fallbackResponse = generateAIResponse(text);
            displayAIResponse(fallbackResponse);
        }
        
        // Reset awaiting state
        STATE.awaitingResponse = false;
    })
    .catch(error => {
        console.error('Error communicating with AI:', error);
        
        // Fall back to local response
        const fallbackResponse = generateAIResponse(text);
        displayAIResponse(fallbackResponse);
        
        // Reset awaiting state
        STATE.awaitingResponse = false;
    });
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
 * Display AI response with improved waveform integration
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
    
    // NOTE: We don't deactivate the waveform or set speaking=false here
    // The TTS function will handle that when speech completes
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
 * Init wave motion animation for speech
 */
function initWaveAnimation() {
    // Set up animation if p5.js is available
    if (typeof p5 !== 'undefined') {
        const waveformCanvas = document.getElementById('waveform-canvas');
        if (!waveformCanvas) return;
        
        const sketch = (p) => {
            let active = false;
            let amplitude = 50;
            let frequency = 2;
            
            p.setup = function() {
                p.createCanvas(waveformCanvas.offsetWidth, waveformCanvas.offsetHeight);
            };
            
            p.draw = function() {
                p.clear();
                
                if (active) {
                    drawActiveWaveform(p);
                } else {
                    drawIdleWaveform(p);
                }
            };
            
            function drawActiveWaveform(p) {
                const centerX = p.width / 2;
                const centerY = p.height / 2;
                
                // Calculate radius and number of points
                const maxRadius = Math.min(centerX, centerY) * 0.9;
                const numPoints = 180;
                const angleStep = (Math.PI * 2) / numPoints;
                
                // Draw multiple rings with different phases
                for (let ring = 1; ring <= 3; ring++) {
                    const ringRadius = maxRadius * (ring / 4);
                    const ringAmplitude = amplitude * (ring / 3);
                    const ringFrequency = frequency * (4 - ring) / 2;
                    const timeOffset = p.millis() / 1000 * ringFrequency;
                    
                    // Set style based on ring
                    p.stroke(255, 42, 42, ring === 1 ? 204 : ring === 2 ? 153 : 102);
                    p.strokeWeight(4 - ring + 1);
                    p.noFill();
                    
                    // Begin shape
                    p.beginShape();
                    
                    // Draw points around circle
                    for (let i = 0; i <= numPoints; i++) {
                        const angle = i * angleStep;
                        
                        // Calculate wave effect
                        const waveEffect = Math.sin(angle * 8 + timeOffset) * ringAmplitude;
                        
                        // Calculate point position
                        const x = centerX + Math.cos(angle) * (ringRadius + waveEffect);
                        const y = centerY + Math.sin(angle) * (ringRadius + waveEffect);
                        
                        p.vertex(x, y);
                    }
                    
                    // End shape
                    p.endShape(p.CLOSE);
                }
                
                // Draw center pulse
                const pulseSize = 10 + Math.sin(p.millis() / 200) * 5;
                
                p.fill(255, 42, 42, 204);
                p.noStroke();
                p.ellipse(centerX, centerY, pulseSize * 2);
            }
            
            function drawIdleWaveform(p) {
                const centerX = p.width / 2;
                const centerY = p.height / 2;
                
                // Draw subtle idle circles
                const radius = 30 + Math.sin(p.millis() / 1000) * 5;
                
                p.stroke(255, 42, 42, 51);
                p.strokeWeight(1);
                p.noFill();
                
                p.ellipse(centerX, centerY, radius * 2);
                p.ellipse(centerX, centerY, radius * 4);
            }
            
            // Method to set waveform active state
            p.setWaveformActive = function(isActive, amp, freq) {
                active = isActive;
                
                if (isActive) {
                    amplitude = amp || 50;
                    frequency = freq || 2;
                    
                    // Add class to container
                    const container = document.getElementById('waveform-container');
                    if (container) {
                        container.classList.add('waveform-active');
                    }
                } else {
                    // Remove class from container
                    const container = document.getElementById('waveform-container');
                    if (container) {
                        container.classList.remove('waveform-active');
                    }
                }
            };
        };
        
        // Create p5 instance
        const p5Instance = new p5(sketch);
        
        // Expose waveform control to global scope
        window.animationController = window.animationController || {};
        window.animationController.setWaveformActive = (active, amplitude, frequency) => {
            if (p5Instance && typeof p5Instance.setWaveformActive === 'function') {
                p5Instance.setWaveformActive(active, amplitude, frequency);
            }
        };
        
        // Add screen glitch method
        window.animationController.createScreenGlitch = () => {
            // Add screen glitch effect
            const terminal = document.querySelector('.terminal-interface');
            if (terminal) {
                terminal.classList.add('glitch-effect');
                setTimeout(() => {
                    terminal.classList.remove('glitch-effect');
                }, 500);
            }
        };
        
        // Add voice waves visualization
        window.animationController.createVoiceWaves = (container) => {
            if (!container) return null;
            
            // Remove existing voice wave container
            const existingContainer = container.querySelector('.voice-wave-container');
            if (existingContainer) {
                existingContainer.remove();
            }
            
            // Create new container
            const waveContainer = document.createElement('div');
            waveContainer.className = 'voice-wave-container';
            
            // Add wave elements
            for (let i = 0; i < 5; i++) {
                const wave = document.createElement('div');
                wave.className = 'voice-wave';
                waveContainer.appendChild(wave);
            }
            
            // Add to container
            container.appendChild(waveContainer);
            
            return waveContainer;
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize terminal
    initializeTerminal();
    
    // Initialize wave animation
    initWaveAnimation();
});