// 获取WebGL上下文
const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('您的浏览器不支持WebGL');
}

// 调整canvas大小
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 顶点着色器
const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    varying lowp vec4 vColor;
    
    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;
    }
`;

// 片段着色器
const fsSource = `
    varying lowp vec4 vColor;
    
    void main(void) {
        gl_FragColor = vColor;
    }
`;

// 初始化着色器程序
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('无法初始化着色器程序: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

// 创建着色器
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('编译着色器时出错: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// 初始化着色器程序
const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
const programInfo = {
    program: shaderProgram,
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
};

// 矩阵运算函数
const mat4 = {
    create: function() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    },
    
    perspective: function(out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);
        
        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        
        out[8] = 0;
        out[9] = 0;
        out[10] = (far + near) * nf;
        out[11] = -1;
        
        out[12] = 0;
        out[13] = 0;
        out[14] = (2 * far * near) * nf;
        out[15] = 0;
        
        return out;
    },
    
    translate: function(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        
        out[4] = a[4];
        out[5] = a[5];
        out[6] = a[6];
        out[7] = a[7];
        
        out[8] = a[8];
        out[9] = a[9];
        out[10] = a[10];
        out[11] = a[11];
        
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        
        return out;
    },
    
    rotate: function(out, a, rad, axis) {
        let x = axis[0], y = axis[1], z = axis[2];
        let len = Math.sqrt(x * x + y * y + z * z);
        
        if (len < 0.000001) { return null; }
        
        len = 1 / len;
        x *= len;
        y *= len;
        z *= len;
        
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const t = 1 - c;
        
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        
        const b00 = x * x * t + c, b01 = y * x * t + z * s, b02 = z * x * t - y * s;
        const b10 = x * y * t - z * s, b11 = y * y * t + c, b12 = z * y * t + x * s;
        const b20 = x * z * t + y * s, b21 = y * z * t - x * s, b22 = z * z * t + c;
        
        out[0] = a00 * b00 + a10 * b01 + a20 * b02;
        out[1] = a01 * b00 + a11 * b01 + a21 * b02;
        out[2] = a02 * b00 + a12 * b01 + a22 * b02;
        out[3] = a03 * b00 + a13 * b01 + a23 * b02;
        
        out[4] = a00 * b10 + a10 * b11 + a20 * b12;
        out[5] = a01 * b10 + a11 * b11 + a21 * b12;
        out[6] = a02 * b10 + a12 * b11 + a22 * b12;
        out[7] = a03 * b10 + a13 * b11 + a23 * b12;
        
        out[8] = a00 * b20 + a10 * b21 + a20 * b22;
        out[9] = a01 * b20 + a11 * b21 + a21 * b22;
        out[10] = a02 * b20 + a12 * b21 + a22 * b22;
        out[11] = a03 * b20 + a13 * b21 + a23 * b22;
        
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        
        return out;
    },
    
    copy: function(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        out[6] = a[6];
        out[7] = a[7];
        out[8] = a[8];
        out[9] = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    }
};

// 创建球体
function createSphere(radius, slices, stacks, color) {
    const vertices = [];
    const colors = [];
    const indices = [];
    
    for (let i = 0; i <= stacks; i++) {
        const phi = Math.PI * i / stacks;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        
        for (let j = 0; j <= slices; j++) {
            const theta = 2 * Math.PI * j / slices;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            const x = cosTheta * sinPhi;
            const y = cosPhi;
            const z = sinTheta * sinPhi;
            
            vertices.push(radius * x, radius * y, radius * z);
            
            // 使用固定颜色
            colors.push(color[0], color[1], color[2], color[3]);
        }
    }
    
    for (let i = 0; i < stacks; i++) {
        for (let j = 0; j < slices; j++) {
            const first = i * (slices + 1) + j;
            const second = first + slices + 1;
            
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }
    
    return {
        vertices: new Float32Array(vertices),
        colors: new Float32Array(colors),
        indices: new Uint16Array(indices),
    };
}

// 创建轨道
function createOrbit(radius, segments) {
    const vertices = [];
    const colors = [];
    
    for (let i = 0; i <= segments; i++) {
        const theta = 2 * Math.PI * i / segments;
        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);
        
        vertices.push(x, 0, z);
        colors.push(0.5, 0.5, 0.8, 0.3); // 半透明的蓝色
    }
    
    return {
        vertices: new Float32Array(vertices),
        colors: new Float32Array(colors),
    };
}

// 初始化缓冲区
function initBuffers(gl) {
    // 创建太阳
    const sun = createSphere(1.0, 32, 16, [1.0, 0.8, 0.0, 1.0]);
    
    // 创建行星 - 优化速度设置
    const planets = [
        { 
            name: '水星', radius: 0.2, orbitRadius: 3.0, 
            color: [0.7, 0.7, 0.7, 1.0], 
            orbitSpeed: 0.08, rotationSpeed: 0.04,
            orbitAngle: 0, rotationAngle: 0
        },
        { 
            name: '金星', radius: 0.3, orbitRadius: 5.0, 
            color: [0.9, 0.7, 0.2, 1.0], 
            orbitSpeed: 0.03, rotationSpeed: 0.02,
            orbitAngle: 0, rotationAngle: 0
        },
        { 
            name: '地球', radius: 0.3, orbitRadius: 7.0, 
            color: [0.2, 0.4, 0.9, 1.0], 
            orbitSpeed: 0.02, rotationSpeed: 0.1,
            orbitAngle: 0, rotationAngle: 0
        },
        { 
            name: '火星', radius: 0.25, orbitRadius: 9.0, 
            color: [0.9, 0.3, 0.2, 1.0], 
            orbitSpeed: 0.016, rotationSpeed: 0.06,
            orbitAngle: 0, rotationAngle: 0
        },
        { 
            name: '木星', radius: 0.6, orbitRadius: 12.0, 
            color: [0.8, 0.6, 0.4, 1.0], 
            orbitSpeed: 0.01, rotationSpeed: 0.16,
            orbitAngle: 0, rotationAngle: 0
        },
        { 
            name: '土星', radius: 0.5, orbitRadius: 15.0, 
            color: [0.9, 0.8, 0.5, 1.0], 
            orbitSpeed: 0.006, rotationSpeed: 0.14,
            orbitAngle: 0, rotationAngle: 0
        },
        { 
            name: '天王星', radius: 0.4, orbitRadius: 18.0, 
            color: [0.6, 0.8, 0.9, 1.0], 
            orbitSpeed: 0.004, rotationSpeed: 0.08,
            orbitAngle: 0, rotationAngle: 0
        },
        { 
            name: '海王星', radius: 0.4, orbitRadius: 21.0, 
            color: [0.2, 0.4, 0.8, 1.0], 
            orbitSpeed: 0.002, rotationSpeed: 0.08,
            orbitAngle: 0, rotationAngle: 0
        }
    ];
    
    // 创建月球
    const moon = { 
        name: '月球', radius: 0.1, orbitRadius: 1.5, 
        color: [0.8, 0.8, 0.8, 1.0], 
        orbitSpeed: 0.1, rotationSpeed: 0.02,
        orbitAngle: 0, rotationAngle: 0
    };
    
    // 创建轨道
    const orbits = [];
    planets.forEach(planet => {
        orbits.push(createOrbit(planet.orbitRadius, 64));
    });
    orbits.push(createOrbit(moon.orbitRadius, 32)); // 月球轨道
    
    return {
        sun: {
            vertices: sun.vertices,
            colors: sun.colors,
            indices: sun.indices,
            vertexCount: sun.indices.length,
            rotationSpeed: 0.02,
            rotationAngle: 0
        },
        planets: planets.map(planet => {
            const sphere = createSphere(planet.radius, 24, 12, planet.color);
            return {
                ...planet,
                vertices: sphere.vertices,
                colors: sphere.colors,
                indices: sphere.indices,
                vertexCount: sphere.indices.length,
            };
        }),
        moon: {
            ...moon,
            vertices: createSphere(moon.radius, 16, 8, moon.color).vertices,
            colors: createSphere(moon.radius, 16, 8, moon.color).colors,
            indices: createSphere(moon.radius, 16, 8, moon.color).indices,
            vertexCount: createSphere(moon.radius, 16, 8, moon.color).indices.length,
        },
        orbits: orbits.map(orbit => ({
            vertices: orbit.vertices,
            colors: orbit.colors,
            vertexCount: orbit.vertices.length / 3,
        })),
    };
}

// 初始化缓冲区
const buffers = initBuffers(gl);

// 设置视角控制
let cameraRotationX = 0;
let cameraRotationY = 0;
let cameraDistance = 30;
let isDragging = false;
let lastMouseX, lastMouseY;

// 鼠标事件处理
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    e.preventDefault();
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    
    cameraRotationY += deltaX * 0.01;
    cameraRotationX += deltaY * 0.01;
    
    // 限制X轴旋转角度
    cameraRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraRotationX));
    
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    e.preventDefault();
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
    cameraDistance += e.deltaY * 0.1;
    cameraDistance = Math.max(10, Math.min(100, cameraDistance));
    e.preventDefault();
});

// 控制变量
let isPaused = false;
let showOrbits = true;
let showLabels = false; // 默认关闭标签，减少绘制调用
let simulationSpeed = 1.0;
let planetSizeScale = 1.0;
let time = 0;

// FPS计数器
let frameCount = 0;
let lastFpsUpdate = 0;
let fps = 60;
const fpsCounter = document.getElementById('fps-counter');

// 控制按钮事件
document.getElementById('pause-btn').addEventListener('click', () => {
    isPaused = !isPaused;
});

document.getElementById('reset-btn').addEventListener('click', () => {
    cameraRotationX = 0;
    cameraRotationY = 0;
    cameraDistance = 30;
});

document.getElementById('toggle-orbits-btn').addEventListener('click', () => {
    showOrbits = !showOrbits;
});

document.getElementById('toggle-labels-btn').addEventListener('click', () => {
    showLabels = !showLabels;
});

// 速度控制
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
speedSlider.addEventListener('input', (e) => {
    simulationSpeed = e.target.value / 100;
    speedValue.textContent = e.target.value + '%';
});

// 大小控制
const sizeSlider = document.getElementById('size-slider');
const sizeValue = document.getElementById('size-value');
sizeSlider.addEventListener('input', (e) => {
    planetSizeScale = e.target.value / 100;
    sizeValue.textContent = e.target.value + '%';
});

// 预创建缓冲区对象，避免重复创建
const bufferCache = {
    position: gl.createBuffer(),
    color: gl.createBuffer(),
    index: gl.createBuffer()
};

// 绘制场景
function drawScene(gl, programInfo, buffers, deltaTime) {
    if (!isPaused) {
        time += deltaTime * simulationSpeed;
        
        // 更新太阳自转
        buffers.sun.rotationAngle += buffers.sun.rotationSpeed * deltaTime * simulationSpeed;
        
        // 更新行星位置和自转
        buffers.planets.forEach(planet => {
            planet.orbitAngle += planet.orbitSpeed * deltaTime * simulationSpeed;
            planet.rotationAngle += planet.rotationSpeed * deltaTime * simulationSpeed;
        });
        
        // 更新月球位置和自转
        buffers.moon.orbitAngle += buffers.moon.orbitSpeed * deltaTime * simulationSpeed;
        buffers.moon.rotationAngle += buffers.moon.rotationSpeed * deltaTime * simulationSpeed;
    }
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 创建透视投影矩阵
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 1000.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // 创建视图矩阵
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -cameraDistance]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, cameraRotationX, [1, 0, 0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, cameraRotationY, [0, 1, 0]);

    // 绘制太阳（带自转）
    drawSphere(gl, programInfo, buffers.sun, [0, 0, 0], modelViewMatrix, projectionMatrix, 
              buffers.sun.rotationAngle, [0, 1, 0], planetSizeScale);

    // 绘制行星
    buffers.planets.forEach((planet, index) => {
        // 计算行星位置
        const x = planet.orbitRadius * Math.cos(planet.orbitAngle);
        const z = planet.orbitRadius * Math.sin(planet.orbitAngle);
        
        // 绘制轨道
        if (showOrbits) {
            drawOrbit(gl, programInfo, buffers.orbits[index], modelViewMatrix, projectionMatrix);
        }
        
        // 绘制行星（带自转）
        drawSphere(gl, programInfo, planet, [x, 0, z], modelViewMatrix, projectionMatrix, 
                  planet.rotationAngle, [0, 1, 0], planetSizeScale);
        
        // 如果是地球，绘制月球
        if (planet.name === '地球') {
            const moonX = x + buffers.moon.orbitRadius * Math.cos(buffers.moon.orbitAngle);
            const moonZ = z + buffers.moon.orbitRadius * Math.sin(buffers.moon.orbitAngle);
            
            // 绘制月球轨道
            if (showOrbits) {
                const moonOrbitMatrix = mat4.create();
                mat4.copy(moonOrbitMatrix, modelViewMatrix);
                mat4.translate(moonOrbitMatrix, moonOrbitMatrix, [x, 0, z]);
                drawOrbit(gl, programInfo, buffers.orbits[buffers.orbits.length - 1], moonOrbitMatrix, projectionMatrix);
            }
            
            // 绘制月球（带自转）
            drawSphere(gl, programInfo, buffers.moon, [moonX, 0, moonZ], modelViewMatrix, projectionMatrix, 
                      buffers.moon.rotationAngle, [0, 1, 0], planetSizeScale);
        }
    });

    // 更新FPS显示
    frameCount++;
    if (time - lastFpsUpdate >= 0.5) { // 每0.5秒更新一次
        fps = Math.round(frameCount / (time - lastFpsUpdate));
        frameCount = 0;
        lastFpsUpdate = time;
        fpsCounter.textContent = `FPS: ${fps}`;
    }
}

// 绘制球体（优化版本）
function drawSphere(gl, programInfo, sphere, position, modelViewMatrix, projectionMatrix, rotationAngle, rotationAxis, scale) {
    // 设置变换矩阵
    const sphereModelViewMatrix = mat4.create();
    mat4.copy(sphereModelViewMatrix, modelViewMatrix);
    mat4.translate(sphereModelViewMatrix, sphereModelViewMatrix, position);
    mat4.rotate(sphereModelViewMatrix, sphereModelViewMatrix, rotationAngle, rotationAxis);
    
    // 设置着色器程序
    gl.useProgram(programInfo.program);
    
    // 设置顶点位置（应用缩放）
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCache.position);
    const scaledVertices = new Float32Array(sphere.vertices.length);
    for (let i = 0; i < sphere.vertices.length; i += 3) {
        scaledVertices[i] = sphere.vertices[i] * scale;
        scaledVertices[i + 1] = sphere.vertices[i + 1] * scale;
        scaledVertices[i + 2] = sphere.vertices[i + 2] * scale;
    }
    gl.bufferData(gl.ARRAY_BUFFER, scaledVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    
    // 设置顶点颜色
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCache.color);
    gl.bufferData(gl.ARRAY_BUFFER, sphere.colors, gl.STATIC_DRAW);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    
    // 设置索引
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferCache.index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);
    
    // 设置uniform
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        sphereModelViewMatrix);
    
    // 绘制
    gl.drawElements(gl.TRIANGLES, sphere.vertexCount, gl.UNSIGNED_SHORT, 0);
}

// 绘制轨道
function drawOrbit(gl, programInfo, orbit, modelViewMatrix, projectionMatrix) {
    // 设置着色器程序
    gl.useProgram(programInfo.program);
    
    // 设置顶点位置
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCache.position);
    gl.bufferData(gl.ARRAY_BUFFER, orbit.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    
    // 设置顶点颜色
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCache.color);
    gl.bufferData(gl.ARRAY_BUFFER, orbit.colors, gl.STATIC_DRAW);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    
    // 设置uniform
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);
    
    // 绘制线条
    gl.drawArrays(gl.LINE_LOOP, 0, orbit.vertexCount);
}

// 动画循环（优化版本）
let then = performance.now() / 1000;
function render(now) {
    now /= 1000; // 转换为秒
    const deltaTime = Math.min(0.1, now - then); // 限制最大deltaTime
    then = now;
    
    drawScene(gl, programInfo, buffers, deltaTime);
    requestAnimationFrame(render);
}
requestAnimationFrame(render);