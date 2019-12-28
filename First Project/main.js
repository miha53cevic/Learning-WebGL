"use strict";

window.onload = function() {
    this.main();
    console.log(glMatrix);
} 

function main() {
    /**
     * @type {HTMLCanvasElement} canvas 
    */
    const canvas = document.getElementById('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const gl = canvas.getContext('webgl2');
    
    const vertices = [
        -0.5,  0.5, 0.0,
        -0.5, -0.5, 0.0,
         0.5, -0.5, 0.0,
         0.5,  0.5, 0.0
    ];

    const indicies = [
        0, 1, 2,
        2, 3, 0
    ]; 

    const VAO = gl.createVertexArray();
    gl.bindVertexArray(VAO);

    // Vertex buffer object
    const VBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Element buffer object
    const EBO = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indicies), gl.STATIC_DRAW);
    // Must be bound when drawing so no need to unbind EBO now

    gl.bindVertexArray(null);

    const vertexShaderSource = `#version 300 es
 
    in vec3 position;
    
    out vec4 colour;
     
    void main(void) {
        gl_Position = vec4(position, 1.0);
        colour = vec4(0);
    }
    `;

    const fragmentShaderSource = `#version 300 es
    precision mediump float;

    in vec4 colour;

    out vec4 Frag_colour;

    void main(void) {
        Frag_colour = colour;
    }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.log("Vertex Shader Compile Error!");
    }

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragmentShaderSource);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        console.log("Fragment Shader Compile Error!");
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Program Link Error!");
    }

    // Clear
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw
    gl.useProgram(program);

    gl.bindVertexArray(VAO);

    gl.drawElements(gl.TRIANGLES, indicies.length, gl.UNSIGNED_INT, 0);

    gl.bindVertexArray(null);

    gl.useProgram(null);
}