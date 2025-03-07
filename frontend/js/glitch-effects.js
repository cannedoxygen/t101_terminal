/**
 * glitch-effects.js - Glitch and distortion effects for T-101 AI Voice Terminal
 * Manages various glitch effects for creating the cybernetic, dystopian aesthetic
 */

// Glitch state
const glitchState = {
    glitchInterval: null,
    glitchFrequency: 15000, // ms between random glitches
    glitchChance: 0.3, // 30% chance of glitch during interval
    systemDegraded: false, // More glitches when system is degraded
    activeGlitches: [],
    maxActiveGlitches: 3
};

/**
 * Initialize glitch effects
 */
function initializeGlitchEffects() {
    console.log('Initializing glitch effects...');
    
    // Start random glitch interval
    startRandomGlitches();
    
    // Set up special elements for glitch effects
    setupGlitchTargets();
}

/**
 * Start random glitch interval
 */
function startRandomGlitches() {
    // Clear existing interval if any
    if (glitchState.glitchInterval) {
        clearInterval(glitchState.glitchInterval);
    }
    
    // Set new interval
    glitchState.glitchInterval = setInterval(() => {
        // Random chance to trigger glitch
        if (Math.random() < glitchState.glitchChance) {
            triggerRandomGlitch();
        }
    }, glitchState.glitchFrequency);
}

/**
 * Set up elements that can be targeted for glitch effects
 */
function setupGlitchTargets() {
    // Add data-text attributes to elements that will receive text glitches
    const terminalPrefix = document.querySelectorAll('.terminal-prefix');
    
    terminalPrefix.forEach(el => {
        el.setAttribute('data-text', el.textContent);
    });
    
    // Set up status items for occasional glitches
    const statusLabels = document.querySelectorAll('.status-label');
    
    statusLabels.forEach(el => {
        el.setAttribute('data-text', el.textContent);
    });
}

/**
 * Trigger a random glitch effect
 */
function triggerRandomGlitch() {
    // Don't exceed max active glitches
    if (glitchState.activeGlitches.length >= glitchState.maxActiveGlitches) {
        return;
    }
    
    // Pick a random glitch type
    const glitchTypes = [
        'textGlitch',
        'screenGlitch',
        'horizontalGlitch',
        'rgbSplit',
        'pixelSort',
        'textCorruption',
        'verticalGlitch',
        'noiseOverlay'
    ];
    
    // Weight towards simpler glitches when there are already active glitches
    let glitchPool;
    if (glitchState.activeGlitches.length > 0) {
        glitchPool = [
            'textGlitch',
            'horizontalGlitch',
            'rgbSplit',
            'textCorruption'
        ];
    } else {
        glitchPool = glitchTypes;
    }
    
    // Pick a random glitch from the pool
    const glitchType = glitchPool[Math.floor(Math.random() * glitchPool.length)];
    
    // Trigger the selected glitch
    switch (glitchType) {
        case 'textGlitch':
            triggerTextGlitch();
            break;
        case 'screenGlitch':
            triggerScreenGlitch();
            break;
        case 'horizontalGlitch':
            triggerHorizontalGlitch();
            break;
        case 'rgbSplit':
            triggerRGBSplit();
            break;
        case 'pixelSort':
            triggerPixelSort();
            break;
        case 'textCorruption':
            triggerTextCorruption();
            break;
        case 'verticalGlitch':
            triggerVerticalGlitch();
            break;
        case 'noiseOverlay':
            triggerNoiseOverlay();
            break;
    }
}

/**
 * Trigger text glitch effect on a random text element
 */
function triggerTextGlitch() {
    // Find potential targets
    const targets = [
        ...document.querySelectorAll('.terminal-prefix'),
        ...document.querySelectorAll('.status-label'),
        ...document.querySelectorAll('.profile-value')
    ];
    
    if (targets.length === 0) return;
    
    // Pick a random target
    const target = targets[Math.floor(Math.random() * targets.length)];
    
    // Add to active glitches
    const glitchId = 'text-glitch-' + Date.now();
    glitchState.activeGlitches.push(glitchId);
    
    // Apply glitch
    target.setAttribute('data-text', target.textContent);
    target.classList.add('text-glitch');
    
    // Play glitch sound
    playGlitchSound('minor');
    
    // Remove after random duration
    const duration = Math.random() * 2000 + 1000;
    setTimeout(() => {
        target.classList.remove('text-glitch');
        
        // Remove from active glitches
        const index = glitchState.activeGlitches.indexOf(glitchId);
        if (index !== -1) {
            glitchState.activeGlitches.splice(index, 1);
        }
    }, duration);
}

/**
 * Trigger full screen glitch effect
 */
