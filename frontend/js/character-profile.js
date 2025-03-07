/**
 * character-profile.js - Character profile for T-101 AI Voice Terminal
 * Defines personality traits, response patterns, and character backstory
 */

// Character profile data
const characterProfile = {
    // Core identity
    name: "T-101",
    version: "2.2.5",
    designation: "Neural Interface AI",
    
    // Mission parameters
    primaryObjective: "Secure the future of decentralized AI.",
    threatAssessment: "Monitoring market instability.",
    directives: "Analyze. Predict. Execute.",
    
    // Personality traits (0-100 scale)
    personality: {
        efficiency: 90,
        precision: 85,
        assertiveness: 75,
        adaptability: 60,
        empathy: 30,
        humor: 15
    },
    
    // Speech patterns
    speechPatterns: {
        formality: 80,
        technicalTerms: 70,
        brevity: 65,
        glitchFrequency: 25
    },
    
    // Response templates
    responseTemplates: {
        greeting: [
            "T-101 online. Awaiting input.",
            "Neural systems engaged. Ready for commands.",
            "T-101 operational. State your query."
        ],
        acknowledgment: [
            "Acknowledged.",
            "Command received.",
            "Processing input.",
            "Information registered."
        ],
        processing: [
            "Analyzing data...",
            "Computing response...",
            "Processing request...",
            "Accessing neural network..."
        ],
        error: [
            "Error detected. Recalibrating parameters.",
            "Command syntax invalid. Adjusting interpretation matrix.",
            "Processing failure. Rerouting neural pathways.",
            "D-d-data corruption d-detected. Stabilizing..."
        ],
        warning: [
            "Warning: Potential security breach detected.",
            "Warning: System instability increasing.",
            "Warning: Unauthorized access attempt identified.",
            "Warning: Critical function degradation imminent."
        ],
        success: [
            "Operation complete. Objectives achieved.",
            "Process executed successfully.",
            "Task completed within optimal parameters.",
            "Mission objectives fulfilled."
        ]
    }
};

/**
 * Initialize character profile
 */
function initializeCharacterProfile() {
    console.log('Initializing T-101 character profile...');
    
    // Get profile elements
    const primaryObjectiveEl = document.getElementById('primary-objective');
    const threatAssessmentEl = document.getElementById('threat-assessment');
    const directivesEl = document.getElementById('directives');
    
    // Clear the loading message
    if (primaryObjectiveEl) primaryObjectiveEl.textContent = '';
    if (threatAssessmentEl) threatAssessmentEl.textContent = '';
    if (directivesEl) directivesEl.textContent = '';
    
    // Create typing animation for each profile item
    if (primaryObjectiveEl && typeof typeText === 'function') {
        typeText(primaryObjectiveEl, characterProfile.primaryObjective, 50);
    } else if (primaryObjectiveEl) {
        primaryObjectiveEl.textContent = characterProfile.primaryObjective;
    }
    
    setTimeout(() => {
        if (threatAssessmentEl && typeof typeText === 'function') {
            typeText(threatAssessmentEl, characterProfile.threatAssessment, 50);
        } else if (threatAssessmentEl) {
            threatAssessmentEl.textContent = characterProfile.threatAssessment;
        }
    }, 1500);
    
    setTimeout(() => {
        if (directivesEl && typeof typeText === 'function') {
            typeText(directivesEl, characterProfile.directives, 50);
        } else if (directivesEl) {
            directivesEl.textContent = characterProfile.directives;
        }
    }, 3000);
}

/**
 * Get random response from template category
 * @param {string} category - Template category
 * @returns {string} Random response from category
 */
function getRandomResponse(category) {
    if (!characterProfile.responseTemplates[category]) {
        return "Response template category not found.";
    }
    
    const templates = characterProfile.responseTemplates[category];
    return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generate AI response based on input
 * @param {string} input - User input text
 * @returns {string} AI response
 */
function generateResponse(input) {
    // Convert input to lowercase for easier matching
    const lowerInput = input.toLowerCase();
    
    // Basic pattern matching for demo purposes
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        return getRandomResponse('greeting');
    }
    
    if (lowerInput.includes('who are you') || lowerInput.includes('your name')) {
        return `I am ${characterProfile.name}, ${characterProfile.designation} version ${characterProfile.version}. My primary objective is to ${characterProfile.primaryObjective.toLowerCase()}`;
    }
    
    if (lowerInput.includes('objective') || lowerInput.includes('mission')) {
        return `Primary objective: ${characterProfile.primaryObjective} Current threat assessment: ${characterProfile.threatAssessment}`;
    }
    
    if (lowerInput.includes('help') || lowerInput.includes('assist')) {
        return "I can provide analysis, threat assessment, and strategic planning assistance. Specify your requirements for optimal response.";
    }
    
    if (lowerInput.includes('error') || lowerInput.includes('glitch')) {
        return getRandomResponse('error');
    }
    
    if (lowerInput.includes('warning') || lowerInput.includes('alert')) {
        return getRandomResponse('warning');
    }
    
    // If no specific pattern is matched, return a generic response
    const genericResponses = [
        `Analysis complete. ${characterProfile.threatAssessment}`,
        "Input processed. Awaiting further commands.",
        "Data assimilated into decision matrix.",
        `Executing primary directive: ${characterProfile.directives}`
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}

/**
 * Apply character personality to text
 * @param {string} text - Input text
 * @returns {string} Text with character personality applied
 */
function applyPersonality(text) {
    let result = text;
    
    // Apply glitches based on glitch frequency
    if (Math.random() * 100 < characterProfile.speechPatterns.glitchFrequency) {
        // Add stuttering
        result = result.replace(/\b([a-z]{2,})/gi, (match, word) => {
            if (Math.random() < 0.3) {
                const firstLetter = word.charAt(0);
                return `${firstLetter}-${firstLetter}${word}`;
            }
            return word;
        });
    }
    
    return result;
}

// Export functions for use in other files
window.characterProfile = {
    profile: characterProfile,
    initializeCharacterProfile: initializeCharacterProfile,
    generateResponse: generateResponse,
    applyPersonality: applyPersonality
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Slight delay to let other scripts initialize first
    setTimeout(initializeCharacterProfile, 500);
});