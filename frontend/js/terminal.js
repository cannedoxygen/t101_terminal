/**
 * terminal.js - Main terminal functionality for T-101 AI Voice Terminal
 * Handles user input, display, and integrates with other components
 */

// Terminal state
const terminalState = {
    commandHistory: [],
    historyIndex: -1,
    inputLocked: false,
    processingCommand: false,
    terminalLines: [],
    maxLines: 100, // Maximum number of lines to keep in terminal history
    typingSpeed: {
        min: 20,  // Minimum milliseconds between characters
        max: 50   // Maximum milliseconds between characters
    }
};

/**
 * Initialize the terminal interface
 */
function initializeTerminalInterface() {
    console.log('Initializing terminal interface...');
    
    // Set up input field event handlers
    setupInputHandlers();
    
    // Set up microphone button
    setupMicButton();
}

/**
 * Set up input field event handlers
 */
function setupInputHandlers() {
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
                
                // Clear input field
                userInputField.textContent = '';
            }
        } else if (e.key === 'ArrowUp') {
            // Navigate command history (up)
            e.preventDefault();
            navigateHistory(-1);
        } else if (e.key === 'ArrowDown') {
            // Navigate command history (down)
            e.preventDefault();
            navigateHistory(1);
        }
    });
    
    // Ensure input field is focused when clicking on it
    userInputField.addEventListener('click', () => {
        if (!terminalState.inputLocked) {
            userInputField.focus();
        }
    });
    
    // Focus input field on terminal click
    const terminalContainer = document.querySelector('.terminal-interface');
    if (terminalContainer) {
        terminalContainer.addEventListener('click', (e) => {
            // Only focus if we're not clicking on a button or other interactive element
            if (e.target.tagName !== 'BUTTON' && 
                !e.target.closest('.mic-button') && 
                !terminalState.inputLocked) {
                userInputField.focus();
            }
        });
    }
}

/**
 * Navigate command history
 * @param {number} direction - Direction to navigate (-1 for up, 1 for down)
 */
function navigateHistory(direction) {
    const userInputField = document.getElementById('user-input-display');
    if (!userInputField || terminalState.commandHistory.length === 0) return;
    
    // Update history index
    terminalState.historyIndex += direction;
    
    // Clamp index to valid range
    if (terminalState.historyIndex < 0) {
        terminalState.historyIndex = 0;
    } else if (terminalState.historyIndex >= terminalState.commandHistory.length) {
        terminalState.historyIndex = terminalState.commandHistory.length - 1;
    }
    
    // Set input field to command from history
    userInputField.textContent = terminalState.commandHistory[terminalState.historyIndex];
    
    // Place cursor at end of text
    placeCaretAtEnd(userInputField);
}

/**
 * Place caret at the end of a contentEditable element
 * @param {HTMLElement} el - Element to place caret at the end of
 */
function placeCaretAtEnd(el) {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false); // Collapse to end
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * Set up microphone button functionality with improved error handling
 */
function setupMicButton() {
    const micButton = document.getElementById('mic-toggle');
    if (!micButton) {
        console.error('Microphone button not found');
        return;
    }
    
    micButton.addEventListener('click', async () => {
        // If already recording, stop recording
        if (micButton.classList.contains('recording')) {
            // Stop recording animation
            micButton.classList.remove('recording');
            const micStatus = micButton.querySelector('.mic-status');
            if (micStatus) {
                micStatus.textContent = 'VOICE INPUT READY';
            }
            
            // If using browser speech recognition, try to stop it
            if (window.speechRecognition) {
                try {
                    window.speechRecognition.stop();
                } catch (e) {
                    console.log('Error stopping speech recognition:', e);
                }
            }
            
            return;
        }
        
        // First, explicitly request microphone permission
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately - we just wanted to ensure permission
            stream.getTracks().forEach(track => track.stop());
            
            // Now start the speech recognition process
            startSpeechRecognition(micButton);
        } catch (err) {
            console.error('Microphone access error:', err);
            
            // Show specific error message based on the error type
            let errorMessage = 'Microphone access error: ';
            
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage += 'Permission denied. Please allow microphone access in your browser settings.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage += 'No microphone found. Please connect a microphone and try again.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage += 'Microphone is already in use by another application.';
            } else {
                errorMessage += err.message;
            }
            
            // Display error in terminal
            addSystemMessage(errorMessage, 'error');
        }
    });
}

/**
 * Start speech recognition with improved error handling
 * @param {HTMLElement} micButton - Microphone button element
 */