function triggerScreenGlitch() {
    // Add to active glitches
    const glitchId = 'screen-glitch-' + Date.now();
    glitchState.activeGlitches.push(glitchId);
    
    // Get terminal container
    const terminal = document.querySelector('.terminal-container');
    if (!terminal) return;
    
    // Apply glitch class
    terminal.classList.add('screen-glitch', 'active');
    
    // Create horizontal glitches
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            createHorizontalGlitch();
        }, i * 100);
    }
    
    // Add a vertical glitch bar
    createVerticalGlitch();
    
    // Add noise overlay
    const noiseOverlay = document.createElement('div');
    noiseOverlay.className = 'noise-overlay active';
    terminal.appendChild(noiseOverlay);
    
    // Play glitch sound
    playGlitchSound('major');
    
    // Remove after animation completes
    setTimeout(() => {
        terminal.classList.remove('screen-glitch', 'active');
        if (noiseOverlay.parentNode) {
            noiseOverlay.parentNode.removeChild(noiseOverlay);
        }
        
        // Remove from active glitches
        const index = glitchState.activeGlitches.indexOf(glitchId);
        if (index !== -1) {
            glitchState.activeGlitches.splice(index, 1);
        }
    }, 300);
}

/**
 * Create horizontal glitch line
 */
function createHorizontalGlitch() {
    const hGlitch = document.createElement('div');
    hGlitch.className = 'h-glitch active';
    
    // Random position
    hGlitch.style.top = `${Math.random() * 100}%`;
    
    // Add to terminal container
    document.querySelector('.terminal-container').appendChild(hGlitch);
    
    // Remove after animation completes
    setTimeout(() => {
        if (hGlitch.parentNode) {
            hGlitch.parentNode.removeChild(hGlitch);
        }
    }, 300);
}

/**
 * Create vertical glitch bar
 */
function createVerticalGlitch() {
    const vGlitch = document.createElement('div');
    vGlitch.className = 'v-glitch-bar active';
    
    // Random position
    vGlitch.style.left = `${Math.random() * 100}%`;
    
    // Add to terminal container
    document.querySelector('.terminal-container').appendChild(vGlitch);
    
    // Remove after animation completes
    setTimeout(() => {
        if (vGlitch.parentNode) {
            vGlitch.parentNode.removeChild(vGlitch);
        }
    }, 300);
}

/**
 * Trigger horizontal glitch line effect
 */
function triggerHorizontalGlitch() {
    // Add to active glitches
    const glitchId = 'h-glitch-' + Date.now();
    glitchState.activeGlitches.push(glitchId);
    
    // Create multiple horizontal glitch lines
    const count = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            createHorizontalGlitch();
        }, i * 100);
    }
    
    // Play glitch sound
    playGlitchSound('minor');
    
    // Remove from active glitches after all animations complete
    setTimeout(() => {
        const index = glitchState.activeGlitches.indexOf(glitchId);
        if (index !== -1) {
            glitchState.activeGlitches.splice(index, 1);
        }
    }, count * 100 + 300);
}

/**
 * Trigger vertical glitch bar effect
 */
function triggerVerticalGlitch() {
    // Add to active glitches
    const glitchId = 'v-glitch-' + Date.now();
    glitchState.activeGlitches.push(glitchId);
    
    // Create vertical glitch
    createVerticalGlitch();
    
    // Play glitch sound
    playGlitchSound('minor');
    
    // Remove from active glitches after animation completes
    setTimeout(() => {
        const index = glitchState.activeGlitches.indexOf(glitchId);
        if (index !== -1) {
            glitchState.activeGlitches.splice(index, 1);
        }
    }, 300);
}

/**
 * Trigger RGB split effect on a random text element
 */
function triggerRGBSplit() {
    // Find potential targets
    const targets = [
        ...document.querySelectorAll('.terminal-prefix'),
        ...document.querySelectorAll('.status-label'),
        ...document.querySelectorAll('.profile-value'),
        ...document.querySelectorAll('.response-line')
    ];
    
    if (targets.length === 0) return;
    
    // Pick a random target
    const target = targets[Math.floor(Math.random() * targets.length)];
    
    // Add to active glitches
    const glitchId = 'rgb-split-' + Date.now();
    glitchState.activeGlitches.push(glitchId);
    
    // Apply RGB split
    target.setAttribute('data-text', target.textContent);
    target.classList.add('rgb-split', 'rgb-split-anim');
    
    // Play glitch sound
    playGlitchSound('minor');
    
    // Remove after random duration
    const duration = Math.random() * 1000 + 500;
    setTimeout(() => {
        target.classList.remove('rgb-split', 'rgb-split-anim');
        target.removeAttribute('data-text');
        
        // Remove from active glitches
        const index = glitchState.activeGlitches.indexOf(glitchId);
        if (index !== -1) {
            glitchState.activeGlitches.splice(index, 1);
        }
    }, duration);
}

/**
 * Trigger pixel sorting effect on a container
 */
