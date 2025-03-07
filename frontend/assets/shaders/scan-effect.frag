// Scan effect fragment shader for T-101 Terminal
// Creates a moving scan line effect like the Terminator's HUD scanning

precision mediump float;

// Uniforms passed from JavaScript
uniform vec2 u_resolution;   // Canvas resolution (width, height)
uniform float u_time;        // Time in seconds since shader started
uniform sampler2D u_texture; // Input texture (screen content)
uniform float u_scanIntensity; // Scan line intensity (0.0 - 1.0)
uniform vec3 u_scanColor;    // Scan line color (default to red)

// Varying passed from vertex shader
varying vec2 v_texCoord;    // Texture coordinates

// Constants
const float SCAN_SPEED = 0.5;     // Speed of the scan line
const float SCAN_WIDTH = 0.05;    // Width of the primary scan line
const float SCAN_BLUR = 0.025;    // Blur amount for scan edges
const float NOISE_AMOUNT = 0.03;  // Amount of noise to add
const float DISTORTION = 0.002;   // Amount of distortion during scan
const float GLOW_RADIUS = 0.15;   // Radius of the scan glow
const int NUM_SCAN_LINES = 3;     // Number of secondary scan lines

// Pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Noise function for distortion
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth interpolation
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}

// Scan line function 
float scanLine(float pos, float y, float width, float blur) {
    float scanPos = pos - y;
    return smoothstep(width/2.0 + blur, width/2.0, abs(scanPos));
}

void main() {
    // Get texture coordinates
    vec2 st = v_texCoord;
    
    // Get original texture color
    vec4 texColor = texture2D(u_texture, st);
    
    // Calculate primary scan line position (cycles from 0 to 1)
    float scanPos = mod(u_time * SCAN_SPEED, 1.0);
    
    // Create the main scan line effect
    float scan = scanLine(scanPos, st.y, SCAN_WIDTH, SCAN_BLUR);
    
    // Create secondary scan lines (fainter, following the main line)
    for (int i = 1; i <= NUM_SCAN_LINES; i++) {
        float offset = float(i) * 0.1;
        float secondaryScanPos = mod(scanPos + offset, 1.0);
        float secondaryWidth = SCAN_WIDTH * (1.0 - float(i) * 0.2);
        float secondaryBlur = SCAN_BLUR * (1.0 + float(i) * 0.3);
        float secondaryIntensity = 0.7 / float(i);
        
        scan += scanLine(secondaryScanPos, st.y, secondaryWidth, secondaryBlur) * secondaryIntensity;
    }
    
    // Limit scan intensity
    scan = min(scan * u_scanIntensity, 1.0);
    
    // Calculate distortion amount based on scan line proximity
    float distortionAmount = DISTORTION * scan;
    
    // Add noise to the texture coordinates for areas near the scan line
    float noiseValue = noise(st * 20.0 + vec2(0.0, u_time * 3.0));
    
    // Distort texture coordinates when scan line is passing
    vec2 distortedCoords = st;
    distortedCoords.x += distortionAmount * noiseValue;
    
    // Re-sample texture with distorted coordinates
    vec4 distortedTexColor = texture2D(u_texture, distortedCoords);
    
    // Mix between original and distorted texture based on scan intensity
    texColor = mix(texColor, distortedTexColor, scan * 0.3);
    
    // Add scan line glow
    float glow = scanLine(scanPos, st.y, SCAN_WIDTH + GLOW_RADIUS, SCAN_BLUR * 2.0);
    
    // Calculate scan line color with glow
    vec3 scanLineColor = u_scanColor * scan;
    vec3 glowColor = u_scanColor * glow * 0.5;
    
    // Add horizontal line artifacts
    float lineArtifact = 0.0;
    if (random(vec2(floor(st.y * 100.0), u_time)) < 0.02) {
        lineArtifact = 0.1 * scan;
    }
    
    // Add scan line color and artifacts to the texture
    vec3 finalColor = texColor.rgb + scanLineColor + glowColor + vec3(lineArtifact);
    
    // Adjust color levels for scanning effect
    finalColor.r = mix(finalColor.r, finalColor.r * 1.2, scan * 0.3);
    finalColor.b = mix(finalColor.b, finalColor.b * 0.8, scan * 0.3);
    
    // Add static noise during scan
    float staticNoise = random(st * 100.0 + vec2(0.0, u_time * 10.0));
    finalColor += vec3(staticNoise * NOISE_AMOUNT * scan);
    
    // Output final color
    gl_FragColor = vec4(finalColor, texColor.a);
}