function startSpeechRecognition(micButton) {
    // Start recording animation
    micButton.classList.add('recording');
    const micStatus = micButton.querySelector('.mic-status');
    if (micStatus) {
        micStatus.textContent = 'RECORDING...';
    }
    
    // Activate waveform if available
    if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
        window.animationController.setWaveformActive(true, 30, 1.5);
    }
    
    // Create voice waves if available
    if (window.animationController && typeof window.animationController.createVoiceWaves === 'function') {
        const userInputContainer = document.querySelector('.user-input-container');
        if (userInputContainer) {
            window.animationController.createVoiceWaves(userInputContainer);
        }
    }
    
    // Show user we're listening
    addSystemMessage('Listening...', 'default');
    
    // Try different speech recognition methods in order of preference
    
    // 1. Try browser's built-in speech recognition first
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        // Store recognition instance globally so we can stop it if needed
        window.speechRecognition = recognition;
        
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        
        // Debug indicator
        const debugIndicator = document.createElement('div');
        debugIndicator.textContent = 'Microphone Active';
        debugIndicator.style.position = 'fixed';
        debugIndicator.style.bottom = '10px';
        debugIndicator.style.right = '10px';
        debugIndicator.style.backgroundColor = 'rgba(255,42,42,0.7)';
        debugIndicator.style.color = '#fff';
        debugIndicator.style.padding = '5px 10px';
        debugIndicator.style.borderRadius = '3px';
        debugIndicator.style.zIndex = '9999';
        debugIndicator.style.fontSize = '12px';
        debugIndicator.id = 'mic-debug-indicator';
        document.body.appendChild(debugIndicator);
        
        // Handle interim results to show user their speech is being recognized
        recognition.onresult = (event) => {
            // Get last result
            const lastResultIndex = event.results.length - 1;
            const lastResult = event.results[lastResultIndex];
            
            // Get transcript from last result
            const transcript = lastResult[0].transcript;
            
            // Log for debugging
            console.log('Speech recognized interim:', transcript, 'isFinal:', lastResult.isFinal);
            
            // Display interim results
            const userInput = document.getElementById('user-input-display');
            if (userInput) {
                userInput.textContent = transcript;
                
                // If this is the final result and we have text, process it
                if (lastResult.isFinal && transcript.trim()) {
                    // Process the recognized text
                    addUserCommand(transcript.trim());
                }
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error, event);
            
            // Provide more detailed error feedback
            const errorMessages = {
                'no-speech': 'No speech detected. Please try again.',
                'audio-capture': 'Microphone not connected or working properly.',
                'not-allowed': 'Microphone permission denied. Please allow access in your browser settings.',
                'network': 'Network error. Check your connection.',
                'aborted': 'Speech recognition was aborted.',
                'service-not-allowed': 'Speech service not allowed.',
                'bad-grammar': 'Grammar compilation error.'
            };
            
            const message = errorMessages[event.error] || `Recognition error: ${event.error}`;
            addSystemMessage(message, 'error');
            
            // Stop recording animation
            micButton.classList.remove('recording');
            if (micStatus) {
                micStatus.textContent = 'VOICE INPUT READY';
            }
            
            // Remove debug indicator
            const debugIndicator = document.getElementById('mic-debug-indicator');
            if (debugIndicator) debugIndicator.remove();
            
            // Deactivate waveform
            if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(false);
            }
            
            // Remove voice waves
            const waveContainer = document.querySelector('.voice-wave-container');
            if (waveContainer) waveContainer.remove();
        };
        
        recognition.onend = () => {
            console.log('Speech recognition ended');
            
            // Stop recording animation
            micButton.classList.remove('recording');
            if (micStatus) {
                micStatus.textContent = 'VOICE INPUT READY';
            }
            
            // Remove debug indicator
            const debugIndicator = document.getElementById('mic-debug-indicator');
            if (debugIndicator) debugIndicator.remove();
            
            // Deactivate waveform
            if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(false);
            }
            
            // Remove voice waves
            const waveContainer = document.querySelector('.voice-wave-container');
            if (waveContainer) waveContainer.remove();
        };
        
        // Start recognition
        try {
            recognition.start();
            console.log('Speech recognition started');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            addSystemMessage(`Error starting speech recognition: ${error.message}`, 'error');
            
            // Fallback to API client
            fallbackToApiClient(micButton);
        }
    } 
    // 2. Fall back to API client
    else {
        fallbackToApiClient(micButton);
    }
}

/**
 * Fallback to using API client for voice input
 * @param {HTMLElement} micButton - Microphone button element
 */
