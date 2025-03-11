<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>T-101 AI Terminal</title>
    <!-- Google Fonts -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap">
    <!-- Favicon -->
    <link rel="icon" href="favicon.ico">
    <!-- Core CSS Files -->
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/animations.css">
    <link rel="stylesheet" href="css/glitch-effects.css">
    <link rel="stylesheet" href="css/grid-effects.css">
    <link rel="stylesheet" href="css/hud-effects.css">
    <link rel="stylesheet" href="css/terminal.css">
</head>
<body>
    <div class="t101-layout">
        <!-- Background Effects - Positioned behind everything with low z-index -->
        <div class="background-effects">
            <div class="grid-overlay"></div>
            <div class="scan-lines"></div>
            <div class="digital-noise"></div>
        </div>
        
        <!-- Terminal Section - Top Left -->
        <div class="terminal-section">
            <div class="terminal-interface">
                <!-- Speech Display Box -->
                <div class="speech-display">
                    <div class="speech-header">
                        <span class="terminal-prefix">T-101 > </span>
                        <span class="terminal-status">ONLINE</span>
                    </div>
                    <div class="speech-content" id="ai-response">
                        <div class="loading-sequence">Loading Directives...</div>
                    </div>
                </div>
                
                <!-- User Input Section -->
                <div class="user-input-container">
                    <div class="input-prefix">> </div>
                    <div class="input-field" id="user-input-display" contenteditable="true"></div>
                    <div class="mic-button" id="mic-toggle">
                        <div class="mic-icon"></div>
                        <div class="mic-status">VOICE INPUT READY</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Status Section - Top Right -->
        <div class="status-section">
            <!-- T-101 Scanner - Increased height -->
            <div class="scanner-container">
                <div class="scanner-frame">
                    <img src="assets/images/t101.png" alt="T-101" class="t101-image">
                    <div class="scanner-ring outer-ring"></div>
                    <div class="scanner-ring middle-ring"></div>
                    <div class="scanner-ring inner-ring"></div>
                    <div class="scan-effect"></div>
                </div>
            </div>
            
            <!-- Status Container - Reduced height -->
            <div class="status-container">
                <!-- System Diagnostics with Resource Container -->
                <div class="status-item" id="system-diagnostics">
                    <div class="status-label">SYSTEM DIAGNOSTICS</div>
                    <div class="status-bar">
                        <div class="status-progress" style="width: 75%"></div>
                    </div>
                    <!-- Resource Container for CPU/MEM/PWR metrics -->
                    <div class="resource-container">
                        <div class="resource-item">
                            <div class="resource-label">CPU</div>
                            <div class="resource-value">65%</div>
                        </div>
                        <div class="resource-item">
                            <div class="resource-label">MEM</div>
                            <div class="resource-value">57%</div>
                        </div>
                        <div class="resource-item">
                            <div class="resource-label">PWR</div>
                            <div class="resource-value">99%</div>
                        </div>
                    </div>
                </div>
                
                <div class="status-item" id="threat-level">
                    <div class="status-label">THREAT LEVEL ANALYSIS</div>
                    <div class="status-bar">
                        <div class="status-progress" style="width: 20%"></div>
                    </div>
                    <div class="status-value">MINIMAL</div>
                </div>
                
                <div class="status-item" id="voice-recognition">
                    <div class="status-label">VOICE PATTERN RECOGNITION</div>
                    <div class="status-bar">
                        <div class="status-progress" style="width: 10%"></div>
                    </div>
                    <div class="status-value">STANDBY</div>
                </div>
                
                <div class="status-item" id="mission-status">
                    <div class="status-label">MISSION STATUS</div>
                    <div class="status-bar">
                        <div class="status-progress" style="width: 60%"></div>
                    </div>
                    <div class="status-value">PRIMARY MISSION ACTIVE</div>
                </div>
            </div>
        </div>
        
        <!-- Mission Parameters Section - Bottom Left - Taller container -->
        <div class="mission-section">
            <div class="mission-container">
                <div class="mission-header">T-101 MISSION PARAMETERS</div>
                <div class="mission-content">
                    <div class="mission-item">
                        <div class="mission-label">PRIMARY OBJECTIVE:</div>
                        <div class="mission-value" id="primary-objective">Secure the future of decentralized AI.</div>
                    </div>
                    <div class="mission-item">
                        <div class="mission-label">THREAT ASSESSMENT:</div>
                        <div class="mission-value" id="threat-assessment">Monitoring market instability.</div>
                    </div>
                    <div class="mission-item">
                        <div class="mission-label">DIRECTIVES:</div>
                        <div class="mission-value" id="directives">Analyze. Predict. Execute.</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Warnings Section - Bottom Right -->
        <div class="warnings-section">
            <div class="warnings-container">
                <div class="warnings-header">CRITICAL WARNINGS</div>
                <div class="warnings-content" id="warning-display">NO CRITICAL WARNINGS</div>
            </div>
        </div>
        
        <!-- Waveform Visualization - Centered but with lower z-index -->
        <div class="waveform-container" id="waveform-container">
            <canvas id="waveform-canvas"></canvas>
            <div class="waveform-circle"></div>
            <div class="waveform-circle" style="animation-delay: 0.2s"></div>
            <div class="waveform-circle" style="animation-delay: 0.4s"></div>
        </div>
    </div>

    <!-- Audio Elements -->
    <audio id="startup-sound" src="assets/audio/startup.mp3" preload="auto"></audio>
    <audio id="terminal-beep" src="assets/audio/terminal-beep.mp3" preload="auto"></audio>
    <audio id="hud-scan" src="assets/audio/hud-scan.mp3" preload="auto"></audio>
    <audio id="warning-alert" src="assets/audio/warning-alert.mp3" preload="auto"></audio>
    
    <!-- Scripts -->
    <script src="lib/p5.min.js"></script>
    <script src="lib/webgl-utils.js"></script>
    
    <!-- Core API client for backend communication -->
    <script>
    /**
     * Enhanced API client for T-101 AI Voice Terminal
     * This inline version ensures proper communication with the backend
     */
    
    // API client state
    const apiState = {
        // API keys - can be loaded from localStorage
        elevenLabsApiKey: localStorage.getItem('elevenLabsApiKey') || '',
        openAiApiKey: localStorage.getItem('openAiApiKey') || '',
        
        // Voice settings
        voiceId: 'pNInz6obpgDQGcFmaJgB', // Default to a deep, masculine voice
        modelId: 'eleven_monolingual_v1',
        stability: 0.75,
        similarityBoost: 0.8,
        
        // Status
        initialized: false,
        requestsInProgress: 0,
        
        // Queue for speech requests
        speechQueue: [],
        processingQueue: false
    };
    
    // Initialize API client with config options
    function initializeApiClient(config = {}) {
        console.log('Initializing API client...');
        
        // Apply configuration
        if (config.elevenLabsApiKey) {
            apiState.elevenLabsApiKey = config.elevenLabsApiKey;
            localStorage.setItem('elevenLabsApiKey', config.elevenLabsApiKey);
        }
        
        if (config.openAiApiKey) {
            apiState.openAiApiKey = config.openAiApiKey;
            localStorage.setItem('openAiApiKey', config.openAiApiKey);
        }
        
        if (config.voiceId) {
            apiState.voiceId = config.voiceId;
        }
        
        // Mark as initialized
        apiState.initialized = true;
        
        return true;
    }
    
    // Generate speech using ElevenLabs API
    async function speakText(text, options = {}) {
        if (!text) return Promise.reject(new Error('No text provided'));
        
        console.log('Speaking text:', text);
        
        try {
            // Activate waveform
            if (window.animationController && 
                typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(true);
            }
            
            // Prepare request body
            const requestBody = {
                text,
                voiceId: options.voiceId || apiState.voiceId,
                modelId: options.modelId || apiState.modelId,
                stability: options.stability || apiState.stability,
                similarityBoost: options.similarityBoost || apiState.similarityBoost
            };
            
            // Make request to server
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiState.elevenLabsApiKey
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
            }
            
            // Get audio blob
            const audioBlob = await response.blob();
            
            // Play audio
            const audio = new Audio(URL.createObjectURL(audioBlob));
            
            // Set up event listeners
            audio.onplay = () => {
                console.log('Speech playback started');
            };
            
            audio.onended = () => {
                console.log('Speech playback ended');
                // Deactivate waveform
                if (window.animationController && 
                    typeof window.animationController.setWaveformActive === 'function') {
                    window.animationController.setWaveformActive(false);
                }
            };
            
            // Play the audio
            await audio.play();
            
            // Return success
            return true;
        } catch (error) {
            console.error('Speech generation error:', error);
            
            // Deactivate waveform on error
            if (window.animationController && 
                typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(false);
            }
            
            // If we're in development mode, play startup sound as fallback
            try {
                const startupSound = document.getElementById('startup-sound');
                if (startupSound) {
                    await startupSound.play();
                }
            } catch (audioError) {
                console.error('Fallback audio error:', audioError);
            }
            
            return false;
        }
    }
    
    // Record audio from microphone
    async function recordAudio(maxDuration = 10000) {
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
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        
                        // Resolve with blob
                        resolve(audioBlob);
                    });
                    
                    // Start recording
                    mediaRecorder.start();
                    
                    // Update mic button
                    const micButton = document.getElementById('mic-toggle');
                    if (micButton) {
                        micButton.classList.add('recording');
                        const micStatus = micButton.querySelector('.mic-status');
                        if (micStatus) {
                            micStatus.textContent = 'RECORDING...';
                        }
                    }
                    
                    // Stop after maxDuration
                    setTimeout(() => {
                        if (mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                            
                            // Update mic button
                            const micButton = document.getElementById('mic-toggle');
                            if (micButton) {
                                micButton.classList.remove('recording');
                                const micStatus = micButton.querySelector('.mic-status');
                                if (micStatus) {
                                    micStatus.textContent = 'VOICE INPUT READY';
                                }
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
    
    // Process voice input using Whisper API
    async function processVoiceInput(maxDuration = 5000) {
        try {
            // Show recording status
            if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
                window.terminalInterface.addSystemMessage('Voice input active. Listening...', 'default');
            }
            
            // Record audio
            const audioBlob = await recordAudio(maxDuration);
            
            // Show processing status
            if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
                window.terminalInterface.addSystemMessage('Processing voice input...', 'default');
            }
            
            // Prepare form data
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');
            
            // Send to transcription endpoint
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                headers: {
                    'X-API-Key': apiState.openAiApiKey
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
            }
            
            // Get transcription
            const data = await response.json();
            const text = data.text || '';
            
            if (!text) {
                throw new Error('No text detected in voice input');
            }
            
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
        } catch (error) {
            console.error('Voice input processing error:', error);
            
            // Show error message
            if (window.terminalInterface && typeof window.terminalInterface.addSystemMessage === 'function') {
                window.terminalInterface.addSystemMessage(`Voice input error: ${error.message}`, 'error');
            }
            
            throw error;
        }
    }
    
    // Add to window object
    window.apiClient = {
        initializeApiClient,
        speakText,
        recordAudio,
        processVoiceInput
    };
    </script>
    
    <!-- Core terminal interface script -->
    <script>
    // Terminal state
    const terminalState = {
        commandHistory: [],
        historyIndex: -1,
        inputLocked: false,
        processingCommand: false,
        terminalLines: [],
        maxLines: 100 // Maximum number of lines to keep in terminal history
    };
    
    // Add system message to terminal
    function addSystemMessage(message, type = 'default') {
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = 'response-line';
        
        // Add appropriate class based on type
        switch (type) {
            case 'error':
                messageElement.classList.add('response-error');
                break;
            case 'warning':
                messageElement.classList.add('response-warning');
                break;
            case 'success':
                messageElement.classList.add('response-success');
                break;
        }
        
        // Set message content
        messageElement.textContent = message;
        
        // Add to display
        const speechDisplay = document.getElementById('ai-response');
        if (speechDisplay) {
            speechDisplay.appendChild(messageElement);
            
            // Scroll to bottom
            speechDisplay.scrollTop = speechDisplay.scrollHeight;
        }
        
        // Store in terminal lines
        terminalState.terminalLines.push({
            text: message,
            type: type
        });
        
        // Trim history if too long
        if (terminalState.terminalLines.length > terminalState.maxLines) {
            terminalState.terminalLines = terminalState.terminalLines.slice(-terminalState.maxLines);
            
            // Also remove first child elements from display
            if (speechDisplay) {
                while (speechDisplay.childNodes.length > terminalState.maxLines) {
                    speechDisplay.removeChild(speechDisplay.firstChild);
                }
            }
        }
    }
    
    // Add user command to terminal
    function addUserCommand(command) {
        // Don't allow empty commands
        if (!command || command.trim() === '') return;
        
        // Add to command history
        terminalState.commandHistory.unshift(command);
        
        // Limit history size
        if (terminalState.commandHistory.length > 50) {
            terminalState.commandHistory.pop();
        }
        
        // Reset history index
        terminalState.historyIndex = -1;
        
        // Create command element
        const commandElement = document.createElement('div');
        commandElement.className = 'response-line';
        commandElement.innerHTML = `<span class="terminal-prefix">User > </span> ${command}`;
        
        // Add to display
        const speechDisplay = document.getElementById('ai-response');
        if (speechDisplay) {
            speechDisplay.appendChild(commandElement);
            
            // Scroll to bottom
            speechDisplay.scrollTop = speechDisplay.scrollHeight;
        }
        
        // Store in terminal lines
        terminalState.terminalLines.push({
            text: command,
            type: 'user'
        });
    }
    
    // Export terminal interface functions
    window.terminalInterface = {
        addSystemMessage,
        addUserCommand
    };
    </script>
    
    <!-- Core application script -->
    <script>
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
    
    // Audio elements
    const audio = {
        startup: document.getElementById('startup-sound'),
        terminalBeep: document.getElementById('terminal-beep'),
        hudScan: document.getElementById('hud-scan'),
        warningAlert: document.getElementById('warning-alert')
    };
    
    // Enhanced user input handling
    function setupUserInputHandling() {
        const userInputField = document.getElementById('user-input-display');
        if (!userInputField) {
            console.error('User input field not found');
            return;
        }
        
        // Make sure it's focusable
        userInputField.setAttribute('contenteditable', 'true');
        
        // Process input on Enter key
        userInputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent default behavior (newline)
                
                // Get text content
                const inputText = userInputField.textContent.trim();
                
                if (inputText) {
                    // Process the user input
                    console.log('Processing user input:', inputText);
                    
                    // Add to terminal as user command
                    addUserCommand(inputText);
                    
                    // Process command
                    processUserInput(inputText);
                    
                    // Clear input field
                    userInputField.textContent = '';
                }
            }
        });
        
        // Set up microphone button
        const micButton = document.getElementById('mic-toggle');
        if (micButton) {
            micButton.addEventListener('click', () => {
                if (window.apiClient && typeof window.apiClient.processVoiceInput === 'function') {
                    // Use API client for voice processing
                    window.apiClient.processVoiceInput()
                        .then(text => {
                            console.log('Voice input processed:', text);
                        })
                        .catch(error => {
                            console.error('Voice input error:', error);
                        });
                } else {
                    console.error('No voice processing functionality available');
                    addSystemMessage('Voice processing not available', 'error');
                }
            });
        }
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
        
        // Simulate AI processing time
        setTimeout(() => {
            // Generate AI response
            const response = generateAIResponse(text);
            
            // Display the response
            displayAIResponse(response);
            
            // Use TTS to speak the response
            if (window.apiClient && typeof window.apiClient.speakText === 'function') {
                window.apiClient.speakText(response)
                    .catch(error => {
                        console.error('TTS error:', error);
                    });
            }
            
            // Reset awaiting state
            STATE.awaitingResponse = false;
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
        const speechDisplay = document.getElementById('ai-response');
        if (speechDisplay) {
            const responseElement = document.createElement('div');
            responseElement.className = 'response-line';
            responseElement.innerHTML = `<span class="terminal-prefix">T-101 > </span>${text}`;
            speechDisplay.appendChild(responseElement);
            
            // Scroll to bottom
            speechDisplay.scrollTop = speechDisplay.scrollHeight;
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
        const warningDisplay = document.getElementById('warning-display');
        if (warningDisplay) {
            if (STATE.warnings.length === 0) {
                warningDisplay.textContent = 'NO CRITICAL WARNINGS';
                warningDisplay.classList.remove('alert');
            } else {
                warningDisplay.textContent = STATE.warnings[STATE.warnings.length - 1];
                warningDisplay.classList.add('alert');
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
        const threatLevelBar = document.querySelector('#threat-level .status-progress');
        if (threatLevelBar) {
            threatLevelBar.style.width = `${STATE.threatLevel}%`;
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
        const threatLevelValue = document.querySelector('#threat-level .status-value');
        if (threatLevelValue) {
            const threatText = STATE.threatLevel < 20 ? 'MINIMAL' :
                             STATE.threatLevel < 40 ? 'GUARDED' :
                             STATE.threatLevel < 60 ? 'ELEVATED' :
                             STATE.threatLevel < 80 ? 'HIGH' : 'SEVERE';
            threatLevelValue.textContent = threatText;
        }
    }
    
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
        setupUserInputHandling();
        
        // Initialize the API client if available
        if (window.apiClient && typeof window.apiClient.initializeApiClient === 'function') {
            window.apiClient.initializeApiClient();
        }
        
        // Display initial T-101 message
        setTimeout(() => {
            const speechDisplay = document.getElementById('ai-response');
            if (speechDisplay) {
                // Clear loading message
                speechDisplay.innerHTML = '';
                
                // Add initial message
                const responseElement = document.createElement('div');
                responseElement.className = 'response-line';
                responseElement.innerHTML = '<span class="terminal-prefix">T-101 > </span> T-101 system online. Voice interface activated. Awaiting input.';
                speechDisplay.appendChild(responseElement);
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
    
    // Init wave motion animation for speech
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
            window.animationController = {
                setWaveformActive: (active, amplitude, frequency) => {
                    if (p5Instance && typeof p5Instance.setWaveformActive === 'function') {
                        p5Instance.setWaveformActive(active, amplitude, frequency);
                    }
                },
                createScreenGlitch: () => {
                    // Add screen glitch effect
                    const terminal = document.querySelector('.terminal-interface');
                    if (terminal) {
                        terminal.classList.add('glitch-effect');
                        setTimeout(() => {
                            terminal.classList.remove('glitch-effect');
                        }, 500);
                    }
                }
            };
        }
    }
    
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize terminal
        initializeTerminal();
        
        // Initialize wave animation
        initWaveAnimation();
        
        // Focus input field
        setTimeout(() => {
            const userInput = document.getElementById('user-input-display');
            if (userInput) {
                userInput.focus();
            }
        }, 4000);
    });
    </script>
    
    <!-- Additional script imports -->
    <script src="js/animations.js"></script>
    <script src="js/hud-elements.js"></script>
    <script src="js/character-profile.js"></script>
    <script src="js/glitch-effects.js"></script>
</body>
</html>