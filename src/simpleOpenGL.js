'use strict'

/**@type {Number} */
var WIDTH;

/**@type {Number} */
var HEIGHT;

/**@type {WebGL2RenderingContext} */
var gl;

var MOUSE_POS = {
    x: 0,
    y: 0
};

/**
 * @param {Number} width 
 * @param {Number} height 
 */
function createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.id = 'canvas';

    canvas.width = width;
    canvas.height = height;
    document.body.append(canvas);

    gl = canvas.getContext('webgl2');

    WIDTH = width;
    HEIGHT = height;

    // Event for finding mouse position on click
    canvas.addEventListener("mousemove", function (evt) {
        MOUSE_POS = mousePos(canvas, evt);
        //alert(MOUSE_POS.x + ',' + MOUSE_POS.y);
    }, false);
}

// Get mouse position in the HTML5 Canvas function
function mousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

// Resize canvas to fullscreen
function resizeToFit() {
    gl.canvas.style.width = '100vw';
    gl.canvas.style.height = '100vh';

    // Lookup the size the browser is displaying the canvas.
    const displayWidth = gl.canvas.clientWidth;
    const displayHeight = gl.canvas.clientHeight;

    WIDTH = displayWidth;
    HEIGHT = displayHeight;

    // Check if the canvas is not the same size.
    if (gl.canvas.width != displayWidth ||
        gl.canvas.height != displayHeight) {

        // Make the canvas the same size
        gl.canvas.width = displayWidth;
        gl.canvas.height = displayHeight;
    }
}

// Clear the OpenGL context
function clear(r = 0, g = 0, b = 0, a = 1.0) {
    gl.viewport(0, 0, WIDTH, HEIGHT);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    // CLEAR DEPTH BUFFER BIT so triangles don't overlap
    // CLEAR COLOR BUFFER for background screen
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Mesh {
    constructor(vertices, indicies) {

        // Create VAO & bind the VAO
        this.VAO = gl.createVertexArray();
        gl.bindVertexArray(this.VAO);

        // Bind the EBO and the VBO
        this.bindIndiciesBuffer(indicies);
        this.storeDataInAttributeList(0, 3, vertices);

        // Unbind the VAO
        gl.bindVertexArray(null);

        this.indicieCount = indicies.length;

        this.TEXTURE_ID = -1;
    }

    bindIndiciesBuffer(indicies) {
        const EBO = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indicies), gl.STATIC_DRAW);

        // no need to unbind because it has to be bound when drawing
    }

    addTexture(texture_path, textureCoords) {
        gl.bindVertexArray(this.VAO);
        this.storeDataInAttributeList(1, 2, new Float32Array(textureCoords));
        gl.bindVertexArray(null);

        this.loadTexture(texture_path);
    }

    loadTexture(img) {

        // Create texture
        this.TEXTURE_ID = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.TEXTURE_ID);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, img.width, img.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }

    addNormals(data) {
        gl.bindVertexArray(this.VAO);
        this.storeDataInAttributeList(2, 3, data);
        gl.bindVertexArray(null);
    }

    storeDataInAttributeList(attributeID, size, data) {
        // Create and bind the VBO
        const VBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
        // Send data to the VBO
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(attributeID);
        gl.vertexAttribPointer(attributeID, size, gl.FLOAT, false, 0, 0);

        // Unbind VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    Draw(shader) {
        shader.Bind();

        // bind the VAO
        gl.bindVertexArray(this.VAO);

        // Load texture
        if (this.TEXTURE_ID != -1) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.TEXTURE_ID);
        }

        gl.drawElements(gl.TRIANGLES, this.indicieCount, gl.UNSIGNED_INT, 0);

        // unbind VAO
        gl.bindVertexArray(null);

        shader.Unbind();
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Shader {
    constructor(vertShaderSource, fragShaderSource) {

        // Compile Vertex and Fragment shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertShaderSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.log("Vertex Shader compile error!");
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragShaderSource);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.log("Fragment Shader compile error!");
        }

        // Create the program and link the shaders
        this.programID = gl.createProgram();
        gl.attachShader(this.programID, vertexShader);
        gl.attachShader(this.programID, fragmentShader);
        gl.linkProgram(this.programID);
        if (!gl.getProgramParameter(this.programID, gl.LINK_STATUS)) {
            console.log("Program Link error!");
        }

        this.viewMatrixLocation = null;
        this.projectionMatrixLocation = null;
        this.transformationMatrixLocation = null;

        // Get all uniform locations
        this.getAllUniformLocations();
    }

    /////////////////////////////////////////////

    Bind() {
        gl.useProgram(this.programID);
    }

    Unbind() {
        gl.useProgram(null);
    }

    /////////////////////////////////////////////

    loadTransformationMatrix(matrix) {
        this.loadMatrix(this.transformationMatrixLocation, matrix);
    }

    loadProjectionMatrix(matrix) {
        this.loadMatrix(this.projectionMatrixLocation, matrix);
    }

    loadViewMatrix(matrix) {
        this.loadMatrix(this.viewMatrixLocation, matrix);
    }

    /////////////////////////////////////////////

    loadMatrix(location, matrix) {
        gl.uniformMatrix4fv(location, false, matrix.elements);
    }

    loadFloat(location, value) {
        gl.uniform1f(location, value);
    }

    loadVector(location, vector) {
        gl.uniform3f(location, vector);
    }

    /////////////////////////////////////////////

    getAllUniformLocations() {
        this.transformationMatrixLocation = this.getUniformLocation("transformationMatrix");
        this.projectionMatrixLocation = this.getUniformLocation("projectionMatrix");
        this.viewMatrixLocation = this.getUniformLocation("viewMatrix");
    }

    getUniformLocation(variable) {
        return gl.getUniformLocation(this.programID, variable);
    }

    /////////////////////////////////////////////
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

