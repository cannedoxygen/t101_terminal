/**
 * T-101 Terminal - Backend Audio Processor
 * Utilities for processing audio files for speech recognition and synthesis
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Readable } = require('stream');

/**
 * Convert audio file to format compatible with Whisper API
 * @param {string} inputPath Path to input audio file
 * @param {string} outputPath Path to output audio file (optional)
 * @param {Object} options Conversion options
 * @returns {Promise<string>} Path to converted file
 */
exports.convertToWhisperFormat = async (inputPath, outputPath = null, options = {}) => {
    try {
        // Check if input file exists
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Input file not found: ${inputPath}`);
        }
        
        // Set default output path if not provided
        if (!outputPath) {
            const inputDir = path.dirname(inputPath);
            const inputBasename = path.basename(inputPath, path.extname(inputPath));
            outputPath = path.join(inputDir, `${inputBasename}_whisper.mp3`);
        }
        
        // Default options
        const {
            sampleRate = 16000,
            channels = 1,
            format = 'mp3',
            bitrate = '48k'
        } = options;
        
        // Check if ffmpeg is available (this is just a basic check)
        try {
            const ffmpegCheck = spawn('ffmpeg', ['-version']);
            ffmpegCheck.on('error', () => {
                throw new Error('ffmpeg not found. Please install ffmpeg to convert audio files.');
            });
        } catch (error) {
            console.warn('Warning: ffmpeg check failed, conversion may not work:', error.message);
        }
        
        // Convert using ffmpeg
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputPath,
                '-ar', sampleRate.toString(),
                '-ac', channels.toString(),
                '-c:a', 'libmp3lame',
                '-b:a', bitrate,
                '-y',  // Overwrite output file if it exists
                outputPath
            ]);
            
            let ffmpegError = '';
            
            ffmpeg.stderr.on('data', (data) => {
                ffmpegError += data.toString();
            });
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve(outputPath);
                } else {
                    reject(new Error(`ffmpeg conversion failed with code ${code}: ${ffmpegError}`));
                }
            });
            
            ffmpeg.on('error', (error) => {
                reject(new Error(`Failed to start ffmpeg: ${error.message}`));
            });
        });
    } catch (error) {
        console.error('Audio conversion error:', error);
        throw error;
    }
};

/**
 * Split large audio file into chunks for processing
 * @param {string} inputPath Path to input audio file
 * @param {string} outputDir Directory to save chunks
 * @param {number} chunkDuration Duration of each chunk in seconds
 * @returns {Promise<string[]>} Paths to chunk files
 */
exports.splitAudioIntoChunks = async (inputPath, outputDir, chunkDuration = 30) => {
    try {
        // Check if input file exists
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Input file not found: ${inputPath}`);
        }
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Get input file name without extension
        const inputBasename = path.basename(inputPath, path.extname(inputPath));
        
        // Split using ffmpeg
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputPath,
                '-f', 'segment',
                '-segment_time', chunkDuration.toString(),
                '-c', 'copy',
                path.join(outputDir, `${inputBasename}_chunk_%03d.mp3`)
            ]);
            
            let ffmpegError = '';
            
            ffmpeg.stderr.on('data', (data) => {
                ffmpegError += data.toString();
            });
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    // Get list of generated files
                    const chunkFiles = fs.readdirSync(outputDir)
                        .filter(file => file.startsWith(`${inputBasename}_chunk_`))
                        .sort()
                        .map(file => path.join(outputDir, file));
                    
                    resolve(chunkFiles);
                } else {
                    reject(new Error(`ffmpeg split failed with code ${code}: ${ffmpegError}`));
                }
            });
            
            ffmpeg.on('error', (error) => {
                reject(new Error(`Failed to start ffmpeg: ${error.message}`));
            });
        });
    } catch (error) {
        console.error('Audio splitting error:', error);
        throw error;
    }
};

/**
 * Extract audio from video file
 * @param {string} videoPath Path to video file
 * @param {string} outputPath Path to output audio file (optional)
 * @returns {Promise<string>} Path to extracted audio file
 */
exports.extractAudioFromVideo = async (videoPath, outputPath = null) => {
    try {
        // Check if input file exists
        if (!fs.existsSync(videoPath)) {
            throw new Error(`Video file not found: ${videoPath}`);
        }
        
        // Set default output path if not provided
        if (!outputPath) {
            const videoDir = path.dirname(videoPath);
            const videoBasename = path.basename(videoPath, path.extname(videoPath));
            outputPath = path.join(videoDir, `${videoBasename}_audio.mp3`);
        }
        
        // Extract audio using ffmpeg
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', videoPath,
                '-q:a', '0',
                '-map', 'a',
                outputPath
            ]);
            
            let ffmpegError = '';
            
            ffmpeg.stderr.on('data', (data) => {
                ffmpegError += data.toString();
            });
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve(outputPath);
                } else {
                    reject(new Error(`ffmpeg extraction failed with code ${code}: ${ffmpegError}`));
                }
            });
            
            ffmpeg.on('error', (error) => {
                reject(new Error(`Failed to start ffmpeg: ${error.message}`));
            });
        });
    } catch (error) {
        console.error('Audio extraction error:', error);
        throw error;
    }
};

