let image;

window.onload = function() {

    image = new this.Image();
    image.src = "./sample.png";

    image.onload = function() {
        main();
    }
}

function main() {
    createCanvas(640, 480);
    clear();

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

    const textureCoords = [
        0, 0,
        0, 1,
        1, 1,
        1, 0
    ];

    const mesh = new Mesh(vertices, indicies);
    mesh.addTexture(image, textureCoords);

    const vertexShaderSource = `#version 300 es
 
    in vec3 position;
    in vec2 textureCoords;
    
    out vec4 colour;
    out vec2 pass_textureCoords;
     
    void main(void) {
        gl_Position = vec4(position, 1.0);
        pass_textureCoords = textureCoords;
    }
    `;

    const fragmentShaderSource = `#version 300 es
    precision mediump float;

    in vec4 colour;
    in vec2 pass_textureCoords;

    out vec4 Frag_colour;

    uniform sampler2D textureSampler;

    void main(void) {
        Frag_colour = texture(textureSampler, pass_textureCoords);
    }
    `;

    const shader = new Shader(vertexShaderSource, fragmentShaderSource);

    mesh.Draw(shader);
}