"use strict";

const { vec3, vec4, mat4 } = glMatrix;

// 正交投影相关变量
var orthoCanvas;
var orthoGl;
var orthoEye;
var orthoMvMatrix = mat4.create();
var orthoPMatrix = mat4.create();
var orthoModelViewMatrix, orthoProjectionMatrix;
var orthoNumVertices = 36;
var orthoPoints = [];
var orthoColors = [];

// 正交投影参数
var orthoNear = -1;
var orthoFar = 1;
var orthoRadius = 1.0;
var orthoTheta = 0.0;
var orthoPhi = 0.0;
var orthoDtheta = 5.0 * Math.PI / 180.0;
var orthoLeft = -1.0;
var orthoRight = 1.0;
var orthoYtop = 1.0;
var orthoYbottom = -1.0;
const orthoEyeat = vec3.fromValues(0.0, 0.0, 0.0);
const orthoEyeup = vec3.fromValues(0.0, 1.0, 0.0);

// 透视投影相关变量
var perspCanvas;
var perspGl;
var perspNumVertices = 36;
var perspPoints = [];
var perspColors = [];
var perspNear = 0.1;
var perspFar = 5.0;
var perspRadius = 4.0;
var perspTheta = 0.0;
var perspPhi = 0.0;
var perspDtheta = 5.0 * Math.PI / 180.0;
var perspFovy = 45.0 * Math.PI / 180.0;
var perspAspect;
var perspMvMatrix = mat4.create();
var perspPMatrix = mat4.create();
var perspModelViewMatrix, perspProjectionMatrix;
var perspEye;
const perspAt = vec3.fromValues(0.0, 0.0, 0.0);
const perspUp = vec3.fromValues(0.0, 1.0, 0.0);

// 创建彩色立方体（正交投影）
function makeOrthoColorCube() {
    var vertices = [
        vec4.fromValues(-0.5, -0.5, 0.5, 1.0),
        vec4.fromValues(-0.5, 0.5, 0.5, 1.0),
        vec4.fromValues(0.5, 0.5, 0.5, 1.0),
        vec4.fromValues(0.5, -0.5, 0.5, 1.0),
        vec4.fromValues(-0.5, -0.5, -0.5, 1.0),
        vec4.fromValues(-0.5, 0.5, -0.5, 1.0),
        vec4.fromValues(0.5, 0.5, -0.5, 1.0),
        vec4.fromValues(0.5, -0.5, -0.5, 1.0)
    ];

    var vertexColors = [
        vec4.fromValues(0.0, 0.0, 0.0, 1.0),
        vec4.fromValues(1.0, 0.0, 0.0, 1.0),
        vec4.fromValues(1.0, 1.0, 0.0, 1.0),
        vec4.fromValues(0.0, 1.0, 0.0, 1.0),
        vec4.fromValues(0.0, 0.0, 1.0, 1.0),
        vec4.fromValues(1.0, 0.0, 1.0, 1.0),
        vec4.fromValues(0.0, 1.0, 1.0, 1.0),
        vec4.fromValues(1.0, 1.0, 1.0, 1.0)
    ];

    var faces = [
        1, 0, 3, 1, 3, 2,//正
        2, 3, 7, 2, 7, 6,//右
        3, 0, 4, 3, 4, 7,//底
        6, 5, 1, 6, 1, 2,//顶
        4, 5, 6, 4, 6, 7,//背
        5, 4, 0, 5, 0, 1 //左
    ];

    for (var i = 0; i < faces.length; i++) {
        orthoPoints.push(vertices[faces[i]][0], vertices[faces[i]][1], vertices[faces[i]][2]);
        var id = Math.floor(i / 6);
        orthoColors.push(vertexColors[id][0], vertexColors[id][1], vertexColors[id][2], vertexColors[id][3]);
    }
}

