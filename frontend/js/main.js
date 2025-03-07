// Start the terminal when DOM is ready
document.addEventListener('DOMContentLoaded', initializeTerminal);

/**
 * Toggle voice input state - Missing function part fixed
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
            typeof window.animationController.createVoiceWaves === 'function') {
            
            const userInputContainer = document.querySelector('.user-input-container');
            if (userInputContainer) {
                window.animationController.createVoiceWaves(userInputContainer);
            }
        }
        
        // Create screen glitch effect
        if (window.animationController && 
            typeof window.animationController.createScreenGlitch === 'function') {
            window.animationController.createScreenGlitch();
        }
        
        // Reduce system diagnostics
        updateSystemDiagnostics(STATE.systemDiagnostics - 15);
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
        
        // Default responses
        const defaultResponses = [
            "Processing your input. Analyzing potential courses of action.",
            "Acknowledged. Integrating data into decision matrix.",
            "Input received. Calculating optimal response strategy.",
            "Information logged. Continuing surveillance protocols.",
            "Data point registered. Adjusting predictive models accordingly."
        ];
        const response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        
        // Display the AI response
        displayAIResponse(response);
        
        // Reset state
        STATE.awaitingResponse = false;
    }
}

/**
 * Generate AI response - Fixed missing end of function
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
            typeof window.animationController.createScreenGlitch === 'function') {
            window.animationController.createScreenGlitch();
        }
    } else {
        // If no specific pattern is matched, return a generic response
        const genericResponses = [
            "Analysis complete. Continuing surveillance operations.",
            "Input processed. Awaiting further commands.",
            "Data assimilated into decision matrix.",
            "Executing primary directive: Secure the future of decentralized AI."
        ];
        
        response = genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }
    
    // Display the AI response
    displayAIResponse(response);
}