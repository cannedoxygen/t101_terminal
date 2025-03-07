// HUD glow fragment shader for T-101 Terminal
// Creates cybernetic, Terminator-style glow effects for HUD elements

precision mediump float;

// Uniforms passed from JavaScript
uniform vec2 u_resolution;  // Canvas resolution (width, height)
uniform float u_time;       // Time in seconds since shader started
uniform vec3 u_color;       // Primary glow color (default red)
uniform float u_intensity;  // Glow intensity

// Varying passed from vertex shader
varying vec2 v_texCoord;    // Texture coordinates

// Constants
const float SCAN_SPEED = 0.8;
const float NOISE_AMOUNT = 0.03;
const float GLOW_RADIUS = 0.35;
const float SCAN_WIDTH = 0.05;

// Pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Noise function for more organic effect
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth interpolation between points
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}

// Create circular glow effect
float circleGlow(vec2 st, vec2 center, float radius) {
    float dist = distance(st, center);
    return 1.0 - smoothstep(radius * (0.8 + 0.2 * sin(u_time * 1.5)), radius, dist);
}

// Scan line effect
float scanLine(vec2 st) {
    float scan = mod(st.y + u_time * SCAN_SPEED, 2.0);
    return smoothstep(0.0, SCAN_WIDTH, scan) * smoothstep(SCAN_WIDTH + 0.1, 0.0, scan);
}

void main() {
    // Normalize coordinates
    vec2 st = v_texCoord;
    vec2 center = vec2(0.5, 0.5);
    
    // Add slight movement to the center
    center.x += sin(u_time * 0.2) * 0.02;
    center.y += cos(u_time * 0.3) * 0.02;
    
    // Create base glow
    float glow = circleGlow(st, center, GLOW_RADIUS * (1.0 + 0.1 * sin(u_time)));
    
    // Add noise for grittier effect
    float noiseValue = noise(st * 10.0 + u_time * 0.5) * NOISE_AMOUNT;
    glow += noiseValue;
    
    // Add scan line
    float scan = scanLine(st);
    glow += scan * 0.1;
    
    // Create grid pattern
    vec2 grid = fract(st * 20.0);
    float gridLine = (smoothstep(0.95, 1.0, grid.x) + smoothstep(0.95, 1.0, grid.y)) * 0.3;
    glow += gridLine;
    
    // Create edge highlight
    float edge = 1.0 - abs(st.x - 0.5) * 2.0;
    edge *= 1.0 - abs(st.y - 0.5) * 2.0;
    edge = pow(edge, 0.5);
    
    // Mix glow color with intensity
    vec3 glowColor = u_color * glow * u_intensity;
    
    // Add time-based flicker to the intensity
    float flicker = 1.0 + 0.2 * sin(u_time * 10.0) * sin(u_time * 5.7);
    
    // Add subtle aberration (color splitting)
    vec3 color = vec3(
        glowColor.r * (1.0 + 0.05 * sin(u_time * 2.3)),
        glowColor.g * (1.0 + 0.04 * sin(u_time * 3.7)),
        glowColor.b * (1.0 + 0.03 * sin(u_time * 4.3))
    );
    
    // Apply flickering effect
    color *= flicker;
    
    // Increase edge glow
    color += u_color * edge * 0.1;
    
    // Set final color with alpha based on glow intensity
    gl_FragColor = vec4(color, glow * edge);
}