class GLMath {

    static createTransformationMatrix(position, rotation, scale) {
        let transMatrix = glm.mat4(1.0);
        transMatrix = glm.translate(transMatrix, position);
        transMatrix = glm.rotate(transMatrix, glm.radians(rotation.x), glm.vec3(1, 0, 0));
        transMatrix = glm.rotate(transMatrix, glm.radians(rotation.y), glm.vec3(0, 1, 0));
        transMatrix = glm.rotate(transMatrix, glm.radians(rotation.z), glm.vec3(0, 0, 1));
        transMatrix = glm.scale(transMatrix, scale);

        return transMatrix;
    }

    static createProjectionMatrix(FOV, Aspect, NEAR_PLANE, FAR_PLANE) {
        return glm.perspective(glm.radians(FOV), Aspect, NEAR_PLANE, FAR_PLANE);
    }

    static createViewMatrix(position, rotation) {
        let viewMatrix = glm.mat4(1.0);
        const inversePosition = glm.vec3(-position.x, -position.y, -position.z);
        viewMatrix = glm.rotate(viewMatrix, glm.radians(rotation.x), glm.vec3(1, 0, 0));
        viewMatrix = glm.rotate(viewMatrix, glm.radians(rotation.y), glm.vec3(0, 1, 0));
        viewMatrix = glm.rotate(viewMatrix, glm.radians(rotation.z), glm.vec3(0, 0, 1));
        viewMatrix = glm.translate(viewMatrix, inversePosition);

        return viewMatrix;
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Entity {
    constructor(mesh, position = glm.vec3(0, 0, 0), rotation = glm.vec3(0, 0, 0), scale = glm.vec3(1, 1, 1)) {
        /**@type {Mesh} */
        this.mesh = mesh;
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
    }

    translate(x, y, z) {
        this.position.x += x;
        this.position.y += y;
        this.position.z += z;
    }

    rotate(x, y, z) {
        this.rotation.x += x;
        this.rotation.y += y;
        this.rotation.z += z;
    }

    scale(x, y, z) {
        this.scale.x = x;
        this.scale.y = y;
        this.scale.z = z;
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Renderer {
    /**
     * @param {Shader} shader 
     * @param {number} FOV 
     * @param {number} NEAR_PLANE 
     * @param {number} FAR_PLANE 
     */
    constructor(shader, FOV = 90, NEAR_PLANE = 0.1, FAR_PLANE = 1000) {
        shader.Bind();

        // Create projection matrix
        const projectionMatrix = GLMath.createProjectionMatrix(FOV, gl.canvas.width / gl.canvas.height, NEAR_PLANE, FAR_PLANE);
        shader.loadProjectionMatrix(projectionMatrix);

        shader.Unbind();
    }

    /**
     * 
     * @param {Entity} entity 
     * @param {Shader} shader 
     */
    Draw(entity, shader) {
        const model = entity.mesh;

        // Don't draw faces that the camera can not see
        //gl.enable(gl.CULL_FACE);
        //gl.cullFace(gl.BACK);

        // bind the VAO
        gl.bindVertexArray(model.VAO);

        // Load texture
        if (model.TEXTURE_ID != -1) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, model.TEXTURE_ID);
        }

        // Load transformation matrix
        shader.loadTransformationMatrix(GLMath.createTransformationMatrix(entity.position, entity.rotation, entity.scale));

        gl.drawElements(gl.TRIANGLES, model.indicieCount, gl.UNSIGNED_INT, 0);

        // unbind VAO
        gl.bindVertexArray(null);
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Camera {
    constructor(position, rotation) {
        this.position = position;
        this.rotation = rotation;

        this.speed = 0.16;

        this.last_pos = {
            x: 0,
            y: 0
        };

        document.addEventListener('keydown', e => {
            if (e.key === "w") {
                this.position.z -= this.speed * Math.cos(glm.radians(-this.rotation.y));
                this.position.x -= this.speed * Math.sin(glm.radians(-this.rotation.y));
            } else if (e.key === "s") {
                this.position.z += this.speed * Math.cos(glm.radians(-this.rotation.y));
                this.position.x += this.speed * Math.sin(glm.radians(-this.rotation.y));
            } else if (e.key === "d") {
                this.position.x += this.speed * Math.cos(glm.radians(-this.rotation.y));
                this.position.z -= this.speed * Math.sin(glm.radians(-this.rotation.y));
            } else if (e.key === "a") {
                this.position.x -= this.speed * Math.cos(glm.radians(-this.rotation.y));
                this.position.z += this.speed * Math.sin(glm.radians(-this.rotation.y));
            }

            if (e.key === 'Control') {
                this.position.y -= this.speed;
            } else if (e.key === 'Shift') {
                this.position.y += this.speed;
            }
        });
    }

    UpdateMouse(sensetivity = 1.0) {
        let xOffset = MOUSE_POS.x - this.last_pos.x;
        let yOffset = MOUSE_POS.y - this.last_pos.y;

        xOffset *= sensetivity;
        yOffset *= sensetivity;

        this.rotation.x += yOffset;
        this.rotation.y += xOffset;

        if (this.rotation.x > 90) {
            this.rotation.x = 90;
        }
        if (this.rotation.x < -90) {
            this.rotation.x = -90;
        }

        this.last_pos = MOUSE_POS;
    }

    getViewMatrix() {
        return GLMath.createViewMatrix(this.position, this.rotation);
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Terrain {
    constructor(image = null, SIZE = 800, VERTEX_COUNT = 128) {
        // Generate the terrain
        let vertices = [];
        let indicies = [];
        let textureCoords = [];
        let normals = [];

        for (let i = 0; i < VERTEX_COUNT; i++) {
            for (let j = 0; j < VERTEX_COUNT; j++) {
                vertices.push(j / (VERTEX_COUNT - 1) * SIZE);
                vertices.push(Math.random() * 5);
                vertices.push(i / (VERTEX_COUNT - 1) * SIZE);
                normals.push(0);
                normals.push(1);
                normals.push(0);
                textureCoords.push(j / (VERTEX_COUNT - 1));
                textureCoords.push(i / (VERTEX_COUNT - 1));
            }
        }

        for (let gz = 0; gz < VERTEX_COUNT; gz++) {
            for (let gx = 0; gx < VERTEX_COUNT; gx++) {
                let topLeft = (gz * VERTEX_COUNT) + gx;
                let topRight = topLeft + 1;
                let bottomLeft = ((gz + 1) * VERTEX_COUNT) + gx;
                let bottomRight = bottomLeft + 1;
                indicies.push(topLeft);
                indicies.push(bottomLeft);
                indicies.push(bottomRight);
                indicies.push(bottomRight);
                indicies.push(topRight);
                indicies.push(topLeft);
            }
        }

        this.entity = new Entity(new Mesh(vertices, indicies), glm.vec3(-(SIZE / 2), -10, -(SIZE / 2)));
        if (image != null) this.entity.mesh.addTexture(image, textureCoords);
        this.entity.mesh.addNormals(normals);
    }

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////