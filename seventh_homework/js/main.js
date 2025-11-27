"use strict";

const{ vec3, vec4, mat3, mat4, quat } = glMatrix;

var canvas;
var gl;
var fileInput;

var meshdata;
var mesh;

var points = [];
var colors = [];
var acolor = [];
var lineIndex = [];

var color;

var modelViewMatrix = mat4.create();
var projectionMatrix = mat4.create();

var vBuffer = null;
var vPosition = null;
var cBuffer = null;
var vColor = null;
var iBuffer = null;

var lineCnt = 0;

// 正交投影参数
var oleft = -3.0;
var oright = 3.0;
var oytop = 3.0;
var oybottom = -3.0;
var onear = -5;
var ofar = 10;

var oradius = 3.0;
var theta = 0.0;
var phi = 0.0;

// 透视投影参数
var pleft = -10.0;
var pright = 10.0;
var pytop = 10.0;
var pybottom = -10.0;
var pnear = 0.01;
var pfar = 20;
var pradius = 3.0;

var fovy = 45.0 * Math.PI/180.0;
var aspect;

/* dx, dy, dz: the position of object */
var dx = 0;
var dy = 0;
var dz = 0;
var step = 0.1;

var dxt = 0;
var dyt = 0;
var dzt = 0;
var stept = 2;

// scale
var sx = 1;
var sy = 1;
var sz = 1;

/* cx, cy, cz: the position of camera */
var cx = 0.0;
var cy = 0.0;
var cz = 4.0;
var stepc = 0.1;

var cxt = 0;
var cyt = 0;
var czt = 0;
var stepct = 2;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var eye = vec3.fromValues(cx, cy, cz);

var at = vec3.fromValues(0.0, 0.0, 0.0);
var up = vec3.fromValues(0.0, 1.0, 0.0);

var rquat = quat.create();

var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

var currentKey = [];

/* variables for interface control */
var projectionType = 1; // default is Orthographic(1), Perspective(2)
var drawType = 1; // default is WireFrame(1), Solid(2)
var viewType = [0]; // default is orthographic frontview(1), leftView(2), topView(3), isoview(4)
var viewcnt = 0; // view count default = 0, in orthographic or perspective mode

var changePos = 1; // default is Object(1), camera(2)

var currentColor = vec4.create();

var program = null;

// 材质属性
var materialAmbient = 0.2;
var materialDiffuse = 0.8;
var materialSpecular = 0.5;
var materialShininess = 32.0;

// 材质颜色分量
var materialAmbientColor = vec4.fromValues(1.0, 0.0, 0.0, 1.0);  // 红色环境色
var materialDiffuseColor = vec4.fromValues(1.0, 0.0, 0.0, 1.0);  // 红色漫射色
var materialSpecularColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0); // 白色高光色

// 光源属性
var lightPosition = vec3.fromValues(2.0, 2.0, 2.0);

// 光源颜色分量
var lightAmbientColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);  // 白色环境光
var lightDiffuseColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);  // 白色漫射光
var lightSpecularColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0); // 白色高光

// 着色模式
var shadingType = 2; // 1: Gouraud, 2: Phong

// 法线缓冲区
var nBuffer = null;
var vNormal = null;

function updateStatusInfo(message) {
    document.getElementById("status-info").textContent = message;
}

function updateModelInfo() {
    if (mesh) {
        document.getElementById("vertex-count").textContent = mesh.vertices ? mesh.vertices.length / 3 : 0;
        document.getElementById("face-count").textContent = mesh.indices ? mesh.indices.length / 3 : 0;
    }
}