// 创建彩色立方体（透视投影）
function makePerspColorCube() {
    var vertices = [
        vec4.fromValues(-0.5, -0.5, 0.5, 1.0),
        vec4.fromValues(-0.5, 0.5, 0.5, 1.0),
        vec4.fromValues(0.5, 0.5, 0.5, 1.0),
        vec4.fromValues(0.5, -0.5, 0.5, 1.0),
        vec4.fromValues(-0.5, -0.5, -0.5, 1.0),
        vec4.fromValues(-0.5, 0.5, -0.5, 1.0),
        vec4.fromValues(0.5, 0.5, -0.5, 1.0),
        vec4.fromValues(0.5, -0.5, -0.5, 1.0)
    ];

    var vertexColors = [
        vec4.fromValues(0.0, 0.0, 0.0, 1.0),
        vec4.fromValues(1.0, 0.0, 0.0, 1.0),
        vec4.fromValues(1.0, 1.0, 0.0, 1.0),
        vec4.fromValues(0.0, 1.0, 0.0, 1.0),
        vec4.fromValues(0.0, 0.0, 1.0, 1.0),
        vec4.fromValues(1.0, 0.0, 1.0, 1.0),
        vec4.fromValues(0.0, 1.0, 1.0, 1.0),
        vec4.fromValues(1.0, 1.0, 1.0, 1.0)
    ];

    var faces = [
        1, 0, 3, 1, 3, 2,//正
        2, 3, 7, 2, 7, 6,//右
        3, 0, 4, 3, 4, 7,//底
        6, 5, 1, 6, 1, 2,//顶
        4, 5, 6, 4, 6, 7,//背
        5, 4, 0, 5, 0, 1 //左
    ];

    for (var i = 0; i < faces.length; i++) {
        perspPoints.push(vertices[faces[i]][0], vertices[faces[i]][1], vertices[faces[i]][2], vertices[faces[i]][3]);
        var id = Math.floor(i / 6);
        perspColors.push(vertexColors[id][0], vertexColors[id][1], vertexColors[id][2], vertexColors[id][3]);
    }
}

// 初始化正交投影立方体
function initOrthoCube() {
    orthoCanvas = document.getElementById("proj-canvas");
    orthoGl = orthoCanvas.getContext("webgl2");
    if (!orthoGl) {
        alert("WebGL isn't available");
    }

    orthoGl.viewport(0, 0, orthoCanvas.width, orthoCanvas.height);
    orthoGl.clearColor(1.0, 1.0, 1.0, 1.0);
    orthoGl.enable(orthoGl.DEPTH_TEST);

    var program = initShaders(orthoGl, "vertex-shader", "fragment-shader");
    orthoGl.useProgram(program);

    makeOrthoColorCube();

    var cBuffer = orthoGl.createBuffer();
    orthoGl.bindBuffer(orthoGl.ARRAY_BUFFER, cBuffer);
    orthoGl.bufferData(orthoGl.ARRAY_BUFFER, new Float32Array(orthoColors), orthoGl.STATIC_DRAW);

    var vColor = orthoGl.getAttribLocation(program, "vColor");
    orthoGl.vertexAttribPointer(vColor, 4, orthoGl.FLOAT, false, 0, 0);
    orthoGl.enableVertexAttribArray(vColor);

    var vBuffer = orthoGl.createBuffer();
    orthoGl.bindBuffer(orthoGl.ARRAY_BUFFER, vBuffer);
    orthoGl.bufferData(orthoGl.ARRAY_BUFFER, new Float32Array(orthoPoints), orthoGl.STATIC_DRAW);

    var vPosition = orthoGl.getAttribLocation(program, "vPosition");
    orthoGl.vertexAttribPointer(vPosition, 3, orthoGl.FLOAT, false, 0, 0);
    orthoGl.enableVertexAttribArray(vPosition);

    orthoModelViewMatrix = orthoGl.getUniformLocation(program, "modelViewMatrix");
    orthoProjectionMatrix = orthoGl.getUniformLocation(program, "projectionMatrix");

    // 按钮事件绑定
    document.getElementById("btn1").onclick = function () { orthoNear *= 1.1; orthoFar *= 1.1; };
    document.getElementById("btn2").onclick = function () { orthoNear *= 0.9; orthoFar *= 0.9; };
    document.getElementById("btn3").onclick = function () { orthoRadius *= 1.1; };
    document.getElementById("btn4").onclick = function () { orthoRadius *= 0.9; };
    document.getElementById("btn5").onclick = function () { orthoTheta += orthoDtheta; };
    document.getElementById("btn6").onclick = function () { orthoTheta -= orthoDtheta; };
    document.getElementById("btn7").onclick = function () { orthoPhi += orthoDtheta; };
    document.getElementById("btn8").onclick = function () { orthoPhi -= orthoDtheta; };

    renderOrtho();
}

// 初始化透视投影立方体
function initPerspCube() {
    perspCanvas = document.getElementById("gl-canvas");
    perspGl = perspCanvas.getContext("webgl2");
    if (!perspGl) { 
        alert("WebGL isn't available"); 
    }

    perspGl.viewport(0, 0, perspCanvas.width, perspCanvas.height);
    perspAspect = perspCanvas.width / perspCanvas.height;
    perspGl.clearColor(1.0, 1.0, 1.0, 1.0);
    perspGl.enable(perspGl.DEPTH_TEST);

    var program = initShaders(perspGl, "vertex-shader", "fragment-shader");
    perspGl.useProgram(program);

    makePerspColorCube();

    var cBuffer = perspGl.createBuffer();
    perspGl.bindBuffer(perspGl.ARRAY_BUFFER, cBuffer);
    perspGl.bufferData(perspGl.ARRAY_BUFFER, new Float32Array(perspColors), perspGl.STATIC_DRAW);

    var vColor = perspGl.getAttribLocation(program, "vColor");
    perspGl.vertexAttribPointer(vColor, 4, perspGl.FLOAT, false, 0, 0);
    perspGl.enableVertexAttribArray(vColor);

    var vBuffer = perspGl.createBuffer();
    perspGl.bindBuffer(perspGl.ARRAY_BUFFER, vBuffer);
    perspGl.bufferData(perspGl.ARRAY_BUFFER, new Float32Array(perspPoints), perspGl.STATIC_DRAW);

    var vPosition = perspGl.getAttribLocation(program, "vPosition");
    perspGl.vertexAttribPointer(vPosition, 4, perspGl.FLOAT, false, 0, 0);
    perspGl.enableVertexAttribArray(vPosition);

    perspModelViewMatrix = perspGl.getUniformLocation(program, "modelViewMatrix");
    perspProjectionMatrix = perspGl.getUniformLocation(program, "projectionMatrix");

    // 按钮事件绑定
    document.getElementById("btn1-persp").onclick = function () { perspNear *= 1.1; perspFar *= 1.1; };
    document.getElementById("btn2-persp").onclick = function () { perspNear *= 0.9; perspFar *= 0.9; };
    document.getElementById("btn3-persp").onclick = function () { perspRadius *= 1.1; };
    document.getElementById("btn4-persp").onclick = function () { perspRadius *= 0.9; };
    document.getElementById("btn5-persp").onclick = function () { perspTheta += perspDtheta; };
    document.getElementById("btn6-persp").onclick = function () { perspTheta -= perspDtheta; };
    document.getElementById("btn7-persp").onclick = function () { perspPhi += perspDtheta; };
    document.getElementById("btn8-persp").onclick = function () { perspPhi -= perspDtheta; };

    renderPersp();
}

// 渲染正交投影
function renderOrtho() {
    orthoGl.clear(orthoGl.COLOR_BUFFER_BIT | orthoGl.DEPTH_BUFFER_BIT);

    orthoEye = vec3.fromValues(orthoRadius * Math.sin(orthoPhi), orthoRadius * Math.sin(orthoTheta), orthoRadius * Math.cos(orthoPhi));

    mat4.lookAt(orthoMvMatrix, orthoEye, orthoEyeat, orthoEyeup);
    mat4.ortho(orthoPMatrix, orthoLeft, orthoRight, orthoYbottom, orthoYtop, orthoNear, orthoFar);

    orthoGl.uniformMatrix4fv(orthoModelViewMatrix, false, new Float32Array(orthoMvMatrix));
    orthoGl.uniformMatrix4fv(orthoProjectionMatrix, false, new Float32Array(orthoPMatrix));

    orthoGl.drawArrays(orthoGl.TRIANGLES, 0, orthoPoints.length / 3);
    requestAnimFrame(renderOrtho);
}

// 渲染透视投影
var renderPersp = function () {
    perspGl.clear(perspGl.COLOR_BUFFER_BIT | perspGl.DEPTH_BUFFER_BIT);

    // 修复相机位置计算，确保立方体在视锥体内
    perspEye = vec3.fromValues(
        perspRadius * Math.sin(perspTheta) * Math.cos(perspPhi),
        perspRadius * Math.sin(perspTheta) * Math.sin(perspPhi), 
        perspRadius * Math.cos(perspTheta)
    );

    mat4.lookAt(perspMvMatrix, perspEye, perspAt, perspUp);
    mat4.perspective(perspPMatrix, perspFovy, perspAspect, perspNear, perspFar);

    perspGl.uniformMatrix4fv(perspModelViewMatrix, false, new Float32Array(perspMvMatrix));
    perspGl.uniformMatrix4fv(perspProjectionMatrix, false, new Float32Array(perspPMatrix));

    perspGl.drawArrays(perspGl.TRIANGLES, 0, perspNumVertices);
    requestAnimFrame(renderPersp);
}

// 初始化函数
function initAll() {
    initOrthoCube();
    initPerspCube();
}

// 页面加载完成后初始化
window.onload = initAll;