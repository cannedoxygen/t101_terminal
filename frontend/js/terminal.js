/**
 * terminal.js - Terminal interface functionality for T-101 AI Voice Terminal
 * Handles terminal-specific UI interactions and text rendering
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

// Terminal DOM elements
const terminalElements = {
    speechDisplay: document.getElementById('ai-response'),
    userInput: document.getElementById('user-input-display'),
    micToggle: document.getElementById('mic-toggle')
};

/**
 * Initialize terminal interface
 */
function initializeTerminal() {
    console.log('Initializing terminal interface...');
    
    // Setup terminal keyboard events
    setupTerminalKeyboardEvents();
    
    // Setup microphone button click event
    if (terminalElements.micToggle) {
        terminalElements.micToggle.addEventListener('click', toggleMicrophone);
    }
}

/**
 * Add system message to terminal
 * @param {string} message - System message to display
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
    if (terminalElements.speechDisplay) {
        terminalElements.speechDisplay.appendChild(messageElement);
        
        // Scroll to bottom
        terminalElements.speechDisplay.scrollTop = terminalElements.speechDisplay.scrollHeight;
    }
    
    // Store in terminal lines
    terminalState.terminalLines.push({
        text: message,
        type: type
    });
    
    // Trim history if too long
    if (terminalState.terminalLines.length > terminalState.maxLines) {
        terminalState.terminalLines.shift();
        // Also remove first child from display
        if (terminalElements.speechDisplay && 
            terminalElements.speechDisplay.childNodes.length > terminalState.maxLines) {
            terminalElements.speechDisplay.removeChild(terminalElements.speechDisplay.childNodes[0]);
        }
    }
}

/**
 * Add user command to terminal
 * @param {string} command - User command to display
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
    if (terminalElements.speechDisplay) {
        terminalElements.speechDisplay.appendChild(commandElement);
        
        // Scroll to bottom
        terminalElements.speechDisplay.scrollTop = terminalElements.speechDisplay.scrollHeight;
    }
    
    // Store in terminal lines
    terminalState.terminalLines.push({
        text: command,
        type: 'user'
    });
    
    // Trim history if too long
    if (terminalState.terminalLines.length > terminalState.maxLines) {
        terminalState.terminalLines.shift();
        // Also remove first child from display
        if (terminalElements.speechDisplay && 
            terminalElements.speechDisplay.childNodes.length > terminalState.maxLines) {
            terminalElements.speechDisplay.removeChild(terminalElements.speechDisplay.childNodes[0]);
        }
    }
    
    // Process the command
    processUserInput(command);
}

/**
 * Process user input and generate AI response
 * @param {string} command - User input to process
 */
