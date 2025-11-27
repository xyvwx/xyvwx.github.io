class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = null;
        
        // 相机参数
        this.radius = 3.0;
        this.theta = 0.0;
        this.phi = Math.PI / 2;
        this.eye = [0, 0, 0];
        this.target = [0, 0, 0];
        this.up = [0, 1, 0];
        
        // 光照参数
        this.lightPosition = [0.0, 0.0, -10.0, 1.0]; // 根据图片修改光源位置
        this.lightAmbient = [0.3, 0.3, 0.3, 1.0];
        this.lightDiffuse = [1.0, 1.0, 1.0, 1.0];
        this.lightSpecular = [1.0, 1.0, 1.0, 1.0];
        
        // 材质参数
        this.materialAmbient = [1.0, 0.42, 0.42, 1.0];
        this.materialDiffuse = [0.31, 0.80, 0.77, 1.0];
        this.materialSpecular = [1.0, 1.0, 1.0, 1.0];
        this.materialShininess = 50.0;
        
        // 背景颜色
        this.clearColor = [0.1, 0.1, 0.1, 1.0];
        
        // 球体数据 - 增加默认细分级别到5
        this.points = [];
        this.normals = [];
        this.subdivisions = 5; // 从3增加到5，让球体更光滑
        this.shadingMode = 6;
        
        // WebGL对象
        this.program = null;
        this.vertexBuffer = null;
        this.normalBuffer = null;
        
        // 键盘状态
        this.keys = {};
        
        // 四面体初始顶点（单位球体）
        this.va = [0.0, 0.0, -1.0, 1.0];
        this.vb = [0.0, 0.942809, 0.333333, 1.0];
        this.vc = [-0.816497, -0.471405, 0.333333, 1.0];
        this.vd = [0.816497, -0.471405, 0.333333, 1.0];
    }
    
    init() {
        // 初始化WebGL上下文
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            alert('无法初始化WebGL。您的浏览器可能不支持。');
            return false;
        }
        
        // 设置WebGL基本参数
        this.setClearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        this.gl.enable(this.gl.DEPTH_TEST);
        
        // 初始化着色器
        if (!this.initShaders()) {
            return false;
        }
        
        // 初始化球体
        this.initSphere();
        
        // 初始化缓冲区
        this.initBuffers();
        
        return true;
    }
    
    setClearColor(r, g, b, a) {
        this.clearColor = [r, g, b, a];
        if (this.gl) {
            this.gl.clearColor(r, g, b, a);
        }
    }
    
    initShaders() {
        // 顶点着色器
        const vertSource = `
            attribute vec4 vPosition;
            attribute vec4 vNormal;
            
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;
            uniform vec4 lightPosition;
            
            varying vec3 normalInterp;
            varying vec4 vertexPos;
            
            void main() {
                vertexPos = modelViewMatrix * vPosition;
                normalInterp = normalize(normalMatrix * vNormal.xyz);
                gl_Position = projectionMatrix * vertexPos;
            }
        `;
        
        // 片段着色器
        const fragSource = `
            precision mediump float;
            
            varying vec3 normalInterp;
            varying vec4 vertexPos;
            
            uniform vec4 lightPosition;
            uniform float shininess;
            uniform vec4 ambientProduct;
            uniform vec4 diffuseProduct;
            uniform vec4 specularProduct;
            
            void main() {
                vec3 N = normalize(normalInterp);
                vec3 L;
                
                if (lightPosition.w == 0.0) {
                    L = normalize(lightPosition.xyz);
                } else {
                    L = normalize(lightPosition.xyz - vertexPos.xyz);
                }
                
                vec4 ambient = ambientProduct;
                
                float Kd = max(dot(L, N), 0.0);
                vec4 diffuse = Kd * diffuseProduct;
                
                float Ks = 0.0;
                if (Kd > 0.0) {
                    vec3 R = reflect(-L, N);
                    vec3 V = normalize(-vertexPos.xyz);
                    float specularAngle = max(dot(R, V), 0.0);
                    Ks = pow(specularAngle, shininess);
                }
                vec4 specular = Ks * specularProduct;
                
                gl_FragColor = ambient + diffuse + specular;
                gl_FragColor.a = 1.0;
            }
        `;
        
        // 编译着色器
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragSource);
        
        if (!vertexShader || !fragmentShader) {
            return false;
        }
        
        // 创建着色器程序
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            alert('无法初始化着色器程序: ' + this.gl.getProgramInfoLog(this.program));
            return false;
        }
        
        this.gl.useProgram(this.program);
        
        return true;
    }
    
    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            alert('着色器编译错误: ' + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    initSphere() {
        this.points = [];
        this.normals = [];
        this.divideTetra(this.va, this.vb, this.vc, this.vd, this.subdivisions);
        console.log(`球体生成完成，细分级别: ${this.subdivisions}, 顶点数量: ${this.points.length / 4}`);
    }
    
    divideTetra(a, b, c, d, count) {
        this.divideTriangle(a, b, c, count);
        this.divideTriangle(a, c, d, count);
        this.divideTriangle(a, d, b, count);
        this.divideTriangle(b, d, c, count);
    }
    
    divideTriangle(a, b, c, count) {
        if (count > 0) {
            // 计算中点并归一化到球面
            const ab = this.normalize(this.midpoint(a, b));
            const ac = this.normalize(this.midpoint(a, c));
            const bc = this.normalize(this.midpoint(b, c));
            
            // 递归细分四个小三角形
            this.divideTriangle(a, ab, ac, count - 1);
            this.divideTriangle(ab, b, bc, count - 1);
            this.divideTriangle(ac, bc, c, count - 1);
            this.divideTriangle(ab, bc, ac, count - 1);
        } else {
            this.triangle(a, b, c);
        }
    }
    
    triangle(a, b, c) {
        // 添加顶点
        this.points.push(a[0], a[1], a[2], a[3]);
        this.points.push(b[0], b[1], b[2], b[3]);
        this.points.push(c[0], c[1], c[2], c[3]);
        
        // 计算面法线
        const normal = this.calculateNormal(a, b, c);
        
        // 为每个顶点添加相同的法线
        this.normals.push(normal[0], normal[1], normal[2], 0.0);
        this.normals.push(normal[0], normal[1], normal[2], 0.0);
        this.normals.push(normal[0], normal[1], normal[2], 0.0);
    }
    
    midpoint(a, b) {
        return [
            (a[0] + b[0]) * 0.5,
            (a[1] + b[1]) * 0.5,
            (a[2] + b[2]) * 0.5,
            1.0
        ];
    }
    
    normalize(v) {
        const length = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        return [
            v[0] / length,
            v[1] / length,
            v[2] / length,
            1.0
        ];
    }
    
    calculateNormal(a, b, c) {
        const u = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
        const v = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
        
        const normal = [
            u[1]*v[2] - u[2]*v[1],
            u[2]*v[0] - u[0]*v[2],
            u[0]*v[1] - u[1]*v[0]
        ];
        
        const length = Math.sqrt(normal[0]*normal[0] + normal[1]*normal[1] + normal[2]*normal[2]);
        return [
            normal[0] / length,
            normal[1] / length,
            normal[2] / length
        ];
    }
    
    initBuffers() {
        // 顶点缓冲区
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.points), this.gl.STATIC_DRAW);
        
        // 法线缓冲区
        this.normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STATIC_DRAW);
    }
    
    display() {
        if (!this.gl) return;
        
        // 清除画布
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        // 使用着色器程序
        this.gl.useProgram(this.program);
        
        // 更新相机位置
        this.updateCamera();
        
        // 创建矩阵
        const modelViewMatrix = mat4.create();
        const projectionMatrix = mat4.create();
        const normalMatrix = mat3.create();
        
        // 设置视图矩阵
        mat4.lookAt(modelViewMatrix, this.eye, this.target, this.up);
        
        // 设置投影矩阵
        mat4.perspective(projectionMatrix, Math.PI/4, this.canvas.width/this.canvas.height, 0.1, 100.0);
        
        // 计算法线矩阵
        mat3.normalFromMat4(normalMatrix, modelViewMatrix);
        
        // 获取uniform位置
        const modelViewMatrixLoc = this.gl.getUniformLocation(this.program, 'modelViewMatrix');
        const projectionMatrixLoc = this.gl.getUniformLocation(this.program, 'projectionMatrix');
        const normalMatrixLoc = this.gl.getUniformLocation(this.program, 'normalMatrix');
        const lightPositionLoc = this.gl.getUniformLocation(this.program, 'lightPosition');
        const shininessLoc = this.gl.getUniformLocation(this.program, 'shininess');
        
        // 计算光照乘积
        const ambientProduct = vec4.create();
        const diffuseProduct = vec4.create();
        const specularProduct = vec4.create();
        
        vec4.multiply(ambientProduct, this.lightAmbient, this.materialAmbient);
        vec4.multiply(diffuseProduct, this.lightDiffuse, this.materialDiffuse);
        vec4.multiply(specularProduct, this.lightSpecular, this.materialSpecular);
        
        const ambientProductLoc = this.gl.getUniformLocation(this.program, 'ambientProduct');
        const diffuseProductLoc = this.gl.getUniformLocation(this.program, 'diffuseProduct');
        const specularProductLoc = this.gl.getUniformLocation(this.program, 'specularProduct');
        
        // 设置uniform变量
        this.gl.uniformMatrix4fv(modelViewMatrixLoc, false, modelViewMatrix);
        this.gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix);
        this.gl.uniformMatrix3fv(normalMatrixLoc, false, normalMatrix);
        this.gl.uniform4fv(lightPositionLoc, this.lightPosition);
        this.gl.uniform1f(shininessLoc, this.materialShininess);
        this.gl.uniform4fv(ambientProductLoc, ambientProduct);
        this.gl.uniform4fv(diffuseProductLoc, diffuseProduct);
        this.gl.uniform4fv(specularProductLoc, specularProduct);
        
        // 设置顶点属性
        const vPositionLoc = this.gl.getAttribLocation(this.program, 'vPosition');
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(vPositionLoc, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vPositionLoc);
        
        const vNormalLoc = this.gl.getAttribLocation(this.program, 'vNormal');
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.vertexAttribPointer(vNormalLoc, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vNormalLoc);
        
        // 绘制球体
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.points.length / 4);
    }
    
    updateCamera() {
        this.eye[0] = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        this.eye[1] = this.radius * Math.cos(this.phi);
        this.eye[2] = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    }
    
    handleKeyDown(event) {
        const key = event.key.toLowerCase();
        this.keys[key] = true;
        
        const angleStep = 0.05;
        const radiusStep = 0.1;
        
        if (key === 'a') this.theta -= angleStep;
        if (key === 'd') this.theta += angleStep;
        if (key === 'w') this.phi = Math.max(0.1, this.phi - angleStep);
        if (key === 's') this.phi = Math.min(Math.PI - 0.1, this.phi + angleStep);
        if (key === 'z') this.radius = Math.max(0.5, this.radius - radiusStep);
        if (key === 'x') this.radius += radiusStep;
        
        if (key === 'v') {
            this.subdivisions = Math.min(6, this.subdivisions + 1);
            this.initSphere();
            this.initBuffers();
            console.log(`细分级别增加到: ${this.subdivisions}`);
        }
        
        if (key === 'b') {
            this.subdivisions = Math.max(0, this.subdivisions - 1);
            this.initSphere();
            this.initBuffers();
            console.log(`细分级别减少到: ${this.subdivisions}`);
        }
        
        if (key === 'r') {
            this.resetView();
        }
    }
    
    handleKeyUp(event) {
        this.keys[event.key.toLowerCase()] = false;
    }
    
    resetView() {
        this.radius = 3.0;
        this.theta = 0.0;
        this.phi = Math.PI / 2;
    }
    
    setShadingMode(mode) {
        this.shadingMode = mode;
        console.log('切换到着色模式:', mode);
    }
    
    setSubdivisions(level) {
        this.subdivisions = level;
        this.initSphere();
        this.initBuffers();
        console.log(`设置细分级别为: ${level}`);
    }
}