/**
 * Normalize audio volume
 * @param {string} inputPath Path to input audio file
 * @param {string} outputPath Path to output audio file (optional)
 * @returns {Promise<string>} Path to normalized audio file
 */
exports.normalizeAudio = async (inputPath, outputPath = null) => {
    try {
        // Check if input file exists
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Input file not found: ${inputPath}`);
        }
        
        // Set default output path if not provided
        if (!outputPath) {
            const inputDir = path.dirname(inputPath);
            const inputBasename = path.basename(inputPath, path.extname(inputPath));
            outputPath = path.join(inputDir, `${inputBasename}_normalized${path.extname(inputPath)}`);
        }
        
        // Normalize using ffmpeg
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputPath,
                '-filter:a', 'loudnorm=I=-16:TP=-1.5:LRA=11',
                '-y',
                outputPath
            ]);
            
            let ffmpegError = '';
            
            ffmpeg.stderr.on('data', (data) => {
                ffmpegError += data.toString();
            });
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve(outputPath);
                } else {
                    reject(new Error(`ffmpeg normalization failed with code ${code}: ${ffmpegError}`));
                }
            });
            
            ffmpeg.on('error', (error) => {
                reject(new Error(`Failed to start ffmpeg: ${error.message}`));
            });
        });
    } catch (error) {
        console.error('Audio normalization error:', error);
        throw error;
    }
};

/**
 * Remove noise from audio file
 * @param {string} inputPath Path to input audio file
 * @param {string} outputPath Path to output audio file (optional)
 * @returns {Promise<string>} Path to cleaned audio file
 */
exports.removeNoise = async (inputPath, outputPath = null) => {
    try {
        // Check if input file exists
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Input file not found: ${inputPath}`);
        }
        
        // Set default output path if not provided
        if (!outputPath) {
            const inputDir = path.dirname(inputPath);
            const inputBasename = path.basename(inputPath, path.extname(inputPath));
            outputPath = path.join(inputDir, `${inputBasename}_denoised${path.extname(inputPath)}`);
        }
        
        // Apply noise reduction using ffmpeg
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputPath,
                '-af', 'afftdn=nf=-25',  // Noise reduction filter
                '-y',
                outputPath
            ]);
            
            let ffmpegError = '';
            
            ffmpeg.stderr.on('data', (data) => {
                ffmpegError += data.toString();
            });
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve(outputPath);
                } else {
                    reject(new Error(`ffmpeg noise removal failed with code ${code}: ${ffmpegError}`));
                }
            });
            
            ffmpeg.on('error', (error) => {
                reject(new Error(`Failed to start ffmpeg: ${error.message}`));
            });
        });
    } catch (error) {
        console.error('Audio noise removal error:', error);
        throw error;
    }
};

/**
 * Convert audio from WebM format (often used in browser recordings)
 * @param {Buffer} webmBuffer WebM audio buffer
 * @param {string} outputPath Path to save converted file
 * @returns {Promise<string>} Path to converted file
 */
exports.convertWebmToMp3 = async (webmBuffer, outputPath) => {
    try {
        // Create temp file for WebM buffer
        const tempDir = path.join(__dirname, '../temp');
        
        // Create temp directory if it doesn't exist
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempWebmPath = path.join(tempDir, `temp_${Date.now()}.webm`);
        
        // Write buffer to temp file
        fs.writeFileSync(tempWebmPath, webmBuffer);
        
        // Convert to MP3
        const result = await exports.convertToWhisperFormat(tempWebmPath, outputPath);
        
        // Clean up temp file
        fs.unlinkSync(tempWebmPath);
        
        return result;
    } catch (error) {
        console.error('WebM conversion error:', error);
        throw error;
    }
};

/**
 * Generate a silent audio file of specified duration
 * Useful for testing or creating placeholders
 * @param {string} outputPath Path to output audio file
 * @param {number} duration Duration in seconds
 * @returns {Promise<string>} Path to generated file
 */
exports.generateSilentAudio = async (outputPath, duration = 5) => {
    try {
        // Generate silent audio using ffmpeg
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-f', 'lavfi',
                '-i', 'anullsrc=r=44100:cl=mono',
                '-t', duration.toString(),
                '-q:a', '0',
                '-y',
                outputPath
            ]);
            
            let ffmpegError = '';
            
            ffmpeg.stderr.on('data', (data) => {
                ffmpegError += data.toString();
            });
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve(outputPath);
                } else {
                    reject(new Error(`ffmpeg silent audio generation failed with code ${code}: ${ffmpegError}`));
                }
            });
            
            ffmpeg.on('error', (error) => {
                reject(new Error(`Failed to start ffmpeg: ${error.message}`));
            });
        });
    } catch (error) {
        console.error('Silent audio generation error:', error);
        throw error;
    }
};

module.exports = exports;