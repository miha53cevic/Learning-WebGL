/**@type {Number} */
var WIDTH;

/**@type {Number} */
var HEIGHT;

/**@type {WebGL2RenderingContext} */
var gl;
/**
 * @param {Number} width 
 * @param {Number} height 
 */
function createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.width  = width;
    canvas.height = height;
    document.body.append(canvas);
    
    gl = canvas.getContext('webgl2');

    WIDTH  = width;
    HEIGHT = height;
}

function clear(r = 0, g = 0, b = 0, a = 1.0) {
    gl.viewport(0, 0, WIDTH, HEIGHT);
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

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

class Entity {
    constructor(mesh, position, rotation, scale) {
        this.mesh = mesh;
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
    }
}

class Renderer {
    constructor(shader, FOV = 90, NEAR_PLANE = 0.1, FAR_PLANE = 1000) {
        shader.Bind();
        
        // Create projection matrix

        shader.Unbind();
    }

    Draw(entity, shader) {
        const model = entity.mesh;

        shader.Bind();

        // bind the VAO
        gl.bindVertexArray(model.VAO);

        // Load texture
        if (model.TEXTURE_ID != -1) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, model.TEXTURE_ID);
        }

        // Load transformation matrix
        let transformationMatrix;
        

        gl.drawElements(gl.TRIANGLES, model.indicieCount, gl.UNSIGNED_INT, 0);

        // unbind VAO
        gl.bindVertexArray(null);

        shader.Unbind();
    }
}

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
    }

    Bind() {
        gl.useProgram(this.programID);
    }

    Unbind() {
        gl.useProgram(null);
    }
}