function processUserInput(command) {
    // Lock input during processing
    terminalState.inputLocked = true;
    terminalState.processingCommand = true;
    
    // Generate AI response
    let aiResponse;
    
    // Use character profile if available
    if (window.characterProfile && typeof window.characterProfile.generateResponse === 'function') {
        aiResponse = window.characterProfile.generateResponse(command);
    } else {
        // Fallback responses
        const fallbackResponses = [
            "Processing your input. Analyzing potential courses of action.",
            "Acknowledged. Integrating data into decision matrix.",
            "Input received. Calculating optimal response strategy.",
            "Information logged. Continuing surveillance protocols.",
            "Data point registered. Adjusting predictive models accordingly."
        ];
        aiResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
    
    // Display AI response with typing effect
    displayAIResponse(aiResponse);
    
    // Unlock input after processing
    setTimeout(() => {
        terminalState.inputLocked = false;
        terminalState.processingCommand = false;
    }, 500);
}

/**
 * Display AI response with typing effect
 * @param {string} text - AI response text
 */
function displayAIResponse(text) {
    // Create response element
    const responseElement = document.createElement('div');
    responseElement.className = 'response-line';
    responseElement.innerHTML = `<span class="terminal-prefix">T-101 > </span> <span class="typing-text"></span>`;
    
    // Add to display
    if (terminalElements.speechDisplay) {
        terminalElements.speechDisplay.appendChild(responseElement);
        
        // Scroll to bottom
        terminalElements.speechDisplay.scrollTop = terminalElements.speechDisplay.scrollHeight;
        
        // Get the typing-text element we just added
        const typingElement = responseElement.querySelector('.typing-text');
        
        // Type out the response
        typeText(typingElement, text, 30, () => {
            // Speak the text if audio is available
            if (window.audioProcessor && typeof window.audioProcessor.speakText === 'function') {
                window.audioProcessor.speakText(text);
            } else if (window.apiClient && typeof window.apiClient.speakText === 'function') {
                window.apiClient.speakText(text);
            }
            
            // Add occasional glitch effect after response
            if (Math.random() < 0.3 && window.glitchEffects) {
                setTimeout(() => {
                    window.glitchEffects.triggerHorizontalGlitch();
                }, 500 + Math.random() * 1500);
            }
            
            // Activate waveform if available
            if (window.animationController && 
                typeof window.animationController.setWaveformActive === 'function') {
                window.animationController.setWaveformActive(true);
                
                // Deactivate after a few seconds
                setTimeout(() => {
                    window.animationController.setWaveformActive(false);
                }, 3000);
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
 * Toggle microphone input
 */
function toggleMicrophone() {
    // If audio processor is available, use it
    if (window.audioProcessor && typeof window.audioProcessor.toggleSpeechRecognition === 'function') {
        window.audioProcessor.toggleSpeechRecognition();
    } else if (window.apiClient && typeof window.apiClient.processVoiceInput === 'function') {
        window.apiClient.processVoiceInput()
            .then(text => {
                if (text) {
                    // Display recognized text
                    terminalElements.userInput.textContent = text;
                    
                    // Process the command
                    addUserCommand(text);
                }
            })
            .catch(error => {
                console.error('Voice input error:', error);
                addSystemMessage(`Error: ${error.message}`, 'error');
            });
    } else {
        // Fallback message if speech recognition isn't available
        addSystemMessage("Voice recognition not available. Please type your command.", 'warning');
        
        // Update UI to reflect state
        if (terminalElements.micToggle) {
            const micStatus = terminalElements.micToggle.querySelector('.mic-status');
            if (micStatus) {
                micStatus.textContent = 'VOICE INPUT UNAVAILABLE';
            }
        }
    }
}

/**
 * Setup keyboard events for terminal interaction
 */
function setupTerminalKeyboardEvents() {
    // Make the user input area focusable
    if (terminalElements.userInput) {
        terminalElements.userInput.setAttribute('contenteditable', 'true');
        
        // Focus input when clicking on terminal
        if (terminalElements.speechDisplay) {
            terminalElements.speechDisplay.addEventListener('click', () => {
                if (!terminalState.inputLocked) {
                    terminalElements.userInput.focus();
                }
            });
        }
        
        // Handle keyboard input
        terminalElements.userInput.addEventListener('keydown', (e) => {
            // Don't process if input is locked
            if (terminalState.inputLocked) {
                e.preventDefault();
                return;
            }
            
            switch (e.key) {
                case 'Enter':
                    // Prevent default behavior (newline)
                    e.preventDefault();
                    
                    // Get command text
                    const command = terminalElements.userInput.textContent.trim();
                    
                    // Process command if not empty
                    if (command) {
                        // Add command to terminal
                        addUserCommand(command);
                        
                        // Clear input
                        terminalElements.userInput.textContent = '';
                    }
                    break;
                    
                case 'ArrowUp':
                    // Navigate command history (up)
                    e.preventDefault();
                    
                    if (terminalState.commandHistory.length > 0) {
                        terminalState.historyIndex = Math.min(
                            terminalState.historyIndex + 1,
                            terminalState.commandHistory.length - 1
                        );
                        
                        terminalElements.userInput.textContent = 
                            terminalState.commandHistory[terminalState.historyIndex];
                        
                        // Place cursor at end
                        placeCaretAtEnd(terminalElements.userInput);
                    }
                    break;
                    
                case 'ArrowDown':
                    // Navigate command history (down)
                    e.preventDefault();
                    
                    if (terminalState.historyIndex > 0) {
                        terminalState.historyIndex--;
                        
                        terminalElements.userInput.textContent = 
                            terminalState.commandHistory[terminalState.historyIndex];
                    } else if (terminalState.historyIndex === 0) {
                        terminalState.historyIndex = -1;
                        terminalElements.userInput.textContent = '';
                    }
                    
                    // Place cursor at end
                    placeCaretAtEnd(terminalElements.userInput);
                    break;
                    
                case 'Escape':
                    // Clear input
                    e.preventDefault();
                    terminalElements.userInput.textContent = '';
                    break;
                    
                case 'l':
                case 'L':
                    // Clear terminal with Ctrl+L (like in real terminals)
                    if (e.ctrlKey) {
                        e.preventDefault();
                        
                        if (terminalElements.speechDisplay) {
                            terminalElements.speechDisplay.innerHTML = '';
                        }
                        
                        addSystemMessage('Terminal cleared');
                    }
                    break;
            }
        });
    }
}

/**
 * Utility to place caret at end of contenteditable
 * @param {HTMLElement} el - Element to place caret in
 */
function placeCaretAtEnd(el) {
    if (!el) return;
    
    el.focus();
    
    if (typeof window.getSelection !== "undefined" &&
        typeof document.createRange !== "undefined") {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange !== "undefined") {
        const textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}

// Initialize terminal when DOM is ready
document.addEventListener('DOMContentLoaded', initializeTerminal);

// Make processUserInput available globally
window.processUserInput = processUserInput;

// Export functions for use in other files
window.terminalInterface = {
    initializeTerminal: initializeTerminal,
    addSystemMessage: addSystemMessage,
    addUserCommand: addUserCommand,
    processUserInput: processUserInput,
    displayAIResponse: displayAIResponse
};