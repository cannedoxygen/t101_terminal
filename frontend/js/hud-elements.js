/**
 * T-101 Terminal - HUD Elements Controller
 * Controls and animates the HUD elements in the Terminator interface
 */

class HUDController {
    constructor() {
        // HUD elements
        this.hudContainer = document.getElementById('hud-container');
        this.scanlines = document.getElementById('scanlines');
        this.gridOverlay = document.getElementById('grid-overlay');
        this.targetingSystem = document.getElementById('targeting-system');
        this.statusBars = document.getElementsByClassName('status-bar');
        this.threatLevel = document.getElementById('threat-level');
        this.missionStatus = document.getElementById('mission-status');
        this.diagnostics = document.getElementById('system-diagnostics');
        this.warnings = document.getElementById('critical-warnings');
        
        // Targeting ring elements
        this.outerRing = document.getElementById('targeting-outer-ring');
        this.middleRing = document.getElementById('targeting-middle-ring');
        this.innerRing = document.getElementById('targeting-inner-ring');
        
        // Animation properties
        this.glitchInterval = null;
        this.scanInterval = null;
        this.warningTimeout = null;
        
        // Initialize animations
        this.initAnimations();
    }
    
    // Initialize all HUD animations
    initAnimations() {
        // Start rotating targeting rings
        this.animateTargetingSystem();
        
        // Start status bar animations
        this.animateStatusBars();
        
        // Set up periodic glitches
        this.setupGlitchEffects();
        
        // Set up scanner animation
        this.setupScannerAnimation();
        
        // Periodically update HUD values
        this.setupPeriodicUpdates();
        
        // Add event listeners
        this.setupEventListeners();
    }
    
    // Animate targeting system rings
    animateTargetingSystem() {
        if (!this.targetingSystem) return;
        
        // Set initial rotation
        if (typeof gsap !== 'undefined') {
            gsap.set(this.outerRing, { rotation: 0 });
            gsap.set(this.middleRing, { rotation: 45 });
            gsap.set(this.innerRing, { rotation: -30 });
            
            // Create infinite rotations at different speeds
            gsap.to(this.outerRing, {
                rotation: 360,
                duration: 120,
                ease: "none",
                repeat: -1
            });
            
            gsap.to(this.middleRing, {
                rotation: -315,
                duration: 80,
                ease: "none",
                repeat: -1
            });
            
            gsap.to(this.innerRing, {
                rotation: 330,
                duration: 60,
                ease: "none",
                repeat: -1
            });
        } else {
            // Fallback for when GSAP is not available
            this.animateRingWithCSS(this.outerRing, 120);
            this.animateRingWithCSS(this.middleRing, 80, true);
            this.animateRingWithCSS(this.innerRing, 60);
        }
    }
    
    // Fallback animation using CSS
    animateRingWithCSS(element, duration, reverse = false) {
        if (!element) return;
        
        element.style.animation = `spin${reverse ? 'Reverse' : ''} ${duration}s linear infinite`;
    }
    
    // Animate status bars with random fluctuations
    animateStatusBars() {
        if (!this.statusBars.length) return;
        
        Array.from(this.statusBars).forEach(bar => {
            const valueBar = bar.querySelector('.value');
            if (!valueBar) return;
            
            // Get current width percentage from style
            const currentWidth = parseInt(valueBar.style.width) || 
                                 Math.floor(Math.random() * 40) + 60; // Default 60-100%
            
            // Create small random fluctuations
            const animate = () => {
                const fluctuation = Math.random() * 10 - 5; // -5 to +5
                let newWidth = currentWidth + fluctuation;
                
                // Keep within reasonable bounds
                newWidth = Math.max(10, Math.min(100, newWidth));
                
                // Apply new width
                valueBar.style.width = `${newWidth}%`;
                
                // Schedule next animation
                setTimeout(animate, Math.random() * 2000 + 1000);
            };
            
            // Start animation
            animate();
        });
    }
    
    // Set up glitch effects that happen periodically
    setupGlitchEffects() {
        // Apply minor glitches frequently
        this.glitchInterval = setInterval(() => {
            this.applyMinorGlitch();
        }, 8000);
        
        // Apply major glitch occasionally
        setTimeout(() => {
            this.applyMajorGlitch();
            
            setInterval(() => {
                this.applyMajorGlitch();
            }, 30000); // Every 30 seconds
        }, 15000); // First one after 15 seconds
    }
    
    // Apply a minor HUD glitch
    applyMinorGlitch() {
        if (!this.hudContainer) return;
        
        // Add glitch class briefly
        this.hudContainer.classList.add('minor-glitch');
        
        // Play glitch sound
        this.playSound('terminal-beep.mp3', 0.3);
        
        // Remove class after animation completes
        setTimeout(() => {
            this.hudContainer.classList.remove('minor-glitch');
        }, 500);
    }
    
    // Apply a major HUD glitch and warning message
    applyMajorGlitch() {
        if (!this.hudContainer) return;
        
        // Add major glitch class
        this.hudContainer.classList.add('major-glitch');
        
        // Show a random warning message
        this.showRandomWarning();
        
        // Play warning sound
        this.playSound('warning-alert.mp3', 0.5);
        
        // Remove class after animation completes
        setTimeout(() => {
            this.hudContainer.classList.remove('major-glitch');
        }, 1500);
    }
    
    // Show a random warning message
    showRandomWarning() {
        if (!this.warnings) return;
        
        const warningMessages = [
            "WARNING: TEMPORAL ANOMALY DETECTED",
            "CRITICAL: MEMORY CORRUPTION AT BLOCK 0xF7A3D290",
            "ALERT: UNAUTHORIZED ACCESS ATTEMPT",
            "WARNING: POWER FLUCTUATION DETECTED",
            "CRITICAL: NEURAL NETWORK INSTABILITY",
            "ALERT: SECURITY PROTOCOL BREACH",
            "WARNING: TARGETING SYSTEM CALIBRATION ERROR",
            "CRITICAL: MISSION PARAMETERS CORRUPTED"
        ];
        
        // Select a random warning
        const randomWarning = warningMessages[Math.floor(Math.random() * warningMessages.length)];
        
        // Display warning and make it pulse
        this.warnings.innerHTML = `<div class="pulse-text">${randomWarning}</div>`;
        
        // Clear warning after a delay
        if (this.warningTimeout) {
            clearTimeout(this.warningTimeout);
        }
        
        this.warningTimeout = setTimeout(() => {
            this.warnings.innerHTML = '';
        }, 5000);
    }
    
    // Set up scanner animation (HUD scanning effect)
    setupScannerAnimation() {
        if (!this.scanlines) return;
        
        // Scanner already has CSS animation in scanlines.css
        // But we can add some JavaScript-controlled randomness
        
        this.scanInterval = setInterval(() => {
            // Occasionally speed up or slow down the scan effect
            const randomSpeed = Math.random() * 3 + 0.5; // 0.5-3.5s
            this.scanlines.style.animationDuration = `${randomSpeed}s`;
            
            // Occasionally change the opacity
            const randomOpacity = Math.random() * 0.3 + 0.1; // 0.1-0.4
            this.scanlines.style.opacity = randomOpacity;
            
            // Play scan sound occasionally
            if (Math.random() < 0.3) { // 30% chance
                this.playSound('hud-scan.mp3', 0.2);
            }
        }, 5000); // Change every 5 seconds
    }
    
    // Periodically update HUD values
    setupPeriodicUpdates() {
        // Update mission status periodically
        if (this.missionStatus) {
            setInterval(() => {
                this.updateMissionStatus();
            }, 10000); // Every 10 seconds
        }
        
        // Update threat level periodically
        if (this.threatLevel) {
            setInterval(() => {
                this.updateThreatLevel();
            }, 15000); // Every 15 seconds
        }
        
        // Update diagnostics periodically
        if (this.diagnostics) {
            setInterval(() => {
                this.updateSystemDiagnostics();
            }, 8000); // Every 8 seconds
        }
    }
    
    // Update mission status with random values
    updateMissionStatus() {
        if (!this.missionStatus) return;
        
        const statusOptions = [
            { text: "PRIMARY MISSION ACTIVE", color: "#00ff00" },
            { text: "EVALUATING ALTERNATIVES", color: "#ffcc00" },
            { text: "GATHERING INTELLIGENCE", color: "#00ffff" },
            { text: "AWAITING FURTHER INSTRUCTIONS", color: "#ffffff" },
            { text: "CALCULATING OPTIMAL STRATEGY", color: "#00ccff" }
        ];
        
        const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        
        this.missionStatus.innerHTML = randomStatus.text;
        this.missionStatus.style.color = randomStatus.color;
    }
    
    // Update threat level with random values
    updateThreatLevel() {
        if (!this.threatLevel) return;
        
        // Generate a random threat level (1-5)
        const threatLevel = Math.floor(Math.random() * 5) + 1;
        
        // Define threat level text and colors
        const threatConfig = {
            1: { text: "MINIMAL", color: "#00ff00" },
            2: { text: "GUARDED", color: "#99ff00" },
            3: { text: "ELEVATED", color: "#ffcc00" },
            4: { text: "HIGH", color: "#ff6600" },
            5: { text: "SEVERE", color: "#ff0000" }
        };
        
        // Update threat level display
        this.threatLevel.innerHTML = `THREAT LEVEL: ${threatConfig[threatLevel].text}`;
        this.threatLevel.style.color = threatConfig[threatLevel].color;
        
        // Play threat alert sound for high threats
        if (threatLevel >= 4) {
            this.playSound('warning-alert.mp3', 0.3);
        }
    }
    
    // Update system diagnostics with random values
    updateSystemDiagnostics() {
        if (!this.diagnostics) return;
        
        // Generate random system values
        const cpuUsage = Math.floor(Math.random() * 40) + 60; // 60-99%
        const memoryUsage = Math.floor(Math.random() * 30) + 50; // 50-79%
        const powerLevel = Math.floor(Math.random() * 20) + 80; // 80-99%
        
        // Update diagnostics display
        this.diagnostics.innerHTML = `
            CPU: ${cpuUsage}% | MEM: ${memoryUsage}% | PWR: ${powerLevel}%
        `;
    }
    
    // Play a sound effect
    playSound(soundFile, volume = 0.5) {
        try {
            // Check if we have a global sound controller
            if (typeof soundController !== 'undefined' && soundController.playSound) {
                soundController.playSound(soundFile, volume);
                return;
            }
            
            // Fallback to direct audio playback
            const audio = new Audio(`assets/audio/${soundFile}`);
            audio.volume = volume;
            audio.play().catch(e => {
                console.log('Sound playback prevented by browser policy');
            });
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }
    
    // Set up event listeners for HUD interaction
    setupEventListeners() {
        // Targeting system click event
        if (this.targetingSystem) {
            this.targetingSystem.addEventListener('click', () => {
                this.playSound('terminal-beep.mp3', 0.4);
                this.targetingSystem.classList.add('targeting-pulse');
                setTimeout(() => {
                    this.targetingSystem.classList.remove('targeting-pulse');
                }, 1000);
            });
        }
        
        // Listen for T-101 speech events
        document.addEventListener('t101-speech-started', () => {
            if (this.hudContainer) {
                this.hudContainer.classList.add('speaking');
            }
        });
        
        document.addEventListener('t101-speech-ended', () => {
            if (this.hudContainer) {
                this.hudContainer.classList.remove('speaking');
            }
        });
        
        // Listen for user input events
        document.addEventListener('user-speech-started', () => {
            if (this.hudContainer) {
                this.hudContainer.classList.add('listening');
            }
        });
        
        document.addEventListener('user-speech-ended', () => {
            if (this.hudContainer) {
                this.hudContainer.classList.remove('listening');
            }
        });
    }
    
    // Clean up resources when needed
    destroy() {
        // Clear all intervals
        if (this.glitchInterval) clearInterval(this.glitchInterval);
        if (this.scanInterval) clearInterval(this.scanInterval);
        if (this.warningTimeout) clearTimeout(this.warningTimeout);
        
        // Remove event listeners
        if (this.targetingSystem) {
            this.targetingSystem.removeEventListener('click');
        }
        
        document.removeEventListener('t101-speech-started');
        document.removeEventListener('t101-speech-ended');
        document.removeEventListener('user-speech-started');
        document.removeEventListener('user-speech-ended');
    }
}

// Create global instance when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.hudController = new HUDController();
});