// animations.js - Animation controllers for T-101 AI Voice Terminal
// Handles waveform animations, text effects, and other animated elements

"use strict";

// Animation state
const animationState = {
    waveformActive: false,
    waveformAmplitude: 50,
    waveformFrequency: 2,
    textAnimations: [],
    dataStreams: [],
    particlesSystems: [],
    scanLines: []
};

// Canvas contexts
let waveformCtx;
let particlesCtx;

// Initialize animations
function initializeAnimations() {
    console.log('Initializing animations...');
    
    // Initialize waveform
    initializeWaveform();
    
    // Initialize scan effects
    initializeScanEffects();
    
    // Initialize text animations
    initializeTextAnimations();
    
    // Start animation loops
    startAnimationLoops();
}

// Initialize waveform canvas and animation
function initializeWaveform() {
    const waveformCanvas = document.getElementById('waveform-canvas');
    
    if (!waveformCanvas) {
        console.error('Waveform canvas not found!');
        return;
    }
    
    // Get canvas context
    waveformCtx = waveformCanvas.getContext('2d');
    
    // Set canvas dimensions
    resizeWaveformCanvas();
    
    // Listen for window resize
    window.addEventListener('resize', resizeWaveformCanvas);
    
    // Create circular elements
    const waveformContainer = document.querySelector('.waveform-container');
    
    if (waveformContainer) {
        for (let i = 0; i < 3; i++) {
            const circle = document.createElement('div');
            circle.className = 'waveform-circle';
            circle.style.animationDelay = `${i * 0.2}s`;
            waveformContainer.appendChild(circle);
        }
    }
}

// Resize waveform canvas to match container
function resizeWaveformCanvas() {
    const waveformCanvas = document.getElementById('waveform-canvas');
    
    if (!waveformCanvas) return;
    
    const container = waveformCanvas.parentElement;
    
    if (container) {
        waveformCanvas.width = container.offsetWidth;
        waveformCanvas.height = container.offsetHeight;
    }
}

// Initialize scan effects
function initializeScanEffects() {
    // Create scan line overlay if it doesn't exist
    if (!document.querySelector('.scan-lines')) {
        const scanLineOverlay = document.createElement('div');
        scanLineOverlay.className = 'scan-lines';
        const hudContainer = document.querySelector('.hud-container');
        if (hudContainer) {
            hudContainer.appendChild(scanLineOverlay);
        }
    }
    
    // Create digital noise effect if it doesn't exist
    if (!document.querySelector('.digital-noise')) {
        const noiseOverlay = document.createElement('div');
        noiseOverlay.className = 'digital-noise';
        const hudContainer = document.querySelector('.hud-container');
        if (hudContainer) {
            hudContainer.appendChild(noiseOverlay);
        }
    }
}

// Initialize text animation effects
function initializeTextAnimations() {
    // Apply RGB split effect to terminal header
    const terminalHeader = document.querySelector('.terminal-prefix');
    
    if (terminalHeader) {
        // Occasional RGB split effect
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance
                terminalHeader.classList.add('rgb-split-anim');
                
                setTimeout(() => {
                    terminalHeader.classList.remove('rgb-split-anim');
                }, 800);
            }
        }, 8000);
    }
}

// Start animation loops
function startAnimationLoops() {
    // Start waveform animation
    requestAnimationFrame(animateWaveform);
    
    // Start data stream creation
    setInterval(createRandomDataStream, 3000);
    
    // Occasional horizontal glitch
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance
            createHorizontalGlitch();
        }
    }, 15000);
}

// Animate waveform
function animateWaveform(timestamp) {
    if (!waveformCtx) {
        requestAnimationFrame(animateWaveform);
        return;
    }
    
    const canvas = waveformCtx.canvas;
    
    // Clear canvas
    waveformCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Only draw active waveform if active
    if (animationState.waveformActive) {
        drawActiveWaveform(timestamp);
    } else {
        drawIdleWaveform(timestamp);
    }
    
    // Continue animation loop
    requestAnimationFrame(animateWaveform);
}

// Draw active waveform visualization
function drawActiveWaveform(timestamp) {
    const canvas = waveformCtx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Calculate radius and number of points based on canvas size
    const maxRadius = Math.min(centerX, centerY) * 0.9;
    const numPoints = 180;
    const angleStep = (Math.PI * 2) / numPoints;
    
    // Draw multiple rings with different phases
    for (let ring = 1; ring <= 3; ring++) {
        const ringRadius = maxRadius * (ring / 4);
        const amplitude = animationState.waveformAmplitude * (ring / 3);
        const frequency = animationState.waveformFrequency * (4 - ring) / 2;
        const timeOffset = timestamp / 1000 * frequency;
        
        // Set style based on ring
        waveformCtx.strokeStyle = ring === 1 ? 
            'rgba(255, 42, 42, 0.8)' : 
            ring === 2 ? 
            'rgba(255, 42, 42, 0.6)' : 
            'rgba(255, 42, 42, 0.4)';
        
        waveformCtx.lineWidth = 4 - ring + 1;
        
        // Begin path
        waveformCtx.beginPath();
        
        // Draw points around circle
        for (let i = 0; i <= numPoints; i++) {
            const angle = i * angleStep;
            
            // Calculate wave effect
            const waveEffect = Math.sin(angle * 8 + timeOffset) * amplitude;
            
            // Calculate point position
            const x = centerX + Math.cos(angle) * (ringRadius + waveEffect);
            const y = centerY + Math.sin(angle) * (ringRadius + waveEffect);
            
            // First point moves to, others line to
            if (i === 0) {
                waveformCtx.moveTo(x, y);
            } else {
                waveformCtx.lineTo(x, y);
            }
        }
        
        // Close path and stroke
        waveformCtx.closePath();
        waveformCtx.stroke();
    }
    
    // Draw center pulse
    const pulseSize = 10 + Math.sin(timestamp / 200) * 5;
    
    waveformCtx.fillStyle = 'rgba(255, 42, 42, 0.8)';
    waveformCtx.beginPath();
    waveformCtx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
    waveformCtx.fill();
}

