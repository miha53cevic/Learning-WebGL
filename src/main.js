'use strict'

let image;
let image_grass;

/**@type {Shader}*/
let shader;

/**@type {Renderer}*/
let renderer;

/**@type {Entity}*/
let entity;

/**@type {Camera} */
let camera;

/**@type {Terrain} */
let terrain;

window.onload = function () {

    image = new this.Image();
    image.src = "./sample.png";

    image_grass = new this.Image();
    image_grass.src = "./grass.png";

    image.onload = function () {
        image_grass.onload = function() {
            setup();
        }
    }
}

function setup() {
    createCanvas(640, 480);
    resizeToFit();
    clear();

    const vertices = [
        -0.5, 0.5, -0.5,
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,

        -0.5, 0.5, 0.5,
        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,

        0.5, 0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,

        -0.5, 0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,

        -0.5, 0.5, 0.5,
        -0.5, 0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, 0.5,

        -0.5, -0.5, 0.5,
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5
    ];

    const indicies = [
        0, 1, 3,
        3, 1, 2,
        4, 5, 7,
        7, 5, 6,
        8, 9, 11,
        11, 9, 10,
        12, 13, 15,
        15, 13, 14,
        16, 17, 19,
        19, 17, 18,
        20, 21, 23,
        23, 21, 22
    ];

    const textureCoords = [
        0, 0,
        0, 1,
        1, 1,
        1, 0,
        0, 0,
        0, 1,
        1, 1,
        1, 0,
        0, 0,
        0, 1,
        1, 1,
        1, 0,
        0, 0,
        0, 1,
        1, 1,
        1, 0,
        0, 0,
        0, 1,
        1, 1,
        1, 0,
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

    uniform mat4 transformationMatrix;
    uniform mat4 projectionMatrix;
    uniform mat4 viewMatrix;
     
    void main(void) {
        gl_Position = projectionMatrix * viewMatrix * transformationMatrix * vec4(position, 1.0);
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

    shader = new Shader(vertexShaderSource, fragmentShaderSource);
    renderer = new Renderer(shader, 90, 0.1, 1000);
    camera = new Camera(glm.vec3(0, 0, 0), glm.vec3(0, 0, 0));

    entity = new Entity(mesh, glm.vec3(0, 0, -1.5));
    terrain = new Terrain(image_grass, 100);

    //mesh.Draw(shader);
    window.requestAnimationFrame(loop);
}


let time1 = 0, time2 = 0;
function loop() {

    time2 = Date.now();
    let deltaTime = time2 - time1;
    deltaTime /= 1000;
    time1 = time2;

    camera.speed = deltaTime * 10;
    camera.UpdateMouse();

    clear();
    entity.rotate(0, 1, 1);

    shader.Bind();
    shader.loadViewMatrix(camera.getViewMatrix());

    renderer.Draw(entity, shader);
    renderer.Draw(terrain.entity, shader);

    shader.Unbind();

    window.requestAnimationFrame(loop);
}