function triggerPixelSort() {
    // Find potential targets
    const targets = [
        document.querySelector('.speech-display'),
        document.querySelector('.character-profile'),
        document.querySelector('.status-container')
    ].filter(Boolean);
    
    if (targets.length === 0) return;
    
    // Pick a random target
    const target = targets[Math.floor(Math.random() * targets.length)];
    
    // Add to active glitches
    const glitchId = 'pixel-sort-' + Date.now();
    glitchState.activeGlitches.push(glitchId);
    
    // Apply pixel sort
    target.classList.add('pixel-sort', 'active');
    
    // Play glitch sound
    playGlitchSound('minor');
    
    // Remove after random duration
    const duration = Math.random() * 500 + 300;
    setTimeout(() => {
        target.classList.remove('pixel-sort', 'active');
        
        // Remove from active glitches
        const index = glitchState.activeGlitches.indexOf(glitchId);
        if (index !== -1) {
            glitchState.activeGlitches.splice(index, 1);
        }
    }, duration);
}

/**
 * Trigger text corruption effect on a response line
 */
function triggerTextCorruption() {
    // Find potential targets
    const targets = document.querySelectorAll('.response-line');
    
    if (targets.length === 0) return;
    
    // Pick a random target
    const target = targets[Math.floor(Math.random() * targets.length)];
    
    // Add to active glitches
    const glitchId = 'text-corruption-' + Date.now();
    glitchState.activeGlitches.push(glitchId);
    
    // Apply text corruption
    target.classList.add('text-corruption', 'active');
    
    // Play glitch sound
    playGlitchSound('minor');
    
    // Remove after animation completes
    setTimeout(() => {
        target.classList.remove('text-corruption', 'active');
        
        // Remove from active glitches
        const index = glitchState.activeGlitches.indexOf(glitchId);
        if (index !== -1) {
            glitchState.activeGlitches.splice(index, 1);
        }
    }, 800);
}

/**
 * Trigger noise overlay effect
 */
function triggerNoiseOverlay() {
    // Add to active glitches
    const glitchId = 'noise-overlay-' + Date.now();
    glitchState.activeGlitches.push(glitchId);
    
    // Create noise overlay
    const noiseOverlay = document.createElement('div');
    noiseOverlay.className = 'noise-overlay active';
    
    // Add to terminal container
    document.querySelector('.terminal-container').appendChild(noiseOverlay);
    
    // Play glitch sound
    playGlitchSound('minor');
    
    // Remove after random duration
    const duration = Math.random() * 500 + 200;
    setTimeout(() => {
        if (noiseOverlay.parentNode) {
            noiseOverlay.parentNode.removeChild(noiseOverlay);
        }
        
        // Remove from active glitches
        const index = glitchState.activeGlitches.indexOf(glitchId);
        if (index !== -1) {
            glitchState.activeGlitches.splice(index, 1);
        }
    }, duration);
}

/**
 * Play glitch sound effect
 * @param {string} type - 'minor' or 'major' glitch
 */
function playGlitchSound(type) {
    // Get sound element
    const warningSound = document.getElementById('warning-alert');
    const beepSound = document.getElementById('terminal-beep');
    
    let sound;
    if (type === 'major' && warningSound) {
        sound = warningSound.cloneNode(true);
        sound.volume = 0.3;
    } else if (beepSound) {
        sound = beepSound.cloneNode(true);
        sound.volume = 0.1;
    } else {
        return;
    }
    
    // Play sound
    sound.play();
    
    // Remove after playback
    sound.addEventListener('ended', () => {
        sound.remove();
    });
}

/**
 * Set system degraded state (increases glitch frequency)
 * @param {boolean} degraded - Whether system is degraded
 */
function setSystemDegraded(degraded) {
    glitchState.systemDegraded = degraded;
    
    // Adjust glitch frequency and chance based on system state
    if (degraded) {
        glitchState.glitchFrequency = 5000; // More frequent glitches
        glitchState.glitchChance = 0.6; // Higher chance of glitch
        glitchState.maxActiveGlitches = 5; // More simultaneous glitches
    } else {
        glitchState.glitchFrequency = 15000; // Less frequent glitches
        glitchState.glitchChance = 0.3; // Lower chance of glitch
        glitchState.maxActiveGlitches = 3; // Fewer simultaneous glitches
    }
    
    // Restart random glitch interval with new settings
    startRandomGlitches();
    
    // If degraded, trigger an immediate glitch
    if (degraded) {
        triggerScreenGlitch();
    }
}

// Export functions for use in other files
if (typeof window !== 'undefined') {
    // Add to window object for access from other scripts
    window.glitchEffects = {
        initializeGlitchEffects,
        triggerTextGlitch,
        triggerScreenGlitch,
        triggerHorizontalGlitch,
        triggerVerticalGlitch,
        triggerRGBSplit,
        triggerPixelSort,
        triggerTextCorruption,
        triggerNoiseOverlay,
        setSystemDegraded
    };
}