// Draw idle waveform visualization
function drawIdleWaveform(timestamp) {
    const canvas = waveformCtx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw subtle idle circles
    const radius = 30 + Math.sin(timestamp / 1000) * 5;
    
    waveformCtx.strokeStyle = 'rgba(255, 42, 42, 0.2)';
    waveformCtx.lineWidth = 1;
    
    waveformCtx.beginPath();
    waveformCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    waveformCtx.stroke();
    
    waveformCtx.beginPath();
    waveformCtx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
    waveformCtx.stroke();
}

// Create random data stream animation
function createRandomDataStream() {
    const container = document.querySelector('.hud-container');
    if (!container) return;
    
    // Create stream element
    const stream = document.createElement('div');
    stream.className = 'data-stream';
    
    // Random position
    stream.style.left = `${Math.random() * 100}%`;
    
    // Random height and speed
    const duration = Math.random() * 2 + 1;
    stream.style.animation = `data-stream-animation ${duration}s linear forwards`;
    
    // Add to container
    container.appendChild(stream);
    
    // Store in state
    animationState.dataStreams.push(stream);
    
    // Remove after animation completes
    setTimeout(() => {
        if (stream.parentNode) {
            stream.parentNode.removeChild(stream);
        }
        
        // Remove from state
        const index = animationState.dataStreams.indexOf(stream);
        if (index !== -1) {
            animationState.dataStreams.splice(index, 1);
        }
    }, duration * 1000);
}

// Create horizontal glitch line
function createHorizontalGlitch() {
    const container = document.querySelector('.terminal-container');
    if (!container) return;
    
    // Create glitch element
    const glitch = document.createElement('div');
    glitch.className = 'h-glitch active';
    
    // Random position
    glitch.style.top = `${Math.random() * 100}%`;
    
    // Add to container
    container.appendChild(glitch);
    
    // Remove after animation completes
    setTimeout(() => {
        if (glitch.parentNode) {
            glitch.parentNode.removeChild(glitch);
        }
    }, 300);
}

// Create vertical glitch bar
function createVerticalGlitch() {
    const container = document.querySelector('.terminal-container');
    if (!container) return;
    
    // Create glitch element
    const glitch = document.createElement('div');
    glitch.className = 'v-glitch-bar active';
    
    // Random position
    glitch.style.left = `${Math.random() * 100}%`;
    
    // Add to container
    container.appendChild(glitch);
    
    // Remove after animation completes
    setTimeout(() => {
        if (glitch.parentNode) {
            glitch.parentNode.removeChild(glitch);
        }
    }, 300);
}

// Create voice wave visualization
function createVoiceWaves(container) {
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
}

// Set waveform active state
function setWaveformActive(active, amplitude, frequency) {
    animationState.waveformActive = !!active;
    
    if (active) {
        // Update parameters
        animationState.waveformAmplitude = amplitude || 50;
        animationState.waveformFrequency = frequency || 2;
        
        // Add class to container
        const container = document.querySelector('.waveform-container');
        if (container) {
            container.classList.add('waveform-active');
        }
    } else {
        // Remove class from container
        const container = document.querySelector('.waveform-container');
        if (container) {
            container.classList.remove('waveform-active');
        }
    }
}

// Create screen glitch effect
function createScreenGlitch() {
    const container = document.querySelector('.terminal-container');
    if (!container) return;
    
    // Add screen glitch class
    container.classList.add('screen-glitch', 'active');
    
    // Create horizontal glitches
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            createHorizontalGlitch();
        }, i * 100);
    }
    
    // Create vertical glitch
    createVerticalGlitch();
    
    // Add noise overlay
    const noiseOverlay = document.createElement('div');
    noiseOverlay.className = 'noise-overlay active';
    container.appendChild(noiseOverlay);
    
    // Remove effects after animation completes
    setTimeout(() => {
        container.classList.remove('screen-glitch', 'active');
        if (noiseOverlay.parentNode) {
            noiseOverlay.parentNode.removeChild(noiseOverlay);
        }
    }, 300);
}

// Return a random number between min and max
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Export to window object for access from other scripts
window.animationController = {
    initializeAnimations: initializeAnimations,
    setWaveformActive: setWaveformActive,
    createDataStream: createRandomDataStream,
    createHorizontalGlitch: createHorizontalGlitch,
    createVerticalGlitch: createVerticalGlitch,
    createVoiceWaves: createVoiceWaves,
    createScreenGlitch: createScreenGlitch
};

// Initialize animations when page loads
document.addEventListener('DOMContentLoaded', initializeAnimations);