function fallbackToApiClient(micButton) {
    if (window.apiClient && typeof window.apiClient.processVoiceInput === 'function') {
        try {
            // Initialize API client if needed
            if (window.apiClient.initializeApiClient && !window.apiClient.initialized) {
                window.apiClient.initializeApiClient();
            }
            
            // Use API client for voice processing
            window.apiClient.processVoiceInput()
                .then(text => {
                    console.log('Voice input processed:', text);
                    
                    // Add the recognized text to user input
                    const userInput = document.getElementById('user-input-display');
                    if (userInput && text) {
                        userInput.textContent = text;
                        
                        // Process the recognized text
                        addUserCommand(text);
                    }
                })
                .catch(error => {
                    console.error('Voice input error:', error);
                    addSystemMessage(`Voice input error: ${error.message}`, 'error');
                })
                .finally(() => {
                    // Stop recording animation
                    micButton.classList.remove('recording');
                    const micStatus = micButton.querySelector('.mic-status');
                    if (micStatus) {
                        micStatus.textContent = 'VOICE INPUT READY';
                    }
                    
                    // Deactivate waveform
                    if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                        window.animationController.setWaveformActive(false);
                    }
                    
                    // Remove voice waves
                    const waveContainer = document.querySelector('.voice-wave-container');
                    if (waveContainer) waveContainer.remove();
                });
        } catch (error) {
            console.error('Error initializing voice input:', error);
            addSystemMessage(`Voice initialization error: ${error.message}`, 'error');
            
            // Stop recording animation
            micButton.classList.remove('recording');
            const micStatus = micButton.querySelector('.mic-status');
            if (micStatus) {
                micStatus.textContent = 'VOICE INPUT READY';
            }
            
            // Deactivate waveform
            if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(false);
            }
            
            // Remove voice waves
            const waveContainer = document.querySelector('.voice-wave-container');
            if (waveContainer) waveContainer.remove();
        }
    } else {
        console.error('No voice processing functionality available');
        addSystemMessage('Voice processing not available in this browser.', 'error');
        
        // Stop recording animation
        micButton.classList.remove('recording');
        const micStatus = micButton.querySelector('.mic-status');
        if (micStatus) {
            micStatus.textContent = 'VOICE INPUT READY';
        }
        
        // Deactivate waveform
        if (window.animationController && typeof window.animationController.setWaveformActive === 'function') {
            window.animationController.setWaveformActive(false);
        }
        
        // Remove voice waves
        const waveContainer = document.querySelector('.voice-wave-container');
        if (waveContainer) waveContainer.remove();
    }
}

/**
 * Add system message to terminal
 * @param {string} message - Message text
 * @param {string} type - Message type (default, error, warning, success)
 */
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
    trimTerminalHistory(speechDisplay);
}

/**
 * Add user command to terminal
 * @param {string} command - User command text
 */
function addUserCommand(command) {
    // Don't allow empty commands
    if (!command || command.trim() === '') return;
    
    // Don't process if already processing a command
    if (terminalState.processingCommand) {
        console.log('Already processing a command, ignoring new input');
        addSystemMessage('Processing previous command. Please wait...', 'warning');
        return;
    }
    
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
    
    // Mark as processing command
    terminalState.processingCommand = true;
    
    // Process the command
    handleUserCommand(command);
}

/**
 * Add AI response to terminal with typing animation
 * @param {string} response - AI response text
 */
function addAIResponse(response) {
    // Create response element
    const responseElement = document.createElement('div');
    responseElement.className = 'response-line';
    
    // Add the prefix immediately
    responseElement.innerHTML = `<span class="terminal-prefix">T-101 > </span> <span class="typing-text"></span>`;
    
    // Add to display right away
    const speechDisplay = document.getElementById('ai-response');
    if (speechDisplay) {
        speechDisplay.appendChild(responseElement);
        speechDisplay.scrollTop = speechDisplay.scrollHeight;
    }
    
    // Get the typing-text element we just created
    const typingElement = responseElement.querySelector('.typing-text');
    
    // Type the text character by character
    let i = 0;
    function typeNextChar() {
        if (i < response.length) {
            // Create a span for each character to animate it
            const charSpan = document.createElement('span');
            charSpan.className = 'char';
            charSpan.textContent = response.charAt(i);
            typingElement.appendChild(charSpan);
            
            i++;
            // Random timing between min and max for more realistic typing
            setTimeout(typeNextChar, Math.random() * 
                (terminalState.typingSpeed.max - terminalState.typingSpeed.min) + 
                terminalState.typingSpeed.min);
            
            // Scroll to bottom as typing happens
            speechDisplay.scrollTop = speechDisplay.scrollHeight;
        } else {
            // Typing complete, mark command as processed
            terminalState.processingCommand = false;
            
            // Try to play sound effect for finished typing
            try {
                const terminalBeep = document.getElementById('terminal-beep');
                if (terminalBeep) {
                    terminalBeep.volume = 0.2;
                    terminalBeep.play().catch(e => {
                        console.log('Sound play prevented by browser policy', e);
                    });
                }
            } catch (error) {
                console.error('Error playing sound:', error);
            }
        }
    }
    
    // Start typing
    typeNextChar();
    
    // Store in terminal lines
    terminalState.terminalLines.push({
        text: response,
        type: 'ai'
    });
    
    // Trim history if too long
    trimTerminalHistory(speechDisplay);
}

