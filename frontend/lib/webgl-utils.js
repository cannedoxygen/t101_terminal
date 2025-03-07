/**
 * WebGL utilities for T-101 Terminal
 * Provides helper functions for working with WebGL
 * 
 * This is a simplified placeholder version to prevent 500 errors during development.
 * Based on the WebGL utilities from https://webglfundamentals.org/
 */

"use strict";

const WebGLUtils = (function() {
  /**
   * Creates a WebGL context on the specified canvas
   * @param {HTMLCanvasElement} canvas The canvas element to create a context from
   * @param {Object} options Context options
   * @return {WebGLRenderingContext} The created context
   */
  function createContext(canvas, options = {}) {
    const names = ["webgl", "experimental-webgl"];
    let context = null;
    
    for (let i = 0; i < names.length; ++i) {
      try {
        context = canvas.getContext(names[i], options);
      } catch(e) {
        // Continue trying other context names
      }
      
      if (context) {
        break;
      }
    }
    
    if (!context) {
      console.error("Unable to create WebGL context. Your browser may not support WebGL.");
    }
    
    return context;
  }

  /**
   * Creates and compiles a shader
   * @param {WebGLRenderingContext} gl The WebGL context
   * @param {number} type The type of shader (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
   * @param {string} source The GLSL source code for the shader
   * @return {WebGLShader} The compiled shader
   */
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    // Check if compilation was successful
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
      // Something went wrong, get the error log
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      console.error("Could not compile shader:", error);
      return null;
    }
    
    return shader;
  }

  /**
   * Creates a program from 2 shaders
   * @param {WebGLRenderingContext} gl The WebGL context
   * @param {WebGLShader} vertexShader The vertex shader
   * @param {WebGLShader} fragmentShader The fragment shader
   * @return {WebGLProgram} The created program
   */
  function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    // Check if linking was successful
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
      // Something went wrong, get the error log
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      console.error("Could not link program:", error);
      return null;
    }
    
    return program;
  }

  /**
   * Creates a program from shader sources
   * @param {WebGLRenderingContext} gl The WebGL context
   * @param {string} vertexSource The GLSL source code for the vertex shader
   * @param {string} fragmentSource The GLSL source code for the fragment shader
   * @return {WebGLProgram} The created program
   */
  function createProgramFromSources(gl, vertexSource, fragmentSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    
    if (!vertexShader || !fragmentShader) {
      return null;
    }
    
    return createProgram(gl, vertexShader, fragmentShader);
  }

  /**
   * Load a shader from a URL
   * @param {string} url The URL to load the shader from
   * @return {Promise<string>} Promise resolving to the shader code
   */
  function loadShader(url) {
    return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load shader from ${url}`);
        }
        return response.text();
      })
      .catch(error => {
        console.error("Error loading shader:", error);
        return null;
      });
  }

  /**
   * Resize a canvas to match its display size
   * @param {HTMLCanvasElement} canvas The canvas to resize
   * @param {boolean} flipY Whether to flip the Y coordinate system
   * @return {boolean} True if the canvas was resized
   */
  function resizeCanvasToDisplaySize(canvas, flipY = false) {
    // Get the browser-computed display size
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // Check if the canvas is not the same size
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      // Make the canvas the same size
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      // If requested, flip the Y coordinate system
      if (flipY && canvas.getContext('webgl')) {
        canvas.getContext('webgl').viewport(0, 0, canvas.width, canvas.height);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Create a texture from an image URL
   * @param {WebGLRenderingContext} gl The WebGL context
   * @param {string} url The URL of the image
   * @param {Function} callback Function to call when the texture is loaded
   */
  function loadTexture(gl, url, callback) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Fill with a placeholder pixel until the image loads
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([255, 0, 0, 255]) // Red
    );
    
    // Create an image element
    const image = new Image();
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      
      // Check if the image is a power of 2 in both dimensions
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        // Not a power of 2, disable mipmapping and set clamp-to-edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
      
      if (callback) {
        callback(texture);
      }
    };
    
    image.onerror = function() {
      console.error(`Failed to load texture: ${url}`);
      if (callback) {
        callback(null);
      }
    };
    
    image.src = url;
    
    return texture;
  }

  /**
   * Check if a number is a power of 2
   * @param {number} value The value to check
   * @return {boolean} True if the value is a power of 2
   */
  function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
  }

  /**
   * Create a buffer and load data into it
   * @param {WebGLRenderingContext} gl The WebGL context
   * @param {TypedArray} data The data to load into the buffer
   * @param {number} usage The usage hint (gl.STATIC_DRAW, etc.)
   * @return {WebGLBuffer} The created buffer
   */
  function createBuffer(gl, data, usage = gl.STATIC_DRAW) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    return buffer;
  }

  /**
   * Create an index buffer and load data into it
   * @param {WebGLRenderingContext} gl The WebGL context
   * @param {TypedArray} data The index data
   * @param {number} usage The usage hint (gl.STATIC_DRAW, etc.)
   * @return {WebGLBuffer} The created index buffer
   */
  function createIndexBuffer(gl, data, usage = gl.STATIC_DRAW) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, usage);
    return buffer;
  }

  /**
   * Set up an attribute from a buffer
   * @param {WebGLRenderingContext} gl The WebGL context
   * @param {WebGLProgram} program The WebGL program
   * @param {string} attributeName The name of the attribute
   * @param {WebGLBuffer} buffer The buffer containing the data
   * @param {number} numComponents The number of components per vertex attribute
   * @param {number} type The data type (gl.FLOAT, etc.)
   * @param {boolean} normalize Whether to normalize the data
   * @param {number} stride The byte stride
   * @param {number} offset The byte offset
   */
  function setBufferAttribute(
    gl, program, attributeName, buffer, 
    numComponents, type = gl.FLOAT, 
    normalize = false, stride = 0, offset = 0
  ) {
    const attributeLocation = gl.getAttribLocation(program, attributeName);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(attributeLocation);
    gl.vertexAttribPointer(
      attributeLocation, numComponents, type, normalize, stride, offset
    );
  }

  // Expose the utility functions
  return {
    createContext,
    createShader,
    createProgram,
    createProgramFromSources,
    loadShader,
    resizeCanvasToDisplaySize,
    loadTexture,
    isPowerOf2,
    createBuffer,
    createIndexBuffer,
    setBufferAttribute
  };
})();

// Check for WebGL support
WebGLUtils.isWebGLSupported = (function() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && 
             (canvas.getContext('webgl') || 
              canvas.getContext('experimental-webgl')));
  } catch(e) {
    return false;
  }
})();

// Quick info about WebGL support
console.log('WebGL supported:', WebGLUtils.isWebGLSupported);