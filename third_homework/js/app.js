// 全局变量
let canvas, gl;
let program;
let vBuffer, cBuffer;
let transformMatrixLoc;

// 变换参数
let transformParams = {
    translateX: 0,
    translateY: 0,
    rotateAngle: 0,
    scaleX: 1,
    scaleY: 1
};

// 复合图形的顶点数据
const vertices = [
    // 正方形部分 (2个三角形组成)
    -0.3, -0.3, 0.0,
    0.3, -0.3, 0.0,
    0.3, 0.3, 0.0,
    
    -0.3, -0.3, 0.0,
    0.3, 0.3, 0.0,
    -0.3, 0.3, 0.0,
    
    // 三角形部分
    -0.2, 0.3, 0.0,
    0.2, 0.3, 0.0,
    0.0, 0.7, 0.0
];

// 顶点颜色数据
const colors = [
    // 正方形颜色 (蓝色)
    0.2, 0.4, 0.8, 1.0,
    0.2, 0.4, 0.8, 1.0,
    0.2, 0.4, 0.8, 1.0,
    0.2, 0.4, 0.8, 1.0,
    0.2, 0.4, 0.8, 1.0,
    0.2, 0.4, 0.8, 1.0,
    
    // 三角形颜色 (红色)
    0.8, 0.2, 0.2, 1.0,
    0.8, 0.2, 0.2, 1.0,
    0.8, 0.2, 0.2, 1.0
];

// 初始化WebGL
function initWebGL() {
    canvas = document.getElementById('gl-canvas');
    
    // 尝试获取WebGL上下文，优先使用WebGL 1.0
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
        alert('您的浏览器不支持WebGL');
        return;
    }
    
    // 设置视口和清除颜色
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.95, 0.95, 0.95, 1.0);
    
    // 初始化着色器程序
    program = initShaders();
    if (!program) {
        return;
    }
    gl.useProgram(program);
    
    // 初始化缓冲区
    initBuffers();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 开始渲染循环
    render();
}

// 初始化着色器程序
function initShaders() {
    // 获取着色器源码
    const vsSource = document.getElementById('vertex-shader').text;
    const fsSource = document.getElementById('fragment-shader').text;
    
    // 编译着色器
    const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);
    
    if (!vertexShader || !fragmentShader) {
        return null;
    }
    
    // 创建着色器程序
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

// 编译着色器
function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const shaderType = type === gl.VERTEX_SHADER ? '顶点' : '片段';
        alert(shaderType + '着色器编译错误: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    
    return shader;
}

// 初始化缓冲区
function initBuffers() {
    // 创建和绑定顶点缓冲区
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    const vPosition = gl.getAttribLocation(program, 'vPosition');
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    // 创建和绑定颜色缓冲区
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    const vColor = gl.getAttribLocation(program, 'vColor');
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    
    // 获取变换矩阵uniform的位置
    transformMatrixLoc = gl.getUniformLocation(program, 'transformMatrix');
}

// 设置事件监听器
function setupEventListeners() {
    // 平移变换事件
    document.getElementById('translateX').addEventListener('input', function(e) {
        transformParams.translateX = parseFloat(e.target.value);
        document.getElementById('translateXValue').textContent = transformParams.translateX.toFixed(2);
    });
    
    document.getElementById('translateY').addEventListener('input', function(e) {
        transformParams.translateY = parseFloat(e.target.value);
        document.getElementById('translateYValue').textContent = transformParams.translateY.toFixed(2);
    });
    
    // 旋转变换事件
    document.getElementById('rotateAngle').addEventListener('input', function(e) {
        transformParams.rotateAngle = parseFloat(e.target.value);
        document.getElementById('rotateAngleValue').textContent = transformParams.rotateAngle + '°';
    });
    
    // 缩放变换事件
    document.getElementById('scaleX').addEventListener('input', function(e) {
        transformParams.scaleX = parseFloat(e.target.value);
        document.getElementById('scaleXValue').textContent = transformParams.scaleX.toFixed(1);
    });
    
    document.getElementById('scaleY').addEventListener('input', function(e) {
        transformParams.scaleY = parseFloat(e.target.value);
        document.getElementById('scaleYValue').textContent = transformParams.scaleY.toFixed(1);
    });
    
    // 重置按钮事件
    document.getElementById('resetButton').addEventListener('click', function() {
        resetTransform();
    });
}

// 重置变换参数
function resetTransform() {
    transformParams = {
        translateX: 0,
        translateY: 0,
        rotateAngle: 0,
        scaleX: 1,
        scaleY: 1
    };
    
    // 更新UI控件
    document.getElementById('translateX').value = 0;
    document.getElementById('translateY').value = 0;
    document.getElementById('rotateAngle').value = 0;
    document.getElementById('scaleX').value = 1;
    document.getElementById('scaleY').value = 1;
    
    document.getElementById('translateXValue').textContent = '0.00';
    document.getElementById('translateYValue').textContent = '0.00';
    document.getElementById('rotateAngleValue').textContent = '0°';
    document.getElementById('scaleXValue').textContent = '1.0';
    document.getElementById('scaleYValue').textContent = '1.0';
}

// 创建变换矩阵
function createTransformMatrix() {
    // 创建单位矩阵
    let matrix = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
    
    // 应用平移变换
    matrix[12] = transformParams.translateX;
    matrix[13] = transformParams.translateY;
    
    // 应用旋转变换
    const angle = transformParams.rotateAngle * Math.PI / 180;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    
    const rotationMatrix = [
        cosA, -sinA, 0, 0,
        sinA, cosA, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
    
    // 矩阵乘法: 旋转 * 平移
    matrix = multiplyMatrices(rotationMatrix, matrix);
    
    // 应用缩放变换
    matrix[0] *= transformParams.scaleX;
    matrix[5] *= transformParams.scaleY;
    
    return matrix;
}

// 矩阵乘法函数
function multiplyMatrices(a, b) {
    const result = [];
    
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            let sum = 0;
            for (let k = 0; k < 4; k++) {
                sum += a[i * 4 + k] * b[k * 4 + j];
            }
            result[i * 4 + j] = sum;
        }
    }
    
    return result;
}

// 渲染函数
function render() {
    // 清除画布
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // 创建变换矩阵
    const transformMatrix = createTransformMatrix();
    
    // 传递变换矩阵到着色器
    gl.uniformMatrix4fv(transformMatrixLoc, false, new Float32Array(transformMatrix));
    
    // 绘制图形
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
    
    // 请求下一帧
    requestAnimationFrame(render);
}

// 页面加载完成后初始化WebGL
window.onload = initWebGL;