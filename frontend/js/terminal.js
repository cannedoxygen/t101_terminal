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
    maxLines: 100 // Maximum number of lines to keep in terminal history
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
        }
    });
}

/**
 * Set up microphone button functionality
 */
function setupMicButton() {
    const micButton = document.getElementById('mic-toggle');
    if (!micButton) {
        console.error('Microphone button not found');
        return;
    }
    
    micButton.addEventListener('click', () => {
        // Start recording animation
        micButton.classList.add('recording');
        const micStatus = micButton.querySelector('.mic-status');
        if (micStatus) {
            micStatus.textContent = 'RECORDING...';
        }
        
        // Show user we're listening
        addSystemMessage('Listening...', 'default');
        
        // Use browser's built-in speech recognition if available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('Speech recognized:', transcript);
                
                // Stop recording animation
                micButton.classList.remove('recording');
                if (micStatus) {
                    micStatus.textContent = 'VOICE INPUT READY';
                }
                
                // Process the recognized text
                addUserCommand(transcript);
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                addSystemMessage(`Voice recognition error: ${event.error}`, 'error');
                
                // Stop recording animation
                micButton.classList.remove('recording');
                if (micStatus) {
                    micStatus.textContent = 'VOICE INPUT READY';
                }
            };
            
            recognition.onend = () => {
                // Stop recording animation if it hasn't been stopped already
                micButton.classList.remove('recording');
                if (micStatus) {
                    micStatus.textContent = 'VOICE INPUT READY';
                }
            };
            
            // Start recognition
            recognition.start();
        } 
        // Try using the API client as a fallback
        else if (window.apiClient && typeof window.apiClient.processVoiceInput === 'function') {
            try {
                // Initialize API client if needed
                if (window.apiClient.initializeApiClient && !window.apiClient.initialized) {
                    window.apiClient.initializeApiClient();
                }
                
                // Use API client for voice processing
                window.apiClient.processVoiceInput()
                    .then(text => {
                        console.log('Voice input processed:', text);
                        
                        // Stop recording animation
                        micButton.classList.remove('recording');
                        if (micStatus) {
                            micStatus.textContent = 'VOICE INPUT READY';
                        }
                    })
                    .catch(error => {
                        console.error('Voice input error:', error);
                        addSystemMessage(`Voice input error: ${error.message}`, 'error');
                        
                        // Stop recording animation
                        micButton.classList.remove('recording');
                        if (micStatus) {
                            micStatus.textContent = 'VOICE INPUT READY';
                        }
                    });
            } catch (error) {
                console.error('Error initializing voice input:', error);
                addSystemMessage(`Voice initialization error: ${error.message}`, 'error');
                
                // Stop recording animation
                micButton.classList.remove('recording');
                if (micStatus) {
                    micStatus.textContent = 'VOICE INPUT READY';
                }
            }
        } else {
            console.error('No voice processing functionality available');
            addSystemMessage('Voice processing not available in this browser', 'error');
            
            // Stop recording animation
            micButton.classList.remove('recording');
            if (micStatus) {
                micStatus.textContent = 'VOICE INPUT READY';
            }
        }
    });
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
 * Add user command to terminal
 * @param {string} command - User command text
 */
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
    
    // Process the command - this will be handled by our own function now
    handleUserCommand(command);
}

/**
 * Add AI response to terminal
 * @param {string} response - AI response text
 */
function addAIResponse(response) {
    // Create response element
    const responseElement = document.createElement('div');
    responseElement.className = 'response-line';
    responseElement.innerHTML = `<span class="terminal-prefix">T-101 > </span> ${response}`;
    
    // Add to display
    const speechDisplay = document.getElementById('ai-response');
    if (speechDisplay) {
        speechDisplay.appendChild(responseElement);
        
        // Scroll to bottom
        speechDisplay.scrollTop = speechDisplay.scrollHeight;
    }
    
    // Store in terminal lines
    terminalState.terminalLines.push({
        text: response,
        type: 'ai'
    });
    
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
                // Display the AI response
                addAIResponse(data.response);
                
                // Speak the response if speech available
                if (window.apiClient && typeof window.apiClient.speakText === 'function') {
                    window.apiClient.speakText(data.response)
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
            
            // Fall back to local response
            const fallbackResponse = generateFallbackResponse(command);
            addAIResponse(fallbackResponse);
        });
    } catch (error) {
        console.error('Error sending request to server:', error);
        
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

// Export terminal interface
window.terminalInterface = {
    addSystemMessage,
    addUserCommand,
    addAIResponse,
    clearTerminal
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTerminalInterface);