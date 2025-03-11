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
    
    // Process the command if processUserInput is available
    if (typeof processUserInput === 'function') {
        processUserInput(command);
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
    
    // Modern approach for all modern browsers
    if (window.getSelection && document.createRange) {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false); // false means collapse to end rather than start
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        // Fallback for older browsers (but not IE-specific TextRange)
        el.focus();
        // Move cursor to end by setting selection
        // This is a more universal approach that works in most browsers
        if (typeof el.selectionStart === 'number') {
            el.selectionStart = el.selectionEnd = el.value.length;
        } else {
            // Another approach for contenteditable
            // Create a text node with a zero-width space and append it
            // Then place the selection after it
            const zeroWidthSpace = document.createTextNode('\u200B');
            el.appendChild(zeroWidthSpace);
            
            const range = document.createRange();
            range.setStartAfter(zeroWidthSpace);
            range.collapse(true);
            
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Remove the zero-width space after selection is set
            el.removeChild(zeroWidthSpace);
        }
    }
}

// Initialize terminal when DOM is ready
document.addEventListener('DOMContentLoaded', initializeTerminal);

// Export functions for use in other files
window.terminalInterface = {
    initializeTerminal: initializeTerminal,
    addSystemMessage: addSystemMessage,
    addUserCommand: addUserCommand
};