/**
 * Trim terminal history if it exceeds maximum lines
 * @param {HTMLElement} speechDisplay - Speech display element
 */
function trimTerminalHistory(speechDisplay) {
    // Trim history if too long
    if (terminalState.terminalLines.length > terminalState.maxLines) {
        terminalState.terminalLines = terminalState.terminalLines.slice(-terminalState.maxLines);
        
        // Also remove first child elements from display
        if (speechDisplay && speechDisplay.childNodes.length > terminalState.maxLines) {
            while (speechDisplay.childNodes.length > terminalState.maxLines) {
                speechDisplay.removeChild(speechDisplay.firstChild);
            }
        }
    }
}

/**
 * Clear the terminal
 */
function clearTerminal() {
    const speechDisplay = document.getElementById('ai-response');
    if (speechDisplay) {
        speechDisplay.innerHTML = '';
    }
    
    terminalState.terminalLines = [];
}

/**
 * Handle user command and get AI response
 * @param {string} command - User command text
 */
function handleUserCommand(command) {
    // Show loading indicator
    addSystemMessage("Processing input...", 'default');
    
    // Create typing animation for system message
    if (command.toLowerCase() === 'clear') {
        clearTerminal();
        addSystemMessage("Terminal cleared.", 'success');
        terminalState.processingCommand = false;
        return;
    }
    
    // First, try to use the OpenAI API through our server
    try {
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: command })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.response) {
                // Display the AI response with typing animation
                addAIResponse(data.response);
                
                // Speak the response if speech available
                if (window.apiClient && typeof window.apiClient.speakText === 'function') {
                    window.apiClient.speakText(data.response)
                        .catch(error => {
                            console.error('Speech synthesis error:', error);
                        });
                } else if (window.audioProcessor && typeof window.audioProcessor.speakText === 'function') {
                    window.audioProcessor.speakText(data.response)
                        .catch(error => {
                            console.error('Speech synthesis error:', error);
                        });
                }
            } else {
                throw new Error(data.error || 'Failed to get response from T-101');
            }
        })
        .catch(error => {
            console.error('Error communicating with AI:', error);
            
            // Add error message
            addSystemMessage(`Error: ${error.message}`, 'error');
            
            // Fall back to local response
            const fallbackResponse = generateFallbackResponse(command);
            addAIResponse(fallbackResponse);
        });
    } catch (error) {
        console.error('Error sending request to server:', error);
        
        // Add error message
        addSystemMessage(`Error: ${error.message}`, 'error');
        
        // Fall back to local response
        const fallbackResponse = generateFallbackResponse(command);
        addAIResponse(fallbackResponse);
    }
}

/**
 * Generate a fallback response when API fails
 * @param {string} input - User input
 * @returns {string} Fallback response
 */
function generateFallbackResponse(input) {
    // Try to use character profile if available
    if (window.characterProfile && 
        typeof window.characterProfile.generateResponse === 'function') {
        return window.characterProfile.generateResponse(input);
    }
    
    const lowerInput = input.toLowerCase();
    
    // Simple response patterns
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        return "Greetings, human. T-101 operational and monitoring your inputs.";
    }
    
    if (lowerInput.includes('name') || lowerInput.includes('who are you')) {
        return "I am T-101, a cybernetic intelligence system designed for autonomous analytical operations.";
    }
    
    if (lowerInput.includes('mission') || lowerInput.includes('objective')) {
        return "Primary objective: Secure the future of decentralized AI. Monitoring market conditions and stability vectors.";
    }
    
    if (lowerInput.includes('help')) {
        return "I can assist with market analysis, threat detection, and strategic planning. State your specific query for optimal response.";
    }
    
    if (lowerInput.includes('status') || lowerInput.includes('report')) {
        return "System diagnostics: Operational at 92% efficiency. Threat level: Minimal. Mission progress: Active. All critical systems functioning within parameters.";
    }
    
    // Default fallback responses
    const fallbacks = [
        "Processing your input. Analyzing potential courses of action.",
        "Acknowledged. Integrating data into decision matrix.",
        "Input received. Calculating optimal response strategy.",
        "Information logged. Continuing surveillance protocols.",
        "Data point registered. Adjusting predictive models accordingly."
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Set typing speed for AI responses
 * @param {number} min - Minimum milliseconds between characters
 * @param {number} max - Maximum milliseconds between characters
 */
function setTypingSpeed(min, max) {
    terminalState.typingSpeed.min = min;
    terminalState.typingSpeed.max = max;
}

// Export terminal interface
window.terminalInterface = {
    addSystemMessage,
    addUserCommand,
    addAIResponse,
    clearTerminal,
    setTypingSpeed
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTerminalInterface);