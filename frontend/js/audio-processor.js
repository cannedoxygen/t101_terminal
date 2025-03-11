/**
 * audio-processor.js - Audio processing for T-101 AI Voice Terminal
 * Streamlined version optimized for Chrome
 */

// Audio state
const audioState = {
    recognition: null,
    recognizing: false,
    audioContext: null,
    analyser: null,
    stream: null,
    speaking: false
  };
  
  // Initialize audio processor
  function initializeAudioProcessor() {
    console.log('Initializing audio processor...');
    
    // Setup speech recognition
    setupSpeechRecognition();
    
    // Setup audio context for visualizations
    setupAudioContext();
  }
  
  // Setup speech recognition
  function setupSpeechRecognition() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn('Speech recognition not supported');
        return;
      }
      
      audioState.recognition = new SpeechRecognition();
      audioState.recognition.continuous = true;
      audioState.recognition.interimResults = true;
      audioState.recognition.lang = 'en-US';
      
      // Set up handlers
      audioState.recognition.onstart = () => {
        console.log('Recognition started');
        audioState.recognizing = true;
        updateMicUI(true);
        startAudioVisualization();
      };
      
      audioState.recognition.onend = () => {
        console.log('Recognition ended');
        audioState.recognizing = false;
        updateMicUI(false);
        stopAudioVisualization();
      };
      
      audioState.recognition.onresult = (event) => {
        let finalText = '';
        let interimText = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }
        
        if (finalText) {
          displayText(finalText, true);
          // Process command
          if (typeof processUserInput === 'function') {
            processUserInput(finalText);
          }
        }
        
        if (interimText) {
          displayText(interimText, false);
        }
      };
      
      audioState.recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
        audioState.recognizing = false;
        updateMicUI(false);
      };
      
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
    }
  }
  
  // Setup audio context for visualizations
  function setupAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('AudioContext not supported');
        return;
      }
      
      audioState.audioContext = new AudioContext();
      audioState.analyser = audioState.audioContext.createAnalyser();
      audioState.analyser.fftSize = 256;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }
  
  // Start speech recognition
  function startSpeechRecognition() {
    if (!audioState.recognition) {
      console.warn('Speech recognition not available');
      return false;
    }
    
    try {
      if (audioState.recognizing) {
        audioState.recognition.stop();
        return false;
      } else {
        audioState.recognition.start();
        return true;
      }
    } catch (error) {
      console.error('Error starting recognition:', error);
      return false;
    }
  }
  
  // Stop speech recognition
  function stopSpeechRecognition() {
    if (!audioState.recognition || !audioState.recognizing) return false;
    
    try {
      audioState.recognition.stop();
      return true;
    } catch (error) {
      console.error('Error stopping recognition:', error);
      return false;
    }
  }
  
  // Toggle speech recognition
  function toggleSpeechRecognition() {
    return audioState.recognizing ? stopSpeechRecognition() : startSpeechRecognition();
  }
  
  // Display recognized text
  function displayText(text, isFinal) {
    const userInput = document.getElementById('user-input-display');
    if (!userInput) return;
    
    userInput.textContent = text;
    
    if (isFinal) {
      userInput.classList.remove('interim');
    } else {
      userInput.classList.add('interim');
    }
  }
  
  // Update microphone UI
  function updateMicUI(isRecording) {
    const micToggle = document.getElementById('mic-toggle');
    if (!micToggle) return;
    
    if (isRecording) {
      micToggle.classList.add('recording');
      const micStatus = micToggle.querySelector('.mic-status');
      if (micStatus) micStatus.textContent = 'RECORDING...';
    } else {
      micToggle.classList.remove('recording');
      const micStatus = micToggle.querySelector('.mic-status');
      if (micStatus) micStatus.textContent = 'VOICE INPUT READY';
    }
  }
  
  // Start audio visualization
  function startAudioVisualization() {
    if (!audioState.audioContext || !audioState.analyser) return;
    
    try {
      // Resume context if suspended
      if (audioState.audioContext.state === 'suspended') {
        audioState.audioContext.resume();
      }
      
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          audioState.stream = stream;
          const source = audioState.audioContext.createMediaStreamSource(stream);
          source.connect(audioState.analyser);
          
          visualize();
        })
        .catch(error => {
          console.error('Microphone access error:', error);
        });
    } catch (error) {
      console.error('Visualization error:', error);
    }
  }
  
  // Visualize audio
  function visualize() {
    if (!audioState.analyser || !audioState.recognizing) return;
    
    const dataArray = new Uint8Array(audioState.analyser.frequencyBinCount);
    audioState.analyser.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    
    // Update waveform
    if (window.animationController && 
        typeof window.animationController.setWaveformActive === 'function') {
      window.animationController.setWaveformActive(true, Math.max(10, avg * 2), 3);
    }
    
    // Continue loop
    requestAnimationFrame(visualize);
  }
  
  // Stop audio visualization
  function stopAudioVisualization() {
    if (audioState.stream) {
      audioState.stream.getTracks().forEach(track => track.stop());
      audioState.stream = null;
    }
    
    // Deactivate waveform
    if (window.animationController && 
        typeof window.animationController.setWaveformActive === 'function') {
      window.animationController.setWaveformActive(false);
    }
  }
  
  // Speak text
  function speakText(text, options = {}) {
    return new Promise((resolve) => {
      try {
        // Try to use browser's speech synthesis
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(text);
          
          // Configure voice
          utterance.rate = 0.9;  // Slightly slower
          utterance.pitch = 0.8; // Deeper voice
          
          // Set a voice if available
          const voices = window.speechSynthesis.getVoices();
          for (const voice of voices) {
            if (voice.name.includes('Male') || voice.name.includes('David')) {
              utterance.voice = voice;
              break;
            }
          }
          
          // Handle events
          utterance.onstart = () => {
            audioState.speaking = true;
            
            // Activate waveform
            if (window.animationController && 
                typeof window.animationController.setWaveformActive === 'function') {
              window.animationController.setWaveformActive(true);
            }
          };
          
          utterance.onend = () => {
            audioState.speaking = false;
            
            // Deactivate waveform
            if (window.animationController && 
                typeof window.animationController.setWaveformActive === 'function') {
              window.animationController.setWaveformActive(false);
            }
            
            resolve();
          };
          
          utterance.onerror = () => {
            audioState.speaking = false;
            
            // Deactivate waveform
            if (window.animationController && 
                typeof window.animationController.setWaveformActive === 'function') {
              window.animationController.setWaveformActive(false);
            }
            
            resolve(); // Resolve instead of reject to prevent errors
          };
          
          window.speechSynthesis.speak(utterance);
        } else {
          console.warn('Speech synthesis not available');
          resolve();
        }
      } catch (error) {
        console.error('Speech error:', error);
        resolve(); // Resolve instead of reject
      }
    });
  }
  
  // Play sound
  function playSound(soundId, volume = 0.5) {
    try {
      const sound = document.getElementById(soundId);
      if (!sound) return;
      
      const soundClone = sound.cloneNode();
      soundClone.volume = volume;
      
      soundClone.play().catch(error => {
        console.warn('Sound playback error:', error);
      });
      
      soundClone.onended = () => soundClone.remove();
    } catch (error) {
      console.error('Sound error:', error);
    }
  }
  
  // Export functions
  window.audioProcessor = {
    initializeAudioProcessor,
    startSpeechRecognition,
    stopSpeechRecognition,
    toggleSpeechRecognition,
    speakText,
    playSound
  };
  
  // Initialize on load
  document.addEventListener('DOMContentLoaded', initializeAudioProcessor);