function handleKeyDown(event) {
    var key = event.keyCode;
    currentKey[key] = true;
    if( changePos === 1 ){
        switch (key) {
            case 65: //left//a
                dx -= step;
                document.getElementById("xpos").value = dx;
                document.getElementById("xpos-value").textContent = dx.toFixed(1);
                break;
            case 68: // right//d
                dx += step;
                document.getElementById("xpos").value = dx;
                document.getElementById("xpos-value").textContent = dx.toFixed(1);
                break;
            case 87: // up//w
                dy += step;
                document.getElementById("ypos").value = dy;
                document.getElementById("ypos-value").textContent = dy.toFixed(1);
                break;
            case 83: // down//s
                dy -= step;
                document.getElementById("ypos").value = dy;
                document.getElementById("ypos-value").textContent = dy.toFixed(1);
                break;
            case 90: // z
                dz += step;
                document.getElementById("zpos").value = dz;
                document.getElementById("zpos-value").textContent = dz.toFixed(1);
                break;
            case 88: // x
                dz -= step;
                document.getElementById("zpos").value = dz;
                document.getElementById("zpos-value").textContent = dz.toFixed(1);
                break;
            case 72: // h - Y rotation -
                dyt -= stept;
                document.getElementById("yrot").value = dyt;
                document.getElementById("yrot-value").textContent = dyt + "°";
                break;
            case 75: // k - Y rotation +
                dyt += stept;
                document.getElementById("yrot").value = dyt;
                document.getElementById("yrot-value").textContent = dyt + "°";
                break;
            case 85: // u - X rotation +
                dxt -= stept;
                document.getElementById("xrot").value = dxt;
                document.getElementById("xrot-value").textContent = dxt + "°";
                break;
            case 74: // j - X rotation -
                dxt += stept;
                document.getElementById("xrot").value = dxt;
                document.getElementById("xrot-value").textContent = dxt + "°";
                break;
            case 78: // n - Z rotation +
                dzt += stept;
                document.getElementById("zrot").value = dzt;
                document.getElementById("zrot-value").textContent = dzt + "°";
                break;
            case 77: // m - Z rotation -
                dzt -= stept;
                document.getElementById("zrot").value = dzt;
                document.getElementById("zrot-value").textContent = dzt + "°";
                break;
            case 82: // r - reset
                dx = 0;
                dy = 0;
                dz = 0;
                dxt = 0;
                dyt = 0;
                dzt = 0;
                sx = 1;
                sy = 1;
                sz = 1;
                restoreSliderValue(changePos);
                updateStatusInfo("物体位置已重置");
                break;
        }
    }
    if( changePos === 2 ){
        switch (key) {
            case 65: //left//a
                cx -= stepc;
                document.getElementById("xpos").value = cx;
                document.getElementById("xpos-value").textContent = cx.toFixed(1);
                break;
            case 68: // right//d
                cx += stepc;
                document.getElementById("xpos").value = cx;
                document.getElementById("xpos-value").textContent = cx.toFixed(1);
                break;
            case 87: // up//w
                cy += stepc;
                document.getElementById("ypos").value = cy;
                document.getElementById("ypos-value").textContent = cy.toFixed(1);
                break;
            case 83: // down//s
                cy -= stepc;
                document.getElementById("ypos").value = cy;
                document.getElementById("ypos-value").textContent = cy.toFixed(1);
                break;
            case 90: // z
                cz += stepc;
                document.getElementById("zpos").value = cz;
                document.getElementById("zpos-value").textContent = cz.toFixed(1);
                break;
            case 88: // x
                cz -= stepc;
                document.getElementById("zpos").value = cz;
                document.getElementById("zpos-value").textContent = cz.toFixed(1);
                break;
            case 72: // h - Y rotation -
                cyt -= stepct;
                document.getElementById("yrot").value = cyt;
                document.getElementById("yrot-value").textContent = cyt + "°";
                break;
            case 75: // k - Y rotation +
                cyt += stepct;
                document.getElementById("yrot").value = cyt;
                document.getElementById("yrot-value").textContent = cyt + "°";
                break;
            case 85: // u - X rotation +
                cxt -= stepct;
                document.getElementById("xrot").value = cxt;
                document.getElementById("xrot-value").textContent = cxt + "°";
                break;
            case 74: // j - X rotation -
                cxt += stepct;
                document.getElementById("xrot").value = cxt;
                document.getElementById("xrot-value").textContent = cxt + "°";
                break;
            case 78: // n - Z rotation +
                czt += stepct;
                document.getElementById("zrot").value = czt;
                document.getElementById("zrot-value").textContent = czt + "°";
                break;
            case 77: // m - Z rotation -
                czt -= stepct;
                document.getElementById("zrot").value = czt;
                document.getElementById("zrot-value").textContent = czt + "°";
                break;
            case 82: // r - reset
                cx = 0;
                cy = 0;
                cz = 4;
                cxt = 0;
                cyt = 0;
                czt = 0;
                restoreSliderValue(changePos);
                updateStatusInfo("相机位置已重置");
                break;
        }
    }
    buildModelViewProj();
}

function handleKeyUp(event) {
    currentKey[event.keyCode] = false;
}

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp(event) {
    mouseDown = false;
}

function handleMouseMove(event) {
    if (!mouseDown)
        return;

    var newX = event.clientX;
    var newY = event.clientY;

    var deltaX = (newX - lastMouseX);
    var d = deltaX;
    theta = theta - parseFloat(d);
    
    var deltaY = (newY - lastMouseY);
    d = deltaY;
    phi = phi - parseFloat(d);

    lastMouseX = newX;
    lastMouseY = newY;
    buildModelViewProj();
}

function checkInput(){
    var ptype = document.getElementById( "ortho" ).checked;
    if( ptype ) {
        projectionType = 1;
        document.getElementById("ortho-params").style.display = "block";
        document.getElementById("persp-params").style.display = "none";
    }else{
        if( document.getElementById( "persp" ).checked ) {
            projectionType = 2;
            document.getElementById("ortho-params").style.display = "none";
            document.getElementById("persp-params").style.display = "block";
        }
    }

    var dtype = document.getElementById( "wire" ).checked;
    if( dtype ){
        drawType = 1;
    }else{
        if( document.getElementById( "solid" ).checked )
            drawType = 2;
    }

    var hexcolor = document.getElementById( "objcolor" ).value.substring(1);
    var rgbHex = hexcolor.match(/.{1,2}/g);
    currentColor = vec4.fromValues( 
        parseInt(rgbHex[0], 16)/255.0,
        parseInt(rgbHex[1], 16)/255.0,
        parseInt(rgbHex[2], 16)/255.0,
        1.0
    );
}

function restoreSliderValue(changePos){
    if (changePos === 1) {
        document.getElementById("xpos").value = dx;
        document.getElementById("ypos").value = dy;
        document.getElementById("zpos").value = dz;
        document.getElementById("xrot").value = Math.floor(dxt);
        document.getElementById("yrot").value = Math.floor(dyt);
        document.getElementById("zrot").value = Math.floor(dzt);
        
        document.getElementById("xpos-value").textContent = dx.toFixed(1);
        document.getElementById("ypos-value").textContent = dy.toFixed(1);
        document.getElementById("zpos-value").textContent = dz.toFixed(1);
        document.getElementById("xrot-value").textContent = Math.floor(dxt) + "°";
        document.getElementById("yrot-value").textContent = Math.floor(dyt) + "°";
        document.getElementById("zrot-value").textContent = Math.floor(dzt) + "°";
    }
    if (changePos === 2) {
        document.getElementById("xpos").value = cx;
        document.getElementById("ypos").value = cy;
        document.getElementById("zpos").value = cz;
        document.getElementById("xrot").value = Math.floor(cxt);
        document.getElementById("yrot").value = Math.floor(cyt);
        document.getElementById("zrot").value = Math.floor(czt);
        
        document.getElementById("xpos-value").textContent = cx.toFixed(1);
        document.getElementById("ypos-value").textContent = cy.toFixed(1);
        document.getElementById("zpos-value").textContent = cz.toFixed(1);
        document.getElementById("xrot-value").textContent = Math.floor(cxt) + "°";
        document.getElementById("yrot-value").textContent = Math.floor(cyt) + "°";
        document.getElementById("zrot-value").textContent = Math.floor(czt) + "°";
    }
    
    // 恢复缩放值
    document.getElementById("xscale").value = sx;
    document.getElementById("yscale").value = sy;
    document.getElementById("zscale").value = sz;
    document.getElementById("xscale-value").textContent = sx.toFixed(1);
    document.getElementById("yscale-value").textContent = sy.toFixed(1);
    document.getElementById("zscale-value").textContent = sz.toFixed(1);
}

window.onload = function initWindow(){
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.clearColor(0.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    initInterface();
    initBuffers();

    checkInput();
    updateStatusInfo("系统就绪，请加载OBJ模型文件");
}

function initBuffers(){
    vBuffer = gl.createBuffer();
    cBuffer = gl.createBuffer();
}

function calculateNormals() {
    if (!mesh || !mesh.vertices || !mesh.indices) return;
    
    var vertices = mesh.vertices;
    var indices = mesh.indices;
    
    // 初始化法线数组
    var normals = new Array(vertices.length).fill(0);
    var faceCount = new Array(vertices.length / 3).fill(0);
    
    // 计算每个面的法线并累加到顶点
    for (var i = 0; i < indices.length; i += 3) {
        var i1 = indices[i] * 3;
        var i2 = indices[i + 1] * 3;
        var i3 = indices[i + 2] * 3;
        
        var v1 = vec3.fromValues(vertices[i1], vertices[i1 + 1], vertices[i1 + 2]);
        var v2 = vec3.fromValues(vertices[i2], vertices[i2 + 1], vertices[i2 + 2]);
        var v3 = vec3.fromValues(vertices[i3], vertices[i3 + 1], vertices[i3 + 2]);
        
        var edge1 = vec3.create();
        var edge2 = vec3.create();
        var normal = vec3.create();
        
        vec3.subtract(edge1, v2, v1);
        vec3.subtract(edge2, v3, v1);
        vec3.cross(normal, edge1, edge2);
        vec3.normalize(normal, normal);
        
        // 累加到三个顶点
        for (var j = 0; j < 3; j++) {
            var idx = indices[i + j] * 3;
            normals[idx] += normal[0];
            normals[idx + 1] += normal[1];
            normals[idx + 2] += normal[2];
            faceCount[indices[i + j]]++;
        }
    }
    
    // 平均法线并归一化
    for (var i = 0; i < normals.length; i += 3) {
        var count = faceCount[i / 3];
        if (count > 0) {
            var normal = vec3.fromValues(
                normals[i] / count,
                normals[i + 1] / count,
                normals[i + 2] / count
            );
            vec3.normalize(normal, normal);
            normals[i] = normal[0];
            normals[i + 1] = normal[1];
            normals[i + 2] = normal[2];
        }
    }
    
    return normals;
}

function initInterface(){
    fileInput = document.getElementById("fileInput");
    fileInput.addEventListener("change", function (event) {
        var file = fileInput.files[0];
        if (!file) return;
        
        var reader = new FileReader();
        updateStatusInfo("正在加载模型文件: " + file.name);

        reader.onload = function (event) {
            meshdata = reader.result;
            initObj();
        }
        
        reader.onerror = function() {
            updateStatusInfo("文件读取失败");
        }
        
        reader.readAsText(file);
    });

    var projradios = document.getElementsByName("projtype");
    for (var i = 0; i < projradios.length; i++) {
        projradios[i].addEventListener("click", function (event) {
            var value = this.value;
            if (this.checked) {
                projectionType = parseInt(value);
                if (projectionType === 1) {
                    document.getElementById("ortho-params").style.display = "block";
                    document.getElementById("persp-params").style.display = "none";
                    updateStatusInfo("切换到正交投影模式");
                } else {
                    document.getElementById("ortho-params").style.display = "none";
                    document.getElementById("persp-params").style.display = "block";
                    updateStatusInfo("切换到透视投影模式");
                }
            }
            buildModelViewProj();
        });
    }

    var drawradios = document.getElementsByName("drawtype");
    for (var i = 0; i < drawradios.length; i++) {
        drawradios[i].onclick = function () {
            var value = this.value;
            if (this.checked) {
                drawType = parseInt(value);
                updateStatusInfo(drawType === 1 ? "切换到线框模式" : "切换到实体模式");
            }
            updateModelData();
        }
    }

    document.getElementById("objcolor").addEventListener("input", function (event) {
        var hexcolor = this.value.substring(1);
        var rgbHex = hexcolor.match(/.{1,2}/g);
        currentColor = vec4.fromValues(
            parseInt(rgbHex[0], 16) * 1.0 / 255.0,
            parseInt(rgbHex[1], 16) * 1.0 / 255.0,
            parseInt(rgbHex[2], 16) * 1.0 / 255.0,
            1.0
        );
        updateColor();
        updateStatusInfo("模型颜色已更新");
    });

    // 材质属性滑块事件
    document.getElementById("ambient").addEventListener("input", function(event){
        materialAmbient = parseFloat(this.value);
        document.getElementById("ambient-value").textContent = materialAmbient.toFixed(2);
        buildModelViewProj();
    });
    
    document.getElementById("diffuse").addEventListener("input", function(event){
        materialDiffuse = parseFloat(this.value);
        document.getElementById("diffuse-value").textContent = materialDiffuse.toFixed(2);
        buildModelViewProj();
    });
    
    document.getElementById("specular").addEventListener("input", function(event){
        materialSpecular = parseFloat(this.value);
        document.getElementById("specular-value").textContent = materialSpecular.toFixed(2);
        buildModelViewProj();
    });
    
    document.getElementById("shininess").addEventListener("input", function(event){
        materialShininess = parseFloat(this.value);
        document.getElementById("shininess-value").textContent = materialShininess.toFixed(1);
        buildModelViewProj();
    });
    
    // 材质颜色分量选择器事件
    document.getElementById("material-ambient-color").addEventListener("input", function(event){
        var hexcolor = this.value.substring(1);
        var rgbHex = hexcolor.match(/.{1,2}/g);
        materialAmbientColor = vec4.fromValues(
            parseInt(rgbHex[0], 16) / 255.0,
            parseInt(rgbHex[1], 16) / 255.0,
            parseInt(rgbHex[2], 16) / 255.0,
            1.0
        );
        buildModelViewProj();
    });

    document.getElementById("material-diffuse-color").addEventListener("input", function(event){
        var hexcolor = this.value.substring(1);
        var rgbHex = hexcolor.match(/.{1,2}/g);
        materialDiffuseColor = vec4.fromValues(
            parseInt(rgbHex[0], 16) / 255.0,
            parseInt(rgbHex[1], 16) / 255.0,
            parseInt(rgbHex[2], 16) / 255.0,
            1.0
        );
        buildModelViewProj();
    });

    document.getElementById("material-specular-color").addEventListener("input", function(event){
        var hexcolor = this.value.substring(1);
        var rgbHex = hexcolor.match(/.{1,2}/g);
        materialSpecularColor = vec4.fromValues(
            parseInt(rgbHex[0], 16) / 255.0,
            parseInt(rgbHex[1], 16) / 255.0,
            parseInt(rgbHex[2], 16) / 255.0,
            1.0
        );
        buildModelViewProj();
    });
    
    // 光源位置滑块事件
    document.getElementById("light-x").addEventListener("input", function(event){
        lightPosition[0] = parseFloat(this.value);
        document.getElementById("light-x-value").textContent = lightPosition[0].toFixed(1);
        buildModelViewProj();
    });
    
    document.getElementById("light-y").addEventListener("input", function(event){
        lightPosition[1] = parseFloat(this.value);
        document.getElementById("light-y-value").textContent = lightPosition[1].toFixed(1);
        buildModelViewProj();
    });
    
    document.getElementById("light-z").addEventListener("input", function(event){
        lightPosition[2] = parseFloat(this.value);
        document.getElementById("light-z-value").textContent = lightPosition[2].toFixed(1);
        buildModelViewProj();
    });
    
    // 光源颜色分量选择器事件
    document.getElementById("light-ambient-color").addEventListener("input", function(event){
        var hexcolor = this.value.substring(1);
        var rgbHex = hexcolor.match(/.{1,2}/g);
        lightAmbientColor = vec4.fromValues(
            parseInt(rgbHex[0], 16) / 255.0,
            parseInt(rgbHex[1], 16) / 255.0,
            parseInt(rgbHex[2], 16) / 255.0,
            1.0
        );
        buildModelViewProj();
    });

    document.getElementById("light-diffuse-color").addEventListener("input", function(event){
        var hexcolor = this.value.substring(1);
        var rgbHex = hexcolor.match(/.{1,2}/g);
        lightDiffuseColor = vec4.fromValues(
            parseInt(rgbHex[0], 16) / 255.0,
            parseInt(rgbHex[1], 16) / 255.0,
            parseInt(rgbHex[2], 16) / 255.0,
            1.0
        );
        buildModelViewProj();
    });

    document.getElementById("light-specular-color").addEventListener("input", function(event){
        var hexcolor = this.value.substring(1);
        var rgbHex = hexcolor.match(/.{1,2}/g);
        lightSpecularColor = vec4.fromValues(
            parseInt(rgbHex[0], 16) / 255.0,
            parseInt(rgbHex[1], 16) / 255.0,
            parseInt(rgbHex[2], 16) / 255.0,
            1.0
        );
        buildModelViewProj();
    });
    
    // 着色模式单选按钮
    var shadingRadios = document.getElementsByName("shadingtype");
    for (var i = 0; i < shadingRadios.length; i++) {
        shadingRadios[i].addEventListener("click", function (event) {
            var value = this.value;
            if (this.checked) {
                shadingType = parseInt(value);
                updateStatusInfo(shadingType === 1 ? "切换到Gouraud着色" : "切换到Phong着色");
                buildModelViewProj();
            }
        });
    }

    // 位置和旋转滑块事件
    document.getElementById("xpos").addEventListener("input", function(event){
        if(changePos===1) {
            dx = parseFloat(this.value);
            document.getElementById("xpos-value").textContent = dx.toFixed(1);
        }
        else if(changePos===2) {
            cx = parseFloat(this.value);
            document.getElementById("xpos-value").textContent = cx.toFixed(1);
        }
        buildModelViewProj();
    });
    document.getElementById("ypos").addEventListener("input", function(event){
        if(changePos===1) {
            dy = parseFloat(this.value);
            document.getElementById("ypos-value").textContent = dy.toFixed(1);
        }
        else if(changePos===2) {
            cy = parseFloat(this.value);
            document.getElementById("ypos-value").textContent = cy.toFixed(1);
        }
        buildModelViewProj();
    });
    document.getElementById("zpos").addEventListener("input", function(event){
        if(changePos===1) {
            dz = parseFloat(this.value);
            document.getElementById("zpos-value").textContent = dz.toFixed(1);
        }
        else if(changePos===2) {
            cz = parseFloat(this.value);
            document.getElementById("zpos-value").textContent = cz.toFixed(1);
        }
        buildModelViewProj();
    });

    document.getElementById("xrot").addEventListener("input", function(event){
        if(changePos===1) {
            dxt = parseFloat(this.value);
            document.getElementById("xrot-value").textContent = dxt + "°";
        }
        else if(changePos===2) {
            cxt = parseFloat(this.value);
            document.getElementById("xrot-value").textContent = cxt + "°";
        }
        buildModelViewProj();
    });
    document.getElementById("yrot").addEventListener("input", function(event){
        if(changePos===1) {
            dyt = parseFloat(this.value);
            document.getElementById("yrot-value").textContent = dyt + "°";
        }
        else if(changePos===2) {
            cyt = parseFloat(this.value);
            document.getElementById("yrot-value").textContent = cyt + "°";
        }
        buildModelViewProj();
    });
    document.getElementById("zrot").addEventListener("input",function(event){
        if (changePos === 1) {
            dzt = parseFloat(this.value);
            document.getElementById("zrot-value").textContent = dzt + "°";
        }
        else if (changePos === 2) {
            czt = parseFloat(this.value);
            document.getElementById("zrot-value").textContent = czt + "°";
        }
        buildModelViewProj();
    });

    // 缩放滑块事件
    document.getElementById("xscale").addEventListener("input", function(event){
        sx = parseFloat(this.value);
        document.getElementById("xscale-value").textContent = sx.toFixed(1);
        buildModelViewProj();
    });
    document.getElementById("yscale").addEventListener("input", function(event){
        sy = parseFloat(this.value);
        document.getElementById("yscale-value").textContent = sy.toFixed(1);
        buildModelViewProj();
    });
    document.getElementById("zscale").addEventListener("input", function(event){
        sz = parseFloat(this.value);
        document.getElementById("zscale-value").textContent = sz.toFixed(1);
        buildModelViewProj();
    });

    // 投影参数滑块事件
    document.getElementById("left").addEventListener("input", function(event){
        oleft = parseFloat(this.value);
        document.getElementById("left-value").textContent = oleft.toFixed(1);
        buildModelViewProj();
    });
    document.getElementById("right").addEventListener("input", function(event){
        oright = parseFloat(this.value);
        document.getElementById("right-value").textContent = oright.toFixed(1);
        buildModelViewProj();
    });
    document.getElementById("top").addEventListener("input", function(event){
        oytop = parseFloat(this.value);
        document.getElementById("top-value").textContent = oytop.toFixed(1);
        buildModelViewProj();
    });
    document.getElementById("bottom").addEventListener("input", function(event){
        oybottom = parseFloat(this.value);
        document.getElementById("bottom-value").textContent = oybottom.toFixed(1);
        buildModelViewProj();
    });
    document.getElementById("fovy").addEventListener("input", function(event){
        fovy = parseFloat(this.value) * Math.PI/180.0;
        document.getElementById("fovy-value").textContent = this.value + "°";
        buildModelViewProj();
    });

    var postypeRadio = document.getElementsByName("posgrp");
    for (var i = 0; i < postypeRadio.length; i++) {
        postypeRadio[i].addEventListener("click", function (event) {
            var value = this.value;
            if (this.checked) {
                changePos = parseInt(value);
                updateStatusInfo(changePos === 1 ? "切换到物体变换模式" : "切换到相机变换模式");
                restoreSliderValue(changePos);
            }
        });
    }

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
}

function buildMultiViewProj(type){
    if( type[0] === 0 )
        render();
    else
        rendermultiview();
}

function initObj(){
    try {
        mesh = new OBJ.Mesh( meshdata );
        OBJ.initMeshBuffers( gl, mesh );

        // 计算法线
        var normals = calculateNormals();
        
        // 创建法线缓冲区
        nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        
        vNormal = gl.getAttribLocation(program, "vNormal");
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);

        gl.bindBuffer( gl.ARRAY_BUFFER, mesh.vertexBuffer );

        vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );
        
        var bcolor = [];
        for( var i=0; i<mesh.vertexBuffer.numItems; i++)
            bcolor.push( currentColor[0], currentColor[1], currentColor[2], currentColor[3] );

        if( cBuffer === null) 
            cBuffer = gl.createBuffer();

        // setColors
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( bcolor ), gl.STATIC_DRAW );

        vColor = gl.getAttribLocation( program, "vColor" );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        // 自动居中模型
        dx = -1.0 * (parseFloat(mesh.xmax) + parseFloat(mesh.xmin))/2.0;
        dy = -1.0 * (parseFloat(mesh.ymax) + parseFloat(mesh.ymin))/2.0;
        dz = -1.0 * (parseFloat(mesh.zmax) + parseFloat(mesh.zmin))/2.0;

        // 自动缩放模型到合适大小
        var maxScale;
        var scalex = Math.abs(parseFloat(mesh.xmax)-parseFloat(mesh.xmin));
        var scaley = Math.abs(parseFloat(mesh.ymax)-parseFloat(mesh.ymin));
        var scalez = Math.abs(parseFloat(mesh.zmax)-parseFloat(mesh.zmin));

        maxScale = Math.max(scalex, scaley, scalez);

        sx = 2.0/maxScale;
        sy = 2.0/maxScale;
        sz = 2.0/maxScale;

        updateModelData();
        buildModelViewProj();
        updateColor();
        restoreSliderValue(changePos);
        updateModelInfo();
        updateStatusInfo("模型加载成功！");

        render();
    } catch (e) {
        updateStatusInfo("加载OBJ文件时出错: " + e.message);
        console.error(e);
    }
}

function updateModelData(){
    if( vBuffer === null)
        vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vBuffer );
    lineIndex = [];
    for( var i = 0; i < mesh.indices.length; i+=3 ){
        lineIndex.push(mesh.indices[i], mesh.indices[i+1]);
        lineIndex.push(mesh.indices[i+1], mesh.indices[i + 2]);
        lineIndex.push(mesh.indices[i+2], mesh.indices[i]);
    }
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndex), gl.STATIC_DRAW );
}

function updateColor(){
    if (!mesh) return;
    
    var bcolor = [];
    for (var i = 0; i < mesh.vertexBuffer.numItems; i++)
        bcolor.push(currentColor[0], currentColor[1], currentColor[2], currentColor[3]);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bcolor), gl.STATIC_DRAW);

    vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
}

function buildModelViewProj(){
    /* ModelViewMatrix & ProjectionMatrix */
    var localRadius;

    if( projectionType == 1 ){
        // 正交投影
        mat4.ortho( pMatrix, oleft, oright, oybottom, oytop, onear, ofar );
        localRadius = oradius;
    }else{
        // 透视投影
        aspect = canvas.width / canvas.height;
        mat4.perspective(pMatrix, fovy, aspect, pnear, pfar);
        localRadius = pradius;
    }
    
    var rthe = theta * Math.PI / 180.0;
    var rphi = phi * Math.PI / 180.0;

    // 更新相机位置
    vec3.set(eye, 
        localRadius * Math.sin(rthe) * Math.cos(rphi), 
        localRadius * Math.sin(rthe) * Math.sin(rphi), 
        localRadius * Math.cos(rthe)
    ); 

    // 添加相机位置偏移
    eye[0] += cx;
    eye[1] += cy;
    eye[2] += cz;

    mat4.lookAt( mvMatrix, eye, at, up );
    
    // 应用物体变换
    mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(dx, dy, dz));
    
    // 应用物体旋转
    mat4.rotateZ(mvMatrix, mvMatrix, dzt * Math.PI / 180.0);
    mat4.rotateY(mvMatrix, mvMatrix, dyt * Math.PI / 180.0);
    mat4.rotateX(mvMatrix, mvMatrix, dxt * Math.PI / 180.0);
    
    // 应用物体缩放
    mat4.scale(mvMatrix, mvMatrix, vec3.fromValues(sx, sy, sz));

    // 计算法线矩阵
    var normalMatrix = mat3.create();
    mat3.normalFromMat4(normalMatrix, mvMatrix);

    // 设置uniform变量
    modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrix, false, mvMatrix);
    
    projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrix, false, pMatrix);
    
    var normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    gl.uniformMatrix3fv(normalMatrixLoc, false, normalMatrix);
    
    // 设置材质uniform - 使用分离的颜色分量
    var materialAmbientLoc = gl.getUniformLocation(program, "uMaterialAmbient");
    gl.uniform4f(materialAmbientLoc, 
        materialAmbient * materialAmbientColor[0], 
        materialAmbient * materialAmbientColor[1], 
        materialAmbient * materialAmbientColor[2], 
        1.0
    );
    
    var materialDiffuseLoc = gl.getUniformLocation(program, "uMaterialDiffuse");
    gl.uniform4f(materialDiffuseLoc, 
        materialDiffuse * materialDiffuseColor[0], 
        materialDiffuse * materialDiffuseColor[1], 
        materialDiffuse * materialDiffuseColor[2], 
        1.0
    );
    
    var materialSpecularLoc = gl.getUniformLocation(program, "uMaterialSpecular");
    gl.uniform4f(materialSpecularLoc, 
        materialSpecular * materialSpecularColor[0], 
        materialSpecular * materialSpecularColor[1], 
        materialSpecular * materialSpecularColor[2], 
        1.0
    );
    
    var materialShininessLoc = gl.getUniformLocation(program, "uMaterialShininess");
    gl.uniform1f(materialShininessLoc, materialShininess);
    
    // 设置光源uniform - 使用分离的颜色分量
    var lightPositionLoc = gl.getUniformLocation(program, "uLightPosition");
    gl.uniform3fv(lightPositionLoc, lightPosition);
    
    var lightAmbientLoc = gl.getUniformLocation(program, "uLightAmbient");
    gl.uniform4fv(lightAmbientLoc, lightAmbientColor);
    
    var lightDiffuseLoc = gl.getUniformLocation(program, "uLightDiffuse");
    gl.uniform4fv(lightDiffuseLoc, lightDiffuseColor);
    
    var lightSpecularLoc = gl.getUniformLocation(program, "uLightSpecular");
    gl.uniform4fv(lightSpecularLoc, lightSpecularColor);
    
    var shadingTypeLoc = gl.getUniformLocation(program, "uShadingType");
    gl.uniform1i(shadingTypeLoc, shadingType);
}

var interval = setInterval(timerFunc, 30);

function timerFunc() {
    render();
}

function render(){
    if (!mesh) return;
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    aspect = canvas.width / canvas.height;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderType( drawType );
}

function renderType(type){
    if (type == 1) {
        // 线框模式
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vBuffer);
        gl.drawElements(gl.LINES, lineIndex.length, gl.UNSIGNED_SHORT, 0);
    } else {
        // 实体模式
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
}