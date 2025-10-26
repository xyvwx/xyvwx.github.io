// 主应用程序代码
const { vec3 } = glMatrix;

let canvas;
let gl;
let currentPattern = "gasket2d";

// 图案描述文本
const patternDescriptions = {
    gasket2d: "2D Sierpinski Gasket是一种分形图案，通过对三角形不断细分和移除中心部分而形成。",
    gasket3d: "3D Sierpinski Gasket是2D Sierpinski Gasket的三维扩展，通过对四面体不断细分而形成。",
    "advanced-tessellation": "高级三角形细分提供更多旋转选项，包括基于距离的旋转，可以创建更加复杂的几何图案。"
};

// 初始化函数
window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    
    gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL 2.0 不支持");
        return;
    }
    
    // 设置事件监听器
    document.getElementById("pattern-select").addEventListener("change", function() {
        currentPattern = this.value;
        updateControlVisibility();
        updatePatternDescription();
    });
    
    document.getElementById("draw-button").addEventListener("click", function() {
        drawPattern();
    });
    
    // 初始绘制
    updateControlVisibility();
    updatePatternDescription();
    drawPattern();
};

// 更新控制面板可见性
function updateControlVisibility() {
    // 隐藏所有控制组
    document.getElementById("gasket2d-controls").classList.add("hidden");
    document.getElementById("gasket3d-controls").classList.add("hidden");
    document.getElementById("advanced-tessellation-controls").classList.add("hidden");
    
    // 显示当前图案的控制组
    document.getElementById(`${currentPattern}-controls`).classList.remove("hidden");
}

// 更新图案描述
function updatePatternDescription() {
    document.getElementById("pattern-description-text").textContent = 
        patternDescriptions[currentPattern];
}

// 绘制图案
function drawPattern() {
    const subdivisionLevel = parseInt(document.getElementById("subdivision-level").value);
    
    switch(currentPattern) {
        case "gasket2d":
            drawGasket2D(subdivisionLevel);
            break;
        case "gasket3d":
            drawGasket3D(subdivisionLevel);
            break;
        case "advanced-tessellation":
            const rotationAngleAdvanced = parseInt(document.getElementById("rotation-angle-advanced").value);
            const rotationType = document.getElementById("rotation-type").value;
            const colorAdvanced = document.getElementById("color-picker-advanced").value;
            drawAdvancedTessellation(subdivisionLevel, rotationAngleAdvanced, rotationType, colorAdvanced);
            break;
    }
}

// 2D谢尔宾斯基三角形
function drawGasket2D(numTimesToSubdivide) {
    let points = [];
    
    // 初始化三角形的三个顶点
    const vertices = [
        -1, -1,  0,
        0,  1,  0,
        1, -1,  0
    ];

    const u = vec3.fromValues(vertices[0], vertices[1], vertices[2]);
    const v = vec3.fromValues(vertices[3], vertices[4], vertices[5]);
    const w = vec3.fromValues(vertices[6], vertices[7], vertices[8]);

    divideTriangle(u, v, w, numTimesToSubdivide);

    // 配置webgl
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // 加载着色器并初始化属性缓冲区
    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // 将数据加载到GPU
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    // 关联着色器变量与数据缓冲区
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // 设置颜色
    const uColorLocation = gl.getUniformLocation(program, "uColor");
    gl.uniform4f(uColorLocation, 1.0, 0.0, 0.0, 1.0);

    renderTriangles();

    function triangle(a, b, c) {
        points.push(a[0], a[1], a[2]);
        points.push(b[0], b[1], b[2]);
        points.push(c[0], c[1], c[2]);
    }

    function divideTriangle(a, b, c, count) {
        if (count === 0) {
            triangle(a, b, c);
        } else {
            const ab = vec3.create();
            vec3.lerp(ab, a, b, 0.5);
            const bc = vec3.create();
            vec3.lerp(bc, b, c, 0.5);
            const ca = vec3.create();
            vec3.lerp(ca, c, a, 0.5);

            divideTriangle(a, ab, ca, count - 1);
            divideTriangle(b, bc, ab, count - 1);
            divideTriangle(c, ca, bc, count - 1);
        }
    }

    function renderTriangles() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, points.length / 3);
    }
}

// 3D谢尔宾斯基四面体
function drawGasket3D(numTimesToSubdivide) {
    let points = [];
    let colors = [];
    
    // 初始化四面体的顶点
    const vertices = [
        0.0000, 0.0000, -1.0000,
        0.0000, 0.9428, 0.3333,
        -0.8165, -0.4714, 0.3333,
        0.8165, -0.4714, 0.3333
    ];

    const t = vec3.fromValues(vertices[0], vertices[1], vertices[2]);
    const u = vec3.fromValues(vertices[3], vertices[4], vertices[5]);
    const v = vec3.fromValues(vertices[6], vertices[7], vertices[8]);
    const w = vec3.fromValues(vertices[9], vertices[10], vertices[11]);

    divideTetra(t, u, v, w, numTimesToSubdivide);

    // 配置webgl
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // 启用隐藏面消除
    gl.enable(gl.DEPTH_TEST);

    // 加载着色器并初始化属性缓冲区
    const program = initShaders(gl, "vertex-shader-3d", "fragment-shader-3d");
    gl.useProgram(program);

    // 创建缓冲区对象，初始化并与顶点着色器中的属性变量关联
    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    const cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const aColor = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aColor);

    render();

    function triangle(a, b, c, color) {
        // 添加一个三角形的颜色和顶点
        const baseColor = [
            1.0, 0.0, 0.0, 1.0,  // 红色
            0.0, 1.0, 0.0, 1.0,  // 绿色
            0.0, 0.0, 1.0, 1.0,  // 蓝色
            0.0, 0.0, 0.0, 1.0   // 黑色
        ];

        for (let k = 0; k < 4; k++) {
            colors.push(baseColor[color * 4 + k]);
        }
        for (let k = 0; k < 3; k++)
            points.push(a[k]);

        for (let k = 0; k < 4; k++) {
            colors.push(baseColor[color * 4 + k]);
        }
        for (let k = 0; k < 3; k++)
            points.push(b[k]);

        for (let k = 0; k < 4; k++) {
            colors.push(baseColor[color * 4 + k]);
        }
        for (let k = 0; k < 3; k++)
            points.push(c[k]);
    }

    function tetra(a, b, c, d) {
        triangle(a, c, b, 0);
        triangle(a, c, d, 1);
        triangle(a, b, d, 2);
        triangle(b, c, d, 3);
    }

    function divideTetra(a, b, c, d, count) {
        // 检查递归结束条件
        if (count === 0) {
            tetra(a, b, c, d);
        } else {
            const ab = vec3.create();
            glMatrix.vec3.lerp(ab, a, b, 0.5);
            const ac = vec3.create();
            glMatrix.vec3.lerp(ac, a, c, 0.5);
            const ad = vec3.create();
            glMatrix.vec3.lerp(ad, a, d, 0.5);
            const bc = vec3.create();
            glMatrix.vec3.lerp(bc, b, c, 0.5);
            const bd = vec3.create();
            glMatrix.vec3.lerp(bd, b, d, 0.5);
            const cd = vec3.create();
            glMatrix.vec3.lerp(cd, c, d, 0.5);

            --count;

            divideTetra(a, ab, ac, ad, count);
            divideTetra(ab, b, bc, bd, count);
            divideTetra(ac, bc, c, cd, count);
            divideTetra(ad, bd, cd, d, count);
        }
    }

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, points.length / 3);
    }
}

// 高级三角形细分
function drawAdvancedTessellation(numTimesToSubdivide, rotationAngle, rotationType, colorHex) {
    let points = [];
    const radius = 1.0;

    // 初始化三角形的三个顶点
    const vertices = [
        radius * Math.cos(90 * Math.PI / 180.0), radius * Math.sin(90 * Math.PI / 180.0), 0,
        radius * Math.cos(210 * Math.PI / 180.0), radius * Math.sin(210 * Math.PI / 180.0), 0,
        radius * Math.cos(-30 * Math.PI / 180.0), radius * Math.sin(-30 * Math.PI / 180.0), 0
    ];

    const u = vec3.fromValues(vertices[0], vertices[1], vertices[2]);
    const v = vec3.fromValues(vertices[3], vertices[4], vertices[5]);
    const w = vec3.fromValues(vertices[6], vertices[7], vertices[8]);

    divideTriangle(u, v, w, numTimesToSubdivide);

    // 应用旋转效果
    applyRotation();

    // 配置webgl
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // 加载着色器
    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // 将数据加载到GPU
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    // 关联着色器变量与数据缓冲区
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // 设置颜色
    const uColorLocation = gl.getUniformLocation(program, "uColor");
    const r = parseInt(colorHex.substr(1, 2), 16) / 255;
    const g = parseInt(colorHex.substr(3, 2), 16) / 255;
    const b = parseInt(colorHex.substr(5, 2), 16) / 255;
    gl.uniform4f(uColorLocation, r, g, b, 1.0);

    renderTriangles();

    function applyRotation() {
        const baseRadian = rotationAngle * Math.PI / 180.0;
        
        for (let i = 0; i < points.length; i += 3) {
            const x = points[i];
            const y = points[i + 1];
            const z = points[i + 2];
            
            if (rotationType === "distance-based") {
                // 基于距离的旋转：d = sqrt(x^2 + y^2)
                const d = Math.sqrt(x * x + y * y);
                const actualAngle = d * baseRadian;
                
                const cosTheta = Math.cos(actualAngle);
                const sinTheta = Math.sin(actualAngle);
                
                // 应用旋转公式: x' = x*cos(dθ) - y*sin(dθ), y' = x*sin(dθ) + y*cos(dθ)
                points[i] = x * cosTheta - y * sinTheta;
                points[i + 1] = x * sinTheta + y * cosTheta;
            } else {
                // 均匀旋转
                const cosTheta = Math.cos(baseRadian);
                const sinTheta = Math.sin(baseRadian);
                
                points[i] = x * cosTheta - y * sinTheta;
                points[i + 1] = x * sinTheta + y * cosTheta;
            }
            // z坐标保持不变
        }
    }

    function tessellaTriangle(a, b, c) {
        const zerovec3 = vec3.create();
        vec3.zero(zerovec3);
        const radian = 120 * Math.PI / 180.0;

        const a_new = vec3.create();
        const b_new = vec3.create();
        const c_new = vec3.create();

        vec3.rotateZ(a_new, a, zerovec3, radian);
        vec3.rotateZ(b_new, b, zerovec3, radian);
        vec3.rotateZ(c_new, c, zerovec3, radian);

        points.push(a_new[0], a_new[1], a_new[2]);
        points.push(b_new[0], b_new[1], b_new[2]);
        points.push(b_new[0], b_new[1], b_new[2]);
        points.push(c_new[0], c_new[1], c_new[2]);
        points.push(c_new[0], c_new[1], c_new[2]);
        points.push(a_new[0], a_new[1], a_new[2]);
    }

    function divideTriangle(a, b, c, count) {
        // 检查递归结束条件
        if (count === 0) {
            tessellaTriangle(a, b, c);
        } else {
            const ab = vec3.create();
            vec3.lerp(ab, a, b, 0.5);
            const bc = vec3.create();
            vec3.lerp(bc, b, c, 0.5);
            const ca = vec3.create();
            vec3.lerp(ca, c, a, 0.5);

            // 四个新三角形
            divideTriangle(a, ab, ca, count - 1);
            divideTriangle(ab, b, bc, count - 1);
            divideTriangle(ca, bc, c, count - 1);
            divideTriangle(ab, bc, ca, count - 1);
        }
    }

    function renderTriangles() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.LINES, 0, points.length / 3);
    }
}