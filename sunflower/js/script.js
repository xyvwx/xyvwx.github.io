// ==================== 全局变量定义 ====================
let scene, camera, renderer, controls;
let sunflower, flowerPetals = [], flowerCenter, flowerGroup; 
let rainSystem, rainyLight, sunnyLight, ambientLight, rainyDirectionalLight;
let pointLight;
let isHappy = true;
let isGrowing = false;
let sunModel, sunnyPointLight;
let breezeTweens = [];
let windowSill;

let pot, soil, stem, leftLeaf, rightLeaf, flowerSeeds = [];

const targetScaleNormal = new THREE.Vector3();
const originalPetalRotations = [];

const happyMessages = [ "今天天气真好！给自己买杯奶茶吧~", "生活需要一点甜，吃个小蛋糕奖励自己！", "去公园散散步，呼吸新鲜空气", "看一部喜欢的电影，放松心情", "给好朋友打个电话，分享快乐", "阳光正好，适合出去走走", "做点让自己开心的事，今天你值得", "听首喜欢的歌，跟着节奏摇摆", "给自己买束花，装点生活", "尝试一道新菜谱，享受烹饪乐趣", "读本好书，沉浸在故事中", "做做运动，释放多巴胺", "整理房间，让环境更舒适", "计划一次周末短途旅行", "学习一项新技能，充实自己" ];

// 雷电效果相关变量
let lightningInterval = null;
let isAutoThunder = false;
let thunderProperties = {
    intensity: 5,
    frequency: 5,
    volume: 0.5
};

// 小乌云相关变量
let clouds = [];
let cloudInterval = null;
let cloudProperties = {
    count: 4,
    size: 1.0,
    speed: 0.8
};

// 星星荧光效果相关变量
let stars = [];
let starsInterval = null;
let isStarsEnabled = false;
let starsProperties = {
    count: 80,
    size: 0.3,
    speed: 1.5,
    glow: 0.8
};

// 雷声数组
const thunderSounds = [
    "audio/thunder1.mp3",
    "audio/thunder2.mp3",
    "audio/thunder3.mp3"
];
let audioContext;
let thunderAudioBuffers = [];
let isAudioInitialized = false;

// 效果相关DOM元素
const lightningFlash = document.getElementById('lightningFlash');
const thunderIndicator = document.getElementById('thunderIndicator');
const cloudIndicator = document.getElementById('cloudIndicator');
const starsIndicator = document.getElementById('starsIndicator');

let sunnySkyTexture, rainySkyTexture;
let skyTextures = {}; // 存储不同景色纹理

// 装饰商店相关变量
let decorItems = [];
let currentPotStyle = 'ceramic';
let currentView = 'city';

// 新增：物品摆件相关变量
let itemObjects = [];
let selectedItem = null;
let itemIdCounter = 0;

// 动物交互相关变量
let animalInteractions = {};
let currentAnimal = null;
let animalMessages = {
    cat: [
        "喵~ 主人来摸摸我！",
        "喵喵~ 今天有鱼吃吗？",
        "呼噜呼噜~ 好舒服",
        "喵！看到一只蝴蝶！",
        "伸个懒腰~ 晒太阳真舒服",
        "蹭蹭你~ 要抱抱",
        "眯起眼睛~ 享受阳光",
        "好奇地看着窗外",
        "用爪子洗脸",
        "尾巴轻轻摇摆"
    ],
    dog: [
        "汪汪！主人陪我玩！",
        "摇尾巴~ 好开心！",
        "汪汪！有陌生人！",
        "吐舌头~ 天气好热",
        "打滚~ 最喜欢主人了",
        "叼着玩具跑来跑去",
        "竖起耳朵~ 听到声音",
        "趴在地上休息",
        "兴奋地转圈圈",
        "把爪子搭在你手上"
    ]
};

let currentCalendarDate = new Date();
let selectedDateKey = '';
let moodData = {};

// ==================== 材质、光源、相机相关变量 ====================
let materialProperties = {
    ambient: 0.2,
    diffuse: 0.8,
    specular: 0.5,
    shininess: 32,
    petalColor: 0xFFD700,
    leafColor: 0x2E7D32
};

let lightProperties = {
    sunIntensity: 1.0,
    ambientIntensity: 0.8,
    pointLightIntensity: 0.7,
    sunPositionX: 5,
    sunPositionY: 10,
    sunPositionZ: 7,
    sunColor: 0xFFD700,
    ambientColor: 0xFFFFFF,
    shadowQuality: 512
};

let cameraProperties = {
    positionX: 0,
    positionY: 2,
    positionZ: 10,
    fov: 75,
    mode: 'orbit'
};

let savedCameraViews = [];

// ==================== 初始化函数 ====================
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 10);
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, 0);
    controls.enableDamping = true;
    controls.minDistance = 3;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 1.8;
    
    setupLights();
    createSunModel();
    createSkyTextures();
    createSceneContent();
    loadMoodData();
    loadSavedSettings();
    bindEvents();
    initNewControls();
    initDecorControls();
    initItemControls();
    initThunderControls();
    initCloudControls();
    initStarsControls();
    animate();
    
    // 初始化音频
    initAudio();
    
    // 应用初始装饰设置
    updatePotStyle();
    updateView();
    
    // 不添加默认物品，保持初始场景纯净
    // addDefaultItems();
}

// ==================== 雷电效果初始化 ====================
function initThunderControls() {
    // 雷电强度控制
    document.getElementById('thunderIntensity').addEventListener('input', function() {
        thunderProperties.intensity = parseInt(this.value);
        document.getElementById('thunderIntensityValue').textContent = this.value;
        saveSettings();
    });
    
    // 雷电频率控制
    document.getElementById('thunderFrequency').addEventListener('input', function() {
        thunderProperties.frequency = parseInt(this.value);
        document.getElementById('thunderFrequencyValue').textContent = this.value;
        saveSettings();
    });
    
    // 雷声音量控制
    document.getElementById('thunderVolume').addEventListener('input', function() {
        thunderProperties.volume = parseFloat(this.value);
        document.getElementById('thunderVolumeValue').textContent = this.value;
        saveSettings();
    });
    
    // 测试雷电按钮
    document.getElementById('btnTestThunder').addEventListener('click', function() {
        triggerThunderEffect();
    });
    
    // 自动雷电模式按钮
    document.getElementById('btnAutoThunder').addEventListener('click', function() {
        toggleAutoThunder();
    });
}

// ==================== 小乌云效果初始化 ====================
function initCloudControls() {
    // 乌云数量控制
    document.getElementById('cloudCount').addEventListener('input', function() {
        cloudProperties.count = parseInt(this.value);
        document.getElementById('cloudCountValue').textContent = this.value;
        if (!isHappy) {
            updateClouds();
        }
        saveSettings();
    });
    
    // 乌云大小控制
    document.getElementById('cloudSize').addEventListener('input', function() {
        cloudProperties.size = parseFloat(this.value);
        document.getElementById('cloudSizeValue').textContent = this.value;
        if (!isHappy) {
            updateClouds();
        }
        saveSettings();
    });
    
    // 乌云速度控制
    document.getElementById('cloudSpeed').addEventListener('input', function() {
        cloudProperties.speed = parseFloat(this.value);
        document.getElementById('cloudSpeedValue').textContent = this.value;
        saveSettings();
    });
    
    // 更新乌云按钮
    document.getElementById('btnUpdateClouds').addEventListener('click', function() {
        if (!isHappy) {
            updateClouds();
            document.getElementById('cloudStatus').textContent = "乌云效果已更新";
            setTimeout(() => {
                document.getElementById('cloudStatus').textContent = "";
            }, 2000);
        } else {
            alert("小乌云效果只能在沮丧（下雨）模式下使用！");
        }
    });
}

// ==================== 星星荧光效果初始化 ====================
function initStarsControls() {
    // 星星数量控制
    document.getElementById('starsCount').addEventListener('input', function() {
        starsProperties.count = parseInt(this.value);
        document.getElementById('starsCountValue').textContent = this.value;
        if (isStarsEnabled && !isHappy) {
            updateStars();
        }
        saveSettings();
    });
    
    // 星星大小控制
    document.getElementById('starsSize').addEventListener('input', function() {
        starsProperties.size = parseFloat(this.value);
        document.getElementById('starsSizeValue').textContent = this.value;
        if (isStarsEnabled && !isHappy) {
            updateStars();
        }
        saveSettings();
    });
    
    // 星星闪烁速度控制
    document.getElementById('starsSpeed').addEventListener('input', function() {
        starsProperties.speed = parseFloat(this.value);
        document.getElementById('starsSpeedValue').textContent = this.value;
        saveSettings();
    });
    
    // 星星发光强度控制
    document.getElementById('starsGlow').addEventListener('input', function() {
        starsProperties.glow = parseFloat(this.value);
        document.getElementById('starsGlowValue').textContent = this.value;
        if (isStarsEnabled && !isHappy) {
            updateStars();
        }
        saveSettings();
    });
    
    // 切换星星效果按钮
    document.getElementById('btnToggleStars').addEventListener('click', function() {
        toggleStars();
    });
    
    // 更新星星效果按钮
    document.getElementById('btnUpdateStars').addEventListener('click', function() {
        if (!isHappy) {
            updateStars();
            document.getElementById('starsStatus').textContent = "星星效果已更新";
            setTimeout(() => {
                document.getElementById('starsStatus').textContent = "";
            }, 2000);
        } else {
            alert("星星荧光效果只能在沮丧（下雨）模式下使用！");
        }
    });
}

// 初始化音频
function initAudio() {
    try {
        // 创建音频上下文
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 由于浏览器安全策略，我们需要用户交互后才能播放音频
        // 这里我们先加载音频，但实际播放会在用户交互后
        console.log("音频系统已初始化，等待用户交互...");
        isAudioInitialized = true;
        
        // 添加一个全局点击事件来解锁音频
        document.addEventListener('click', unlockAudio, { once: true });
        
    } catch (e) {
        console.error("音频初始化失败:", e);
        isAudioInitialized = false;
    }
}

function unlockAudio() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log("音频已解锁");
            // 现在可以加载雷声音频了
            loadThunderSounds();
        });
    }
}

function loadThunderSounds() {
    // 创建简单的雷声音频（使用振荡器模拟）
    // 在实际项目中，您可能需要加载真实的音频文件
    console.log("使用振荡器模拟雷声音频");
    
    // 创建三个不同频率的雷声
    for (let i = 0; i < 3; i++) {
        // 创建音频缓冲区
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
        const channelData = buffer.getChannelData(0);
        
        // 生成雷声波形（低频率噪音）
        for (let j = 0; j < channelData.length; j++) {
            // 随机噪音，逐渐衰减
            const decay = 1.0 - (j / channelData.length);
            channelData[j] = (Math.random() * 2 - 1) * decay * 0.5;
        }
        
        thunderAudioBuffers.push(buffer);
    }
    
    console.log("雷声音频已加载");
}

function playThunderSound() {
    if (!isAudioInitialized || !audioContext || thunderAudioBuffers.length === 0) {
        console.log("音频不可用，使用视觉提示");
        return;
    }
    
    try {
        // 随机选择一个雷声音频
        const bufferIndex = Math.floor(Math.random() * thunderAudioBuffers.length);
        const buffer = thunderAudioBuffers[bufferIndex];
        
        // 创建音频源
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        
        // 创建增益节点控制音量
        const gainNode = audioContext.createGain();
        gainNode.gain.value = thunderProperties.volume * 0.5;
        
        // 连接音频节点
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 播放音频
        source.start();
        
        console.log("播放雷声，音量:", thunderProperties.volume);
    } catch (e) {
        console.error("播放雷声失败:", e);
    }
}

function triggerThunderEffect() {
    if (!isHappy) {
        createLightningEffect();
        playThunderSound();
        showThunderText();
        
        // 更新状态显示
        document.getElementById('thunderStatus').textContent = "雷电效果已触发";
        setTimeout(() => {
            document.getElementById('thunderStatus').textContent = "";
        }, 2000);
    } else {
        alert("雷电效果只能在沮丧（下雨）模式下使用！");
    }
}

function toggleAutoThunder() {
    if (!isHappy) {
        isAutoThunder = !isAutoThunder;
        
        const btn = document.getElementById('btnAutoThunder');
        if (isAutoThunder) {
            btn.textContent = "关闭自动雷电";
            btn.style.background = "linear-gradient(135deg, #F44336, #D32F2F)";
            thunderIndicator.style.display = "block";
            thunderIndicator.textContent = "雷电效果：自动模式";
            
            // 启动自动雷电
            startAutoThunder();
        } else {
            btn.textContent = "自动雷电模式";
            btn.style.background = "linear-gradient(135deg, #6a11cb, #2575fc)";
            thunderIndicator.style.display = "none";
            
            // 停止自动雷电
            stopAutoThunder();
        }
        
        saveSettings();
    } else {
        alert("雷电效果只能在沮丧（下雨）模式下使用！");
    }
}

function startAutoThunder() {
    if (lightningInterval) {
        clearInterval(lightningInterval);
    }
    
    // 根据频率设置间隔时间（频率越高间隔越短）
    const baseInterval = 10000; // 10秒基础间隔
    const frequencyFactor = (10 - thunderProperties.frequency) / 10; // 频率越高，因子越小
    const interval = baseInterval * frequencyFactor;
    
    lightningInterval = setInterval(() => {
        if (isAutoThunder && !isHappy) {
            createLightningEffect();
            playThunderSound();
            showThunderText();
        }
    }, interval);
    
    console.log("自动雷电模式已启动，间隔:", interval, "ms");
}

function stopAutoThunder() {
    if (lightningInterval) {
        clearInterval(lightningInterval);
        lightningInterval = null;
    }
    console.log("自动雷电模式已停止");
}

function createLightningEffect() {
    // 强度因子
    const intensityFactor = thunderProperties.intensity / 10;
    
    // 1. 屏幕闪光效果
    lightningFlash.style.opacity = 0.7 * intensityFactor;
    lightningFlash.style.backgroundColor = "white";
    
    // 创建闪电形状
    createLightningShapes();
    
    // 2. 场景光源增强
    const originalIntensity = ambientLight.intensity;
    const originalColor = ambientLight.color.clone();
    
    // 短暂增强环境光
    ambientLight.intensity = originalIntensity + 0.8 * intensityFactor;
    ambientLight.color.setHex(0xFFFFFF);
    
    // 3. 创建3D闪电效果
    create3DLightning();
    
    // 4. 相机轻微震动
    if (thunderProperties.intensity > 5) {
        shakeCamera();
    }
    
    // 恢复效果
    setTimeout(() => {
        lightningFlash.style.opacity = 0;
        ambientLight.intensity = originalIntensity;
        ambientLight.color.copy(originalColor);
        
        // 第二次闪光（可选）
        if (Math.random() > 0.5) {
            setTimeout(() => {
                lightningFlash.style.opacity = 0.4 * intensityFactor;
                setTimeout(() => {
                    lightningFlash.style.opacity = 0;
                }, 50);
            }, 100);
        }
    }, 100);
}

function createLightningShapes() {
    const container = document.getElementById('cloudTextContainer');
    
    // 创建3-5个闪电形状
    const lightningCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < lightningCount; i++) {
        const lightning = document.createElement('div');
        lightning.className = 'lightning-shape';
        
        // 随机位置
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.7;
        
        // 随机大小和旋转
        const width = 5 + Math.random() * 10;
        const height = 30 + Math.random() * 60;
        const rotation = (Math.random() - 0.5) * 60;
        
        lightning.style.width = `${width}px`;
        lightning.style.height = `${height}px`;
        lightning.style.left = `${x}px`;
        lightning.style.top = `${y}px`;
        lightning.style.transform = `rotate(${rotation}deg)`;
        lightning.style.opacity = 0.8;
        
        container.appendChild(lightning);
        
        // 动画效果
        setTimeout(() => {
            lightning.style.opacity = 0;
            setTimeout(() => {
                if (container.contains(lightning)) {
                    container.removeChild(lightning);
                }
            }, 100);
        }, 50 + i * 30);
    }
}

function create3DLightning() {
    // 创建3D闪电效果
    const lightningGeometry = new THREE.BufferGeometry();
    
    // 创建闪电路径（随机锯齿状）
    const points = [];
    const startX = (Math.random() - 0.5) * 10;
    const startY = 15 + Math.random() * 5;
    const startZ = (Math.random() - 0.5) * 5;
    
    points.push(new THREE.Vector3(startX, startY, startZ));
    
    // 生成闪电分支
    let currentX = startX;
    let currentY = startY;
    let currentZ = startZ;
    
    const segmentCount = 5 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < segmentCount; i++) {
        currentY -= 1.5 + Math.random() * 2;
        currentX += (Math.random() - 0.5) * 3;
        currentZ += (Math.random() - 0.5) * 2;
        
        points.push(new THREE.Vector3(currentX, currentY, currentZ));
        
        // 随机创建分支
        if (Math.random() > 0.7 && i < segmentCount - 2) {
            const branchPoints = [];
            let branchX = currentX;
            let branchY = currentY;
            let branchZ = currentZ;
            
            for (let j = 0; j < 3; j++) {
                branchY -= 0.5 + Math.random();
                branchX += (Math.random() - 0.5) * 2;
                branchZ += (Math.random() - 0.5) * 2;
                
                branchPoints.push(new THREE.Vector3(branchX, branchY, branchZ));
            }
            
            // 创建分支线
            const branchGeometry = new THREE.BufferGeometry().setFromPoints(branchPoints);
            const branchMaterial = new THREE.LineBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.8
            });
            const branchLine = new THREE.Line(branchGeometry, branchMaterial);
            scene.add(branchLine);
            
            // 2秒后移除分支
            setTimeout(() => {
                scene.remove(branchLine);
                branchGeometry.dispose();
                branchMaterial.dispose();
            }, 2000);
        }
    }
    
    // 设置主闪电几何
    lightningGeometry.setFromPoints(points);
    
    const lightningMaterial = new THREE.LineBasicMaterial({
        color: 0xFFFFFF,
        linewidth: 2,
        transparent: true,
        opacity: 0.9
    });
    
    const lightningLine = new THREE.Line(lightningGeometry, lightningMaterial);
    scene.add(lightningLine);
    
    // 2秒后移除闪电
    setTimeout(() => {
        scene.remove(lightningLine);
        lightningGeometry.dispose();
        lightningMaterial.dispose();
    }, 2000);
}

function shakeCamera() {
    const originalPosition = camera.position.clone();
    const shakeIntensity = thunderProperties.intensity * 0.005;
    
    // 创建相机震动动画
    new TWEEN.Tween(camera.position)
        .to({
            x: originalPosition.x + (Math.random() - 0.5) * shakeIntensity,
            y: originalPosition.y + (Math.random() - 0.5) * shakeIntensity,
            z: originalPosition.z + (Math.random() - 0.5) * shakeIntensity
        }, 50)
        .yoyo(true)
        .repeat(2)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onComplete(() => {
            camera.position.copy(originalPosition);
        })
        .start();
}

function showThunderText() {
    const container = document.getElementById('cloudTextContainer');
    const thunderText = document.createElement('div');
    thunderText.className = 'thunder-text';
    
    // 随机雷声文本
    const thunderPhrases = [
        "轰隆隆...",
        "咔嚓！",
        "雷声大作！",
        "闪电划破天空！",
        "雷鸣电闪！"
    ];
    
    thunderText.textContent = thunderPhrases[Math.floor(Math.random() * thunderPhrases.length)];
    
    // 随机位置
    const x = Math.random() * window.innerWidth;
    const y = 100 + Math.random() * 200;
    
    thunderText.style.left = `${x}px`;
    thunderText.style.top = `${y}px`;
    
    container.appendChild(thunderText);
    
    // 3秒后移除
    setTimeout(() => {
        if (container.contains(thunderText)) {
            container.removeChild(thunderText);
        }
    }, 2000);
}

// ==================== 小乌云功能 ====================
function createCloud() {
    const cloudGroup = new THREE.Group();
    
    // 创建乌云材质
    const cloudMaterial = new THREE.MeshPhongMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.9,
        shininess: 10
    });
    
    // 乌云由多个球体组成，形成不规则的形状
    const cloudParts = 4 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < cloudParts; i++) {
        const size = (Math.random() * 0.4 + 0.2) * cloudProperties.size;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const cloudPart = new THREE.Mesh(geometry, cloudMaterial);
        
        // 随机位置，使乌云看起来更自然
        cloudPart.position.set(
            (Math.random() - 0.5) * 0.8 * cloudProperties.size,
            (Math.random() - 0.5) * 0.3 * cloudProperties.size,
            (Math.random() - 0.5) * 0.3 * cloudProperties.size
        );
        
        cloudPart.castShadow = true;
        cloudPart.receiveShadow = true;
        cloudGroup.add(cloudPart);
    }
    
    // 设置乌云的初始位置（在窗外天空中）
    const windowSillBottomY = -windowSill.height / 2;
    cloudGroup.position.set(
        (Math.random() - 0.5) * (windowSill.width - 2),
        windowSillBottomY + windowSill.height * 0.7 + Math.random() * 3,
        -2.5 + (Math.random() - 0.5) * 0.5
    );
    
    // 设置乌云的初始缩放
    cloudGroup.scale.set(cloudProperties.size, cloudProperties.size, cloudProperties.size);
    
    // 添加用户数据
    cloudGroup.userData = {
        isCloud: true,
        speed: (Math.random() * 0.5 + 0.5) * cloudProperties.speed,
        direction: Math.random() > 0.5 ? 1 : -1,
        floatSpeed: Math.random() * 0.02 + 0.01
    };
    
    return cloudGroup;
}

function createClouds() {
    // 清除现有的乌云
    removeClouds();
    
    // 创建新的乌云
    for (let i = 0; i < cloudProperties.count; i++) {
        const cloud = createCloud();
        scene.add(cloud);
        clouds.push(cloud);
    }
    
    // 显示乌云状态
    cloudIndicator.style.display = "block";
    cloudIndicator.textContent = `小乌云：${cloudProperties.count}朵`;
}

function removeClouds() {
    clouds.forEach(cloud => {
        scene.remove(cloud);
        // 释放几何体和材质
        cloud.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
    });
    clouds = [];
    
    // 隐藏乌云状态
    cloudIndicator.style.display = "none";
}

function updateClouds() {
    // 重新创建乌云
    createClouds();
}

function animateClouds() {
    if (!isHappy && clouds.length > 0) {
        const windowSillBottomY = -windowSill.height / 2;
        const windowWidth = windowSill.width;
        
        clouds.forEach(cloud => {
            // 水平移动
            cloud.position.x += cloud.userData.speed * cloud.userData.direction * 0.02;
            
            // 轻微上下浮动
            cloud.position.y += Math.sin(Date.now() * 0.001 * cloud.userData.floatSpeed) * 0.01;
            
            // 轻微旋转
            cloud.rotation.y += 0.001;
            
            // 如果乌云移出窗口范围，重新定位到另一侧
            if (cloud.position.x > windowWidth/2 + 1) {
                cloud.position.x = -windowWidth/2 - 1;
                cloud.position.y = windowSillBottomY + windowSill.height * 0.7 + Math.random() * 3;
            } else if (cloud.position.x < -windowWidth/2 - 1) {
                cloud.position.x = windowWidth/2 + 1;
                cloud.position.y = windowSillBottomY + windowSill.height * 0.7 + Math.random() * 3;
            }
        });
    }
}

// ==================== 星星荧光效果功能 ====================
function createStar() {
    // 创建星星几何体
    const starGeometry = new THREE.SphereGeometry(starsProperties.size, 8, 8);
    
    // 创建星星材质（发光的）
    const starMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: starsProperties.glow * 0.8,
        emissive: 0xFFFFFF,
        emissiveIntensity: starsProperties.glow
    });
    
    const star = new THREE.Mesh(starGeometry, starMaterial);
    
    // 设置星星的初始位置（在窗外天空中随机分布）
    const windowSillBottomY = -windowSill.height / 2;
    const windowSillTopY = windowSill.height / 2;
    
    star.position.set(
        (Math.random() - 0.5) * (windowSill.width - 2),
        windowSillBottomY + windowSill.height * 0.2 + Math.random() * windowSill.height * 0.6,
        -2.5 + (Math.random() * 0.5 - 0.25)
    );
    
    // 添加用户数据
    star.userData = {
        isStar: true,
        originalOpacity: starsProperties.glow * 0.8,
        pulseSpeed: Math.random() * 0.5 + 0.5,
        pulsePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 2 + 1
    };
    
    return star;
}

function createStars() {
    // 清除现有的星星
    removeStars();
    
    // 创建新的星星
    for (let i = 0; i < starsProperties.count; i++) {
        const star = createStar();
        scene.add(star);
        stars.push(star);
    }
    
    // 显示星星状态
    starsIndicator.style.display = "block";
    starsIndicator.textContent = `星星荧光：${starsProperties.count}颗`;
}

function removeStars() {
    stars.forEach(star => {
        scene.remove(star);
        // 释放几何体和材质
        star.geometry.dispose();
        star.material.dispose();
    });
    stars = [];
    
    // 隐藏星星状态
    starsIndicator.style.display = "none";
}

function toggleStars() {
    if (!isHappy) {
        isStarsEnabled = !isStarsEnabled;
        
        const btn = document.getElementById('btnToggleStars');
        if (isStarsEnabled) {
            btn.textContent = "关闭星星效果";
            btn.style.background = "linear-gradient(135deg, #673AB7, #512DA8)";
            starsIndicator.style.display = "block";
            starsIndicator.textContent = `星星荧光：${starsProperties.count}颗`;
            
            // 创建星星
            createStars();
        } else {
            btn.textContent = "切换星星效果";
            btn.style.background = "linear-gradient(135deg, #9C27B0, #673AB7)";
            starsIndicator.style.display = "none";
            
            // 移除星星
            removeStars();
        }
        
        saveSettings();
    } else {
        alert("星星荧光效果只能在沮丧（下雨）模式下使用！");
    }
}

function updateStars() {
    // 重新创建星星
    createStars();
}

function animateStars() {
    if (!isHappy && isStarsEnabled && stars.length > 0) {
        const time = Date.now() * 0.001;
        
        stars.forEach(star => {
            // 闪烁效果
            const pulse = Math.sin(time * star.userData.pulseSpeed + star.userData.pulsePhase) * 0.5 + 0.5;
            star.material.opacity = star.userData.originalOpacity * (0.5 + pulse * 0.5);
            
            // 轻微的颜色变化
            const colorShift = Math.sin(time * star.userData.twinkleSpeed) * 0.2;
            star.material.color.setRGB(
                0.9 + colorShift,
                0.9 + colorShift,
                1.0 - colorShift * 0.5
            );
            
            // 非常缓慢的移动（像星星的闪烁）
            star.position.y += Math.sin(time * star.userData.pulseSpeed * 2 + star.userData.pulsePhase) * 0.001;
        });
    }
}

// ==================== 场景搭建 ====================
function setupLights() {
    ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    sunnyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    sunnyLight.position.set(5, 10, 7);
    sunnyLight.castShadow = true;
    sunnyLight.shadow.mapSize.width = 1024;
    sunnyLight.shadow.mapSize.height = 1024;
    scene.add(sunnyLight);
    
    sunnyPointLight = new THREE.PointLight(0xFFD700, 1.2, 50);
    sunnyPointLight.position.set(0, 8, -20);
    scene.add(sunnyPointLight);
    
    rainyLight = new THREE.AmbientLight(0x708090, 0.6);
    rainyLight.visible = false;
    scene.add(rainyLight);

    rainyDirectionalLight = new THREE.DirectionalLight(0xaaaaaa, 0.5);
    rainyDirectionalLight.position.set(-5, 10, 2);
    rainyDirectionalLight.castShadow = true;
    rainyDirectionalLight.shadow.mapSize.width = 1024;
    rainyDirectionalLight.shadow.mapSize.height = 1024;
    rainyDirectionalLight.visible = false;
    scene.add(rainyDirectionalLight);

    pointLight = new THREE.PointLight(0xffffff, 0.7, 100);
    pointLight.position.set(0, 5, 5);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 256; 
    pointLight.shadow.mapSize.height = 256;
    scene.add(pointLight);
}

function createSunModel() {
    const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.8 });
    sunModel = new THREE.Mesh(sunGeometry, sunMaterial);
    sunModel.position.set(0, 8, -25);
    sunModel.renderOrder = -1;
    scene.add(sunModel);
}

// 创建天空纹理
function createSkyTextures() {
    // 原有晴天纹理
    sunnySkyTexture = new THREE.CanvasTexture(createSkyCanvas());
    rainySkyTexture = new THREE.CanvasTexture(createRainySkyCanvas());
    
    // 创建不同景色纹理
    skyTextures = {
        city: createCityTexture(),
        forest: createForestTexture(),
        beach: createBeachTexture(),
        mountain: createMountainTexture(),
        garden: createGardenTexture(),
        night: createNightTexture()
    };
}

function createCityTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 天空
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#E0F7FF');
    gradient.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // 建筑
    ctx.fillStyle = '#666666';
    for(let i = 0; i < 8; i++) {
        const x = 50 + i * 50;
        const height = 150 + Math.random() * 100;
        ctx.fillRect(x, 512 - height, 40, height);
        
        // 窗户
        ctx.fillStyle = '#FFD700';
        for(let j = 0; j < 5; j++) {
            for(let k = 0; k < 4; k++) {
                if(Math.random() > 0.3) {
                    ctx.fillRect(x + 5 + k * 8, 512 - height + 10 + j * 20, 5, 10);
                }
            }
        }
        ctx.fillStyle = '#666666';
    }
    
    return new THREE.CanvasTexture(canvas);
}

function createForestTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 天空
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.6, '#98FB98');
    gradient.addColorStop(1, '#228B22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // 树木
    ctx.fillStyle = '#8B4513';
    for(let i = 0; i < 10; i++) {
        const x = 30 + i * 45;
        const height = 120 + Math.random() * 80;
        ctx.fillRect(x, 512 - height, 25, height);
        
        // 树冠
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(x + 12, 512 - height - 20, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B4513';
    }
    
    return new THREE.CanvasTexture(canvas);
}

function createBeachTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 天空和海
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.6, '#87CEEB');
    gradient.addColorStop(0.65, '#FFE4B5');
    gradient.addColorStop(1, '#F4A460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // 海
    ctx.fillStyle = '#1E90FF';
    ctx.fillRect(0, 512 * 0.6, 512, 512 * 0.1);
    
    // 太阳
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(400, 100, 40, 0, Math.PI * 2);
    ctx.fill();
    
    return new THREE.CanvasTexture(canvas);
}

function createMountainTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 天空
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.3, '#B0C4DE');
    gradient.addColorStop(0.7, '#708090');
    gradient.addColorStop(1, '#2F4F4F');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // 山脉
    ctx.fillStyle = '#696969';
    ctx.beginPath();
    ctx.moveTo(0, 512);
    for(let i = 0; i < 512; i += 20) {
        ctx.lineTo(i, 350 + Math.sin(i/50) * 50 + Math.random() * 30);
    }
    ctx.lineTo(512, 512);
    ctx.closePath();
    ctx.fill();
    
    return new THREE.CanvasTexture(canvas);
}

function createGardenTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 天空和草地
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#98FB98');
    gradient.addColorStop(1, '#32CD32');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // 花朵
    for(let i = 0; i < 15; i++) {
        const x = 30 + Math.random() * 452;
        const y = 350 + Math.random() * 150;
        drawFlower(ctx, x, y);
    }
    
    return new THREE.CanvasTexture(canvas);
}

function createNightTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 夜空
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#191970');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // 星星
    ctx.fillStyle = '#FFFFFF';
    for(let i = 0; i < 100; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 256;
        const size = Math.random() * 2 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 月亮
    ctx.fillStyle = '#F5F5DC';
    ctx.beginPath();
    ctx.arc(400, 80, 30, 0, Math.PI * 2);
    ctx.fill();
    
    return new THREE.CanvasTexture(canvas);
}

function drawFlower(ctx, x, y) {
    // 花茎
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 20);
    ctx.stroke();
    
    // 花瓣
    const colors = ['#FF69B4', '#FFD700', '#FF6347'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillStyle = color;
    for(let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const petalX = x + Math.cos(angle) * 8;
        const petalY = y + Math.sin(angle) * 8;
        ctx.beginPath();
        ctx.arc(petalX, petalY, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 花心
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
}

function createSceneContent() {
    windowSill = createWindowSill();
    scene.add(windowSill.group);
    sunflower = createSunflower();
    const windowSillBottomY = -windowSill.height / 2 + 0.2;
    const scale = (windowSill.height / 3) / 3.5;
    targetScaleNormal.set(scale, scale, scale);
    sunflower.scale.copy(targetScaleNormal);
    sunflower.position.set(0, windowSillBottomY + 0.01, 0.5);
    scene.add(sunflower);
    rainSystem = createRain();
    scene.add(rainSystem);
    flowerPetals.forEach(p => originalPetalRotations.push(p.rotation.clone()));
    
    setHappyMood();
}

// ==================== 心情状态切换 ====================

function toggleMood() {
    if (isGrowing) return;
    isHappy ? setSadMood() : setHappyMood();
}

function setHappyMood() {
    isHappy = true;
    
    // 隐藏特效控制模块
    document.getElementById('thunderModule').style.display = 'none';
    document.getElementById('cloudModule').style.display = 'none';
    document.getElementById('starsModule').style.display = 'none';
    
    // 停止雷电效果
    if (isAutoThunder) {
        stopAutoThunder();
        isAutoThunder = false;
        document.getElementById('btnAutoThunder').textContent = "自动雷电模式";
        document.getElementById('btnAutoThunder').style.background = "linear-gradient(135deg, #6a11cb, #2575fc)";
        thunderIndicator.style.display = "none";
    }
    
    // 移除乌云
    removeClouds();
    
    // 移除星星
    if (isStarsEnabled) {
        removeStars();
        isStarsEnabled = false;
        document.getElementById('btnToggleStars').textContent = "切换星星效果";
        document.getElementById('btnToggleStars').style.background = "linear-gradient(135deg, #9C27B0, #673AB7)";
        starsIndicator.style.display = "none";
    }
    
    sunModel.visible = true;
    sunnyPointLight.visible = true;
    ambientLight.visible = true;
    sunnyLight.visible = true;
    rainyLight.visible = false;
    rainyDirectionalLight.visible = false;
    scene.background = new THREE.Color(0xadd8e6);
    rainSystem.visible = false;
    
    updateView();
    
    const moodBtn = document.getElementById('btnMood');
    moodBtn.textContent = "切换心情";
    moodBtn.className = "btn-sad";
    moodBtn.title = "点击切换到沮丧状态";
    document.getElementById('btnWater').disabled = true;
    const indicator = document.getElementById('moodIndicator');
    indicator.textContent = "心情：愉悦 🌞";
    indicator.className = "mood-indicator mood-happy";
    
    new TWEEN.Tween(sunflower.scale).to({ x: targetScaleNormal.x * 1.1, y: targetScaleNormal.y * 1.1, z: targetScaleNormal.z * 1.1 }, 1500).easing(TWEEN.Easing.Elastic.Out).start();
    new TWEEN.Tween(flowerGroup.rotation).to({ x: -Math.PI/2 + 0.1 }, 1500).easing(TWEEN.Easing.Elastic.Out).start();
    flowerPetals.forEach((petal, i) => { new TWEEN.Tween(petal.rotation).to({ x: 0, y: 0, z: 0 }, 1500).easing(TWEEN.Easing.Elastic.Out).start(); });
    startBreezeAnimation();
}

function setSadMood() {
    isHappy = false;
    
    // 显示特效控制模块
    document.getElementById('thunderModule').style.display = 'block';
    document.getElementById('cloudModule').style.display = 'block';
    document.getElementById('starsModule').style.display = 'block';
    
    // 创建乌云
    createClouds();
    
    // 如果星星效果已启用，创建星星
    if (isStarsEnabled) {
        createStars();
    }
    
    sunModel.visible = false;
    sunnyPointLight.visible = false;
    ambientLight.visible = false;
    sunnyLight.visible = false;
    rainyLight.visible = true;
    rainyDirectionalLight.visible = true;
    scene.background = new THREE.Color(0x606070);
    rainSystem.visible = true;
    
    windowSill.skyMesh.material.map = rainySkyTexture;
    windowSill.skyMesh.material.needsUpdate = true;
    
    stopBreezeAnimation();
    
    const moodBtn = document.getElementById('btnMood');
    moodBtn.textContent = "切换心情";
    moodBtn.className = "btn-happy";
    moodBtn.title = "点击切换到愉悦状态";
    document.getElementById('btnWater').disabled = false;
    const indicator = document.getElementById('moodIndicator');
    indicator.textContent = "心情：沮丧 🌧️";
    indicator.className = "mood-indicator mood-sad";
    
    new TWEEN.Tween(sunflower.scale).to({ x: targetScaleNormal.x * 0.8, y: targetScaleNormal.y * 0.8, z: targetScaleNormal.z * 0.8 }, 1000).easing(TWEEN.Easing.Quadratic.Out).start();
    new TWEEN.Tween(flowerGroup.rotation).to({ x: -Math.PI/2 - 0.3 }, 1000).easing(TWEEN.Easing.Quadratic.Out).start();
    flowerPetals.forEach(petal => { new TWEEN.Tween(petal.rotation).to({ z: petal.rotation.z + Math.PI / 4 }, 1000).easing(TWEEN.Easing.Quadratic.Out).start(); });
    
    // 如果是自动雷电模式，重新启动
    if (isAutoThunder) {
        setTimeout(() => {
            startAutoThunder();
        }, 1000);
    }
}

// ==================== 交互动画 ====================
function startBreezeAnimation() {
    stopBreezeAnimation();
    const sunflowerSway = new TWEEN.Tween(sunflower.rotation).to({ y: 0.4 }, 2000).easing(TWEEN.Easing.Sinusoidal.InOut).yoyo(true).repeat(Infinity).start();
    breezeTweens.push(sunflowerSway);
    flowerPetals.forEach((petal, index) => {
        const delay = index * 50;
        const petalBounce = new TWEEN.Tween(petal.position).to({ y: petal.position.y + 0.1 }, 1200 + Math.random() * 400).easing(TWEEN.Easing.Sinusoidal.InOut).yoyo(true).repeat(Infinity).delay(delay).start();
        breezeTweens.push(petalBounce);
        const petalRotate = new TWEEN.Tween(petal.rotation).to({ x: petal.rotation.x + 0.1, z: petal.rotation.z + 0.05 }, 1500 + Math.random() * 500).easing(TWEEN.Easing.Sinusoidal.InOut).yoyo(true).repeat(Infinity).delay(delay).start();
        breezeTweens.push(petalRotate);
    });
    const centerBounce = new TWEEN.Tween(flowerCenter.position).to({ y: flowerCenter.position.y + 0.06 }, 1000).easing(TWEEN.Easing.Sinusoidal.InOut).yoyo(true).repeat(Infinity).start();
    breezeTweens.push(centerBounce);
    const sunflowerBounce = new TWEEN.Tween(sunflower.position).to({ y: sunflower.position.y + 0.05 }, 1500).easing(TWEEN.Easing.Sinusoidal.InOut).yoyo(true).repeat(Infinity).delay(500).start();
    breezeTweens.push(sunflowerBounce);
}

function stopBreezeAnimation() { breezeTweens.forEach(tween => tween.stop()); breezeTweens = []; }
function onDoubleClickSunflower() { if (!isHappy) return; createSunshineEffect(); showHappyMessage(); }
function createSunshineEffect() { const pC = 40; const ps = new THREE.Group(); for (let i = 0; i < pC; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.9 })); const a = Math.random() * Math.PI * 2; const r = Math.random() * 2 + 0.5; p.position.set(sunflower.position.x + Math.cos(a) * r, sunflower.position.y + Math.random() * 3 + 1, sunflower.position.z + Math.sin(a) * r); ps.add(p); new TWEEN.Tween(p.position).to({ y: p.position.y + 3 + Math.random() * 2, x: p.position.x + (Math.random() - 0.5) * 3, z: p.position.z + (Math.random() - 0.5) * 3 }, 2500).easing(TWEEN.Easing.Quadratic.Out).start(); new TWEEN.Tween(p.material).to({ opacity: 0 }, 2500).easing(TWEEN.Easing.Quadratic.Out).onComplete(() => { ps.remove(p); }).start(); } scene.add(ps); setTimeout(() => { scene.remove(ps); }, 3000); }
function showHappyMessage() { const c = document.getElementById('cloudTextContainer'); const m = happyMessages[Math.floor(Math.random() * happyMessages.length)]; const ct = document.createElement('div'); ct.className = 'cloud-text'; ct.textContent = m; const v = new THREE.Vector3(); sunflower.getWorldPosition(v); v.project(camera); const x = (v.x * 0.5 + 0.5) * window.innerWidth; const y = (-v.y * 0.5 + 0.5) * window.innerHeight; ct.style.left = `${x}px`; ct.style.top = `${y}px`; c.appendChild(ct); setTimeout(() => { c.removeChild(ct); }, 3000); }
function startWatering() { if (isHappy || isGrowing) return; isGrowing = true; document.getElementById('btnWater').disabled = true; document.getElementById('btnMood').disabled = true; const wI = document.getElementById('wateringInfo'); wI.style.opacity = '1'; const oLP = { left: leftLeaf.position.clone(), right: rightLeaf.position.clone() }; new TWEEN.Tween(stem.scale).to({ x: 1.3, y: 1.4, z: 1.3 }, 3000).easing(TWEEN.Easing.Cubic.Out).start(); new TWEEN.Tween(flowerCenter.scale).to({ x: 1.3, y: 1.3, z: 1.3 }, 3000).easing(TWEEN.Easing.Cubic.Out).start(); flowerSeeds.forEach((s, i) => { setTimeout(() => { new TWEEN.Tween(s.position).to({ x: s.position.x * 1.3, y: s.position.y + 0.02, z: s.position.z * 1.3 }, 1000).easing(TWEEN.Easing.Elastic.Out).start(); }, i * 50); }); new TWEEN.Tween(leftLeaf.scale).to({ x: 1.2, y: 1.2, z: 1 }, 2500).easing(TWEEN.Easing.Cubic.Out).start(); new TWEEN.Tween(rightLeaf.scale).to({ x: 1.2, y: 1.2, z: 1 }, 2500).easing(TWEEN.Easing.Cubic.Out).start(); new TWEEN.Tween(leftLeaf.position).to({ y: oLP.left.y + 0.3 }, 3000).easing(TWEEN.Easing.Cubic.Out).start(); new TWEEN.Tween(rightLeaf.position).to({ y: oLP.right.y + 0.3 }, 3000).easing(TWEEN.Easing.Cubic.Out).start(); flowerPetals.forEach((p, i) => { setTimeout(() => { new TWEEN.Tween(p.scale).to({ x: 1.2, y: 1.2, z: 1.2 }, 2000).easing(TWEEN.Easing.Elastic.Out).start(); new TWEEN.Tween(p.rotation).to({ x: 0, y: p.rotation.y, z: 0 }, 2500).easing(TWEEN.Easing.Elastic.Out).start(); new TWEEN.Tween(p.position).to({ x: p.position.x * 1.1, y: p.position.y + 0.02, z: p.position.z * 1.1 }, 2000).easing(TWEEN.Easing.Cubic.Out).start(); }, i * 30); }); new TWEEN.Tween(sunflower.scale).to({ x: targetScaleNormal.x * 1.3, y: targetScaleNormal.y * 1.3, z: targetScaleNormal.z * 1.3 }, 3500).easing(TWEEN.Easing.Cubic.Out).onComplete(() => { wI.style.opacity = '0'; setTimeout(() => { alert("花朵生长完成！心情好转！"); setHappyMood(); isGrowing = false; document.getElementById('btnMood').disabled = false; targetScaleNormal.copy(sunflower.scale); originalPetalRotations.length = 0; flowerPetals.forEach(p => originalPetalRotations.push(p.rotation.clone())); }, 500); }).start(); }

// ==================== 动画循环与事件绑定 ====================
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    if (!isHappy) {
        animateRain();
        animateClouds();
        animateStars();
    }
    if (isHappy && sunModel) { sunModel.rotation.y += 0.005; }
    renderer.render(scene, camera);
}

function bindEvents() { 
    document.getElementById('btnMood').addEventListener('click', toggleMood); 
    document.getElementById('btnWater').addEventListener('click', startWatering); 
    renderer.domElement.addEventListener('dblclick', (e) => { 
        const m = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1); 
        const r = new THREE.Raycaster(); 
        r.setFromCamera(m, camera); 
        const i = r.intersectObject(sunflower, true); 
        if (i.length > 0) { onDoubleClickSunflower(); } 
    }); 
    const lB = document.getElementById('btnLoadScene'); 
    const fI = document.getElementById('sceneFileInput'); 
    lB.addEventListener('click', () => fI.click()); 
    fI.addEventListener('change', (e) => { 
        const f = e.target.files[0]; 
        if (f) { 
            const r = new FileReader(); 
            r.onload = (e) => loadSceneFromJSON(JSON.parse(e.target.result)); 
            r.readAsText(f); 
        } 
    }); 
    document.getElementById('btnSaveScene').addEventListener('click', saveSceneToJSON); 
    document.getElementById('btnSaveImage').addEventListener('click', () => saveRenderedImage('png')); 
    window.addEventListener('resize', () => { 
        camera.aspect = window.innerWidth / window.innerHeight; 
        camera.updateProjectionMatrix(); 
        renderer.setSize(window.innerWidth, window.innerHeight); 
    }); 
    document.getElementById('btnOpenCalendar').addEventListener('click', openCalendar); 
    document.getElementById('btnCloseCalendar').addEventListener('click', closeCalendar); 
    document.getElementById('prevMonthBtn').addEventListener('click', () => { 
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1); 
        renderCalendar(); 
    }); 
    document.getElementById('nextMonthBtn').addEventListener('click', () => { 
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1); 
        renderCalendar(); 
    }); 
    document.getElementById('btnSaveDiary').addEventListener('click', saveDiary); 
    document.getElementById('btnRecordToday').addEventListener('click', recordTodayMood); 
}

// ==================== 材质、光源、相机控制函数 ====================
function initNewControls() {
    // 模块折叠功能
    document.querySelectorAll('.module-title').forEach(title => {
        title.addEventListener('click', function() {
            this.classList.toggle('collapsed');
            const controls = this.nextElementSibling;
            controls.style.display = this.classList.contains('collapsed') ? 'none' : 'flex';
        });
    });
    
    // 材质控制
    document.getElementById('materialAmbient').addEventListener('input', function() {
        materialProperties.ambient = parseFloat(this.value);
        document.getElementById('materialAmbientValue').textContent = this.value;
        applyMaterialProperties();
    });
    
    document.getElementById('materialDiffuse').addEventListener('input', function() {
        materialProperties.diffuse = parseFloat(this.value);
        document.getElementById('materialDiffuseValue').textContent = this.value;
        applyMaterialProperties();
    });
    
    document.getElementById('materialSpecular').addEventListener('input', function() {
        materialProperties.specular = parseFloat(this.value);
        document.getElementById('materialSpecularValue').textContent = this.value;
        applyMaterialProperties();
    });
    
    document.getElementById('materialShininess').addEventListener('input', function() {
        materialProperties.shininess = parseInt(this.value);
        document.getElementById('materialShininessValue').textContent = this.value;
        applyMaterialProperties();
    });
    
    document.getElementById('petalColor').addEventListener('input', function() {
        materialProperties.petalColor = parseInt(this.value.replace('#', '0x'));
        applyMaterialProperties();
    });
    
    document.getElementById('leafColor').addEventListener('input', function() {
        materialProperties.leafColor = parseInt(this.value.replace('#', '0x'));
        applyMaterialProperties();
    });
    
    document.getElementById('btnResetMaterial').addEventListener('click', function() {
        resetMaterialProperties();
    });
    
    // 光源控制
    document.getElementById('sunIntensity').addEventListener('input', function() {
        lightProperties.sunIntensity = parseFloat(this.value);
        document.getElementById('sunIntensityValue').textContent = this.value;
        applyLightProperties();
    });
    
    document.getElementById('ambientIntensity').addEventListener('input', function() {
        lightProperties.ambientIntensity = parseFloat(this.value);
        document.getElementById('ambientIntensityValue').textContent = this.value;
        applyLightProperties();
    });
    
    document.getElementById('pointLightIntensity').addEventListener('input', function() {
        lightProperties.pointLightIntensity = parseFloat(this.value);
        document.getElementById('pointLightIntensityValue').textContent = this.value;
        applyLightProperties();
    });
    
    // 太阳光位置控制
    document.getElementById('sunPositionX').addEventListener('input', function() {
        lightProperties.sunPositionX = parseFloat(this.value);
        document.getElementById('sunPositionXValue').textContent = this.value;
        applyLightProperties();
    });
    
    document.getElementById('sunPositionY').addEventListener('input', function() {
        lightProperties.sunPositionY = parseFloat(this.value);
        document.getElementById('sunPositionYValue').textContent = this.value;
        applyLightProperties();
    });
    
    document.getElementById('sunPositionZ').addEventListener('input', function() {
        lightProperties.sunPositionZ = parseFloat(this.value);
        document.getElementById('sunPositionZValue').textContent = this.value;
        applyLightProperties();
    });
    
    document.getElementById('sunColor').addEventListener('input', function() {
        lightProperties.sunColor = parseInt(this.value.replace('#', '0x'));
        applyLightProperties();
    });
    
    document.getElementById('ambientColor').addEventListener('input', function() {
        lightProperties.ambientColor = parseInt(this.value.replace('#', '0x'));
        applyLightProperties();
    });
    
    document.getElementById('shadowQuality').addEventListener('change', function() {
        lightProperties.shadowQuality = parseInt(this.value);
        applyLightProperties();
    });
    
    document.getElementById('btnResetLight').addEventListener('click', function() {
        resetLightProperties();
    });
    
    // 相机控制
    document.getElementById('cameraPositionX').addEventListener('input', function() {
        cameraProperties.positionX = parseFloat(this.value);
        document.getElementById('cameraPositionXValue').textContent = this.value;
        applyCameraProperties();
    });
    
    document.getElementById('cameraPositionY').addEventListener('input', function() {
        cameraProperties.positionY = parseFloat(this.value);
        document.getElementById('cameraPositionYValue').textContent = this.value;
        applyCameraProperties();
    });
    
    document.getElementById('cameraPositionZ').addEventListener('input', function() {
        cameraProperties.positionZ = parseFloat(this.value);
        document.getElementById('cameraPositionZValue').textContent = this.value;
        applyCameraProperties();
    });
    
    document.getElementById('cameraFOV').addEventListener('input', function() {
        cameraProperties.fov = parseInt(this.value);
        document.getElementById('cameraFOVValue').textContent = this.value + '°';
        applyCameraProperties();
    });
    
    document.getElementById('cameraMode').addEventListener('change', function() {
        cameraProperties.mode = this.value;
        applyCameraProperties();
    });
    
    document.getElementById('btnResetCamera').addEventListener('click', function() {
        resetCameraProperties();
    });
    
    document.getElementById('btnSaveCamera').addEventListener('click', function() {
        saveCameraView();
    });
    
    document.getElementById('btnLoadCamera').addEventListener('click', function() {
        loadCameraView();
    });
    
    // 保存设置
    window.addEventListener('beforeunload', saveSettings);
}

function applyMaterialProperties() {
    flowerPetals.forEach(petal => {
        if (petal.material) {
            petal.material.color.setHex(materialProperties.petalColor);
            petal.material.needsUpdate = true;
        }
    });
    
    if (leftLeaf && leftLeaf.material) {
        leftLeaf.material.color.setHex(materialProperties.leafColor);
        leftLeaf.material.needsUpdate = true;
    }
    if (rightLeaf && rightLeaf.material) {
        rightLeaf.material.color.setHex(materialProperties.leafColor);
        rightLeaf.material.needsUpdate = true;
    }
    
    if (sunModel && sunModel.material) {
        sunModel.material.color.setHex(lightProperties.sunColor);
        sunModel.material.emissive.setHex(lightProperties.sunColor);
        sunModel.material.needsUpdate = true;
    }
}

function applyLightProperties() {
    if (sunnyLight) {
        sunnyLight.position.set(
            lightProperties.sunPositionX,
            lightProperties.sunPositionY,
            lightProperties.sunPositionZ
        );
        sunnyLight.intensity = lightProperties.sunIntensity;
        sunnyLight.color.setHex(lightProperties.sunColor);
        sunnyLight.shadow.mapSize.width = lightProperties.shadowQuality;
        sunnyLight.shadow.mapSize.height = lightProperties.shadowQuality;
        sunnyLight.shadow.camera.updateProjectionMatrix();
    }
    
    if (ambientLight) {
        ambientLight.intensity = lightProperties.ambientIntensity;
        ambientLight.color.setHex(lightProperties.ambientColor);
    }
    
    if (pointLight) {
        pointLight.intensity = lightProperties.pointLightIntensity;
    }
    
    if (sunnyPointLight) {
        sunnyPointLight.color.setHex(lightProperties.sunColor);
    }
    
    if (sunModel && sunModel.material) {
        sunModel.material.color.setHex(lightProperties.sunColor);
        sunModel.material.emissive.setHex(lightProperties.sunColor);
        sunModel.material.needsUpdate = true;
    }
}

function applyCameraProperties() {
    camera.position.set(
        cameraProperties.positionX,
        cameraProperties.positionY,
        cameraProperties.positionZ
    );
    
    camera.fov = cameraProperties.fov;
    camera.updateProjectionMatrix();
    
    switch(cameraProperties.mode) {
        case 'orbit':
            controls.enabled = true;
            controls.maxPolarAngle = Math.PI / 1.8;
            break;
        case 'fixed':
            controls.enabled = false;
            break;
        case 'firstperson':
            controls.enabled = true;
            controls.maxPolarAngle = Math.PI;
            break;
    }
    
    controls.update();
}

function resetMaterialProperties() {
    materialProperties = {
        ambient: 0.2,
        diffuse: 0.8,
        specular: 0.5,
        shininess: 32,
        petalColor: 0xFFD700,
        leafColor: 0x2E7D32
    };
    
    document.getElementById('materialAmbient').value = materialProperties.ambient;
    document.getElementById('materialAmbientValue').textContent = materialProperties.ambient;
    document.getElementById('materialDiffuse').value = materialProperties.diffuse;
    document.getElementById('materialDiffuseValue').textContent = materialProperties.diffuse;
    document.getElementById('materialSpecular').value = materialProperties.specular;
    document.getElementById('materialSpecularValue').textContent = materialProperties.specular;
    document.getElementById('materialShininess').value = materialProperties.shininess;
    document.getElementById('materialShininessValue').textContent = materialProperties.shininess;
    document.getElementById('petalColor').value = '#FFD700';
    document.getElementById('leafColor').value = '#2E7D32';
    
    applyMaterialProperties();
}

function resetLightProperties() {
    lightProperties = {
        sunIntensity: 1.0,
        ambientIntensity: 0.8,
        pointLightIntensity: 0.7,
        sunPositionX: 5,
        sunPositionY: 10,
        sunPositionZ: 7,
        sunColor: 0xFFD700,
        ambientColor: 0xFFFFFF,
        shadowQuality: 512
    };
    
    document.getElementById('sunIntensity').value = lightProperties.sunIntensity;
    document.getElementById('sunIntensityValue').textContent = lightProperties.sunIntensity;
    document.getElementById('ambientIntensity').value = lightProperties.ambientIntensity;
    document.getElementById('ambientIntensityValue').textContent = lightProperties.ambientIntensity;
    document.getElementById('pointLightIntensity').value = lightProperties.pointLightIntensity;
    document.getElementById('pointLightIntensityValue').textContent = lightProperties.pointLightIntensity;
    document.getElementById('sunPositionX').value = lightProperties.sunPositionX;
    document.getElementById('sunPositionXValue').textContent = lightProperties.sunPositionX;
    document.getElementById('sunPositionY').value = lightProperties.sunPositionY;
    document.getElementById('sunPositionYValue').textContent = lightProperties.sunPositionY;
    document.getElementById('sunPositionZ').value = lightProperties.sunPositionZ;
    document.getElementById('sunPositionZValue').textContent = lightProperties.sunPositionZ;
    document.getElementById('sunColor').value = '#FFD700';
    document.getElementById('ambientColor').value = '#FFFFFF';
    document.getElementById('shadowQuality').value = lightProperties.shadowQuality;
    
    applyLightProperties();
}

function resetCameraProperties() {
    cameraProperties = {
        positionX: 0,
        positionY: 2,
        positionZ: 10,
        fov: 75,
        mode: 'orbit'
    };
    
    document.getElementById('cameraPositionX').value = cameraProperties.positionX;
    document.getElementById('cameraPositionXValue').textContent = cameraProperties.positionX;
    document.getElementById('cameraPositionY').value = cameraProperties.positionY;
    document.getElementById('cameraPositionYValue').textContent = cameraProperties.positionY;
    document.getElementById('cameraPositionZ').value = cameraProperties.positionZ;
    document.getElementById('cameraPositionZValue').textContent = cameraProperties.positionZ;
    document.getElementById('cameraFOV').value = cameraProperties.fov;
    document.getElementById('cameraFOVValue').textContent = cameraProperties.fov + '°';
    document.getElementById('cameraMode').value = cameraProperties.mode;
    
    applyCameraProperties();
}

function saveCameraView() {
    const viewName = prompt('请输入视角名称:', '视角' + (savedCameraViews.length + 1));
    if (viewName) {
        const view = {
            name: viewName,
            position: camera.position.clone(),
            rotation: camera.rotation.clone(),
            target: controls.target.clone(),
            fov: camera.fov,
            timestamp: new Date().toISOString()
        };
        savedCameraViews.push(view);
        alert(`视角 "${viewName}" 已保存！`);
        saveSettings();
    }
}

function loadCameraView() {
    if (savedCameraViews.length === 0) {
        alert('没有保存的视角！');
        return;
    }
    
    const viewList = savedCameraViews.map((view, index) => 
        `${index + 1}. ${view.name} (${new Date(view.timestamp).toLocaleDateString()})`
    ).join('\n');
    
    const choice = prompt(`选择要加载的视角 (输入数字):\n\n${viewList}`);
    const index = parseInt(choice) - 1;
    
    if (index >= 0 && index < savedCameraViews.length) {
        const view = savedCameraViews[index];
        camera.position.copy(view.position);
        camera.rotation.copy(view.rotation);
        camera.fov = view.fov;
        controls.target.copy(view.target);
        camera.updateProjectionMatrix();
        controls.update();
        
        cameraProperties.positionX = view.position.x;
        cameraProperties.positionY = view.position.y;
        cameraProperties.positionZ = view.position.z;
        cameraProperties.fov = view.fov;
        
        updateCameraUI();
        
        alert(`视角 "${view.name}" 已加载！`);
    }
}

function updateCameraUI() {
    document.getElementById('cameraPositionX').value = cameraProperties.positionX;
    document.getElementById('cameraPositionXValue').textContent = cameraProperties.positionX.toFixed(1);
    document.getElementById('cameraPositionY').value = cameraProperties.positionY;
    document.getElementById('cameraPositionYValue').textContent = cameraProperties.positionY.toFixed(1);
    document.getElementById('cameraPositionZ').value = cameraProperties.positionZ;
    document.getElementById('cameraPositionZValue').textContent = cameraProperties.positionZ.toFixed(1);
    document.getElementById('cameraFOV').value = cameraProperties.fov;
    document.getElementById('cameraFOVValue').textContent = cameraProperties.fov + '°';
}

function saveSettings() {
    const settings = {
        material: materialProperties,
        light: lightProperties,
        camera: cameraProperties,
        savedViews: savedCameraViews,
        decor: {
            potStyle: currentPotStyle,
            view: currentView
        },
        thunder: thunderProperties,
        autoThunder: isAutoThunder,
        clouds: cloudProperties,
        stars: starsProperties,
        starsEnabled: isStarsEnabled,
        items: itemObjects.map(item => ({
            id: item.userData.id,
            type: item.userData.type,
            name: item.userData.name,
            position: item.position.toArray(),
            scale: item.scale.toArray(),
            rotation: item.rotation.toArray(),
            mood: item.userData.mood,
            interactionCount: item.userData.interactionCount
        }))
    };
    localStorage.setItem('sunflowerSettings', JSON.stringify(settings));
}

function loadSavedSettings() {
    const saved = localStorage.getItem('sunflowerSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            if (settings.material) Object.assign(materialProperties, settings.material);
            if (settings.light) Object.assign(lightProperties, settings.light);
            if (settings.camera) Object.assign(cameraProperties, settings.camera);
            if (settings.savedViews) savedCameraViews = settings.savedViews;
            
            if (settings.decor) {
                currentPotStyle = settings.decor.potStyle || 'ceramic';
                currentView = settings.decor.view || 'city';
                
                updateDecorUI();
            }
            
            // 加载雷电设置
            if (settings.thunder) {
                Object.assign(thunderProperties, settings.thunder);
                updateThunderUI();
            }
            
            if (settings.autoThunder !== undefined) {
                isAutoThunder = settings.autoThunder;
                if (isAutoThunder && !isHappy) {
                    setTimeout(() => {
                        startAutoThunder();
                        document.getElementById('btnAutoThunder').textContent = "关闭自动雷电";
                        document.getElementById('btnAutoThunder').style.background = "linear-gradient(135deg, #F44336, #D32F2F)";
                        thunderIndicator.style.display = "block";
                        thunderIndicator.textContent = "雷电效果：自动模式";
                    }, 1000);
                }
            }
            
            // 加载乌云设置
            if (settings.clouds) {
                Object.assign(cloudProperties, settings.clouds);
                updateCloudUI();
            }
            
            // 加载星星设置
            if (settings.stars) {
                Object.assign(starsProperties, settings.stars);
                updateStarsUI();
            }
            
            if (settings.starsEnabled !== undefined) {
                isStarsEnabled = settings.starsEnabled;
                if (isStarsEnabled && !isHappy) {
                    setTimeout(() => {
                        document.getElementById('btnToggleStars').textContent = "关闭星星效果";
                        document.getElementById('btnToggleStars').style.background = "linear-gradient(135deg, #673AB7, #512DA8)";
                        starsIndicator.style.display = "block";
                        starsIndicator.textContent = `星星荧光：${starsProperties.count}颗`;
                        createStars();
                    }, 1000);
                }
            }
            
            // 加载物品
            if (settings.items) {
                // 先清空现有物品
                itemObjects.forEach(item => {
                    if (item.userData.animation) {
                        if (item.userData.animation.tailTween) {
                            item.userData.animation.tailTween.stop();
                        }
                        if (item.userData.animation.breatheTween) {
                            item.userData.animation.breatheTween.stop();
                        }
                        if (item.userData.animation.tongueTween) {
                            item.userData.animation.tongueTween.stop();
                        }
                        if (item.userData.animation.earTween) {
                            item.userData.animation.earTween.stop();
                        }
                    }
                    if (item.userData.light) {
                        item.remove(item.userData.light);
                    }
                    scene.remove(item);
                });
                itemObjects = [];
                
                // 重新创建物品
                settings.items.forEach(itemData => {
                    const item = addItem(itemData.type);
                    if (item) {
                        item.userData.id = itemData.id;
                        item.position.fromArray(itemData.position);
                        item.scale.fromArray(itemData.scale);
                        item.rotation.fromArray(itemData.rotation);
                        item.userData.mood = itemData.mood || 'happy';
                        item.userData.interactionCount = itemData.interactionCount || 0;
                    }
                });
            }
            
            updateMaterialUI();
            updateLightUI();
            updateCameraUI();
            
            applyMaterialProperties();
            applyLightProperties();
            applyCameraProperties();
        } catch (e) {
            console.error('加载设置失败:', e);
        }
    }
}

function updateThunderUI() {
    document.getElementById('thunderIntensity').value = thunderProperties.intensity;
    document.getElementById('thunderIntensityValue').textContent = thunderProperties.intensity;
    document.getElementById('thunderFrequency').value = thunderProperties.frequency;
    document.getElementById('thunderFrequencyValue').textContent = thunderProperties.frequency;
    document.getElementById('thunderVolume').value = thunderProperties.volume;
    document.getElementById('thunderVolumeValue').textContent = thunderProperties.volume;
}

function updateCloudUI() {
    document.getElementById('cloudCount').value = cloudProperties.count;
    document.getElementById('cloudCountValue').textContent = cloudProperties.count;
    document.getElementById('cloudSize').value = cloudProperties.size;
    document.getElementById('cloudSizeValue').textContent = cloudProperties.size.toFixed(1);
    document.getElementById('cloudSpeed').value = cloudProperties.speed;
    document.getElementById('cloudSpeedValue').textContent = cloudProperties.speed.toFixed(1);
}

function updateStarsUI() {
    document.getElementById('starsCount').value = starsProperties.count;
    document.getElementById('starsCountValue').textContent = starsProperties.count;
    document.getElementById('starsSize').value = starsProperties.size;
    document.getElementById('starsSizeValue').textContent = starsProperties.size.toFixed(1);
    document.getElementById('starsSpeed').value = starsProperties.speed;
    document.getElementById('starsSpeedValue').textContent = starsProperties.speed.toFixed(1);
    document.getElementById('starsGlow').value = starsProperties.glow;
    document.getElementById('starsGlowValue').textContent = starsProperties.glow.toFixed(1);
}

function updateDecorUI() {
    document.querySelectorAll('.decor-btn[data-type="pot"]').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.value === currentPotStyle) {
            btn.classList.add('selected');
        }
    });
    
    document.querySelectorAll('.decor-btn[data-type="view"]').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.value === currentView) {
            btn.classList.add('selected');
        }
    });
}

function updateMaterialUI() {
    document.getElementById('materialAmbient').value = materialProperties.ambient;
    document.getElementById('materialAmbientValue').textContent = materialProperties.ambient;
    document.getElementById('materialDiffuse').value = materialProperties.diffuse;
    document.getElementById('materialDiffuseValue').textContent = materialProperties.diffuse;
    document.getElementById('materialSpecular').value = materialProperties.specular;
    document.getElementById('materialSpecularValue').textContent = materialProperties.specular;
    document.getElementById('materialShininess').value = materialProperties.shininess;
    document.getElementById('materialShininessValue').textContent = materialProperties.shininess;
    document.getElementById('petalColor').value = '#' + materialProperties.petalColor.toString(16).padStart(6, '0');
    document.getElementById('leafColor').value = '#' + materialProperties.leafColor.toString(16).padStart(6, '0');
}

function updateLightUI() {
    document.getElementById('sunIntensity').value = lightProperties.sunIntensity;
    document.getElementById('sunIntensityValue').textContent = lightProperties.sunIntensity;
    document.getElementById('ambientIntensity').value = lightProperties.ambientIntensity;
    document.getElementById('ambientIntensityValue').textContent = lightProperties.ambientIntensity;
    document.getElementById('pointLightIntensity').value = lightProperties.pointLightIntensity;
    document.getElementById('pointLightIntensityValue').textContent = lightProperties.pointLightIntensity;
    document.getElementById('sunPositionX').value = lightProperties.sunPositionX;
    document.getElementById('sunPositionXValue').textContent = lightProperties.sunPositionX;
    document.getElementById('sunPositionY').value = lightProperties.sunPositionY;
    document.getElementById('sunPositionYValue').textContent = lightProperties.sunPositionY;
    document.getElementById('sunPositionZ').value = lightProperties.sunPositionZ;
    document.getElementById('sunPositionZValue').textContent = lightProperties.sunPositionZ;
    document.getElementById('sunColor').value = '#' + lightProperties.sunColor.toString(16).padStart(6, '0');
    document.getElementById('ambientColor').value = '#' + lightProperties.ambientColor.toString(16).padStart(6, '0');
    document.getElementById('shadowQuality').value = lightProperties.shadowQuality;
}

// ==================== 辅助函数与模型创建 ====================
function createWoodTexture() { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#8B4513'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#5D2906'; x.lineWidth = 2; x.globalAlpha = 0.3; for (let i = 0; i < 256; i += 4) { x.beginPath(); x.moveTo(i, 0); x.bezierCurveTo(i + 10, 50, i - 10, 150, i, 256); x.stroke(); } const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); return t; }

function createWindowSill() {
    const windowGroup = new THREE.Group();
    const screenAspect = window.innerWidth / window.innerHeight;
    let windowWidth = screenAspect > 1.5 ? 20 : (screenAspect > 1.2 ? 18 : 16);
    let windowHeight = screenAspect > 1.5 ? 12 : (screenAspect > 1.2 ? 14 : 16);
    
    const woodTexture = createWoodTexture();
    const sillMaterial = new THREE.MeshPhongMaterial({ map: woodTexture, shininess: 30 });
    
    const sillGeometry = new THREE.BoxGeometry(windowWidth, 0.4, 4);
    const sill = new THREE.Mesh(sillGeometry, sillMaterial);
    sill.position.y = -windowHeight/2 + 0.2;
    sill.receiveShadow = true;
    windowGroup.add(sill);
    const sideGeometry = new THREE.BoxGeometry(0.4, windowHeight, 4);
    const leftSide = new THREE.Mesh(sideGeometry, sillMaterial);
    leftSide.position.set(-windowWidth/2, 0, 0);
    leftSide.receiveShadow = true;
    windowGroup.add(leftSide);
    const rightSide = new THREE.Mesh(sideGeometry, sillMaterial);
    rightSide.position.set(windowWidth/2, 0, 0);
    rightSide.receiveShadow = true;
    windowGroup.add(rightSide);
    const topGeometry = new THREE.BoxGeometry(windowWidth, 0.4, 4);
    const topSill = new THREE.Mesh(topGeometry, sillMaterial);
    topSill.position.y = windowHeight/2 - 0.2;
    topSill.receiveShadow = true;
    windowGroup.add(topSill);
    
    const skyGeometry = new THREE.PlaneGeometry(windowWidth - 0.8, windowHeight - 0.8);
    const skyMaterial = new THREE.MeshBasicMaterial({ map: sunnySkyTexture });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.position.set(0, 0, -2.5);
    windowGroup.add(sky);
    
    const frameMaterial = new THREE.MeshPhongMaterial({ map: woodTexture, shininess: 50 });
    const hFrameGeo = new THREE.BoxGeometry(windowWidth - 0.4, 0.2, 0.2);
    const topFrame = new THREE.Mesh(hFrameGeo, frameMaterial);
    topFrame.position.set(0, windowHeight/2 - 0.4, -2.4);
    topFrame.receiveShadow = true;
    windowGroup.add(topFrame);
    const bottomFrame = new THREE.Mesh(hFrameGeo, frameMaterial);
    bottomFrame.position.set(0, -windowHeight/2 + 0.4, -2.4);
    bottomFrame.receiveShadow = true;
    windowGroup.add(bottomFrame);
    const vFrameGeo = new THREE.BoxGeometry(0.2, windowHeight - 0.8, 0.2);
    const midFrame = new THREE.Mesh(vFrameGeo, frameMaterial);
    midFrame.position.set(0, 0, -2.4);
    midFrame.receiveShadow = true;
    windowGroup.add(midFrame);
    
    return { group: windowGroup, width: windowWidth, height: windowHeight, skyMesh: sky };
}

function createSunflower() { 
    const sG = new THREE.Group(); 
    flowerPetals = []; 
    flowerSeeds = []; 
    const pM = new THREE.MeshPhongMaterial({ color: 0x8B4513, shininess: 10 }); 
    pot = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 1.0, 16), pM); 
    pot.position.y = 0.5; 
    pot.castShadow = true; 
    pot.receiveShadow = true; 
    sG.add(pot); 
    const sM = new THREE.MeshPhongMaterial({ color: 0x5D4037, shininess: 5 }); 
    soil = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.2, 16), sM); 
    soil.position.y = 1.0; 
    soil.receiveShadow = true; 
    sG.add(soil); 
    const stM = new THREE.MeshPhongMaterial({ color: 0x2E7D32, shininess: 20 }); 
    stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.5, 8), stM); 
    stem.position.y = 1.25; 
    stem.castShadow = true; 
    sG.add(stem); 
    const lG = new THREE.PlaneGeometry(0.6, 0.3); 
    const lM = new THREE.MeshPhongMaterial({ color: 0x2E7D32, side: THREE.DoubleSide, shininess: 30 }); 
    leftLeaf = new THREE.Mesh(lG, lM); 
    leftLeaf.position.set(-0.3, 1.5, 0.1); 
    leftLeaf.rotation.z = -Math.PI / 4; 
    leftLeaf.rotation.y = -Math.PI / 6; 
    leftLeaf.castShadow = true; 
    sG.add(leftLeaf); 
    rightLeaf = new THREE.Mesh(lG, lM); 
    rightLeaf.position.set(0.3, 1.5, -0.1); 
    rightLeaf.rotation.z = Math.PI / 4; 
    rightLeaf.rotation.y = Math.PI / 6; 
    rightLeaf.castShadow = true; 
    sG.add(rightLeaf); 
    flowerGroup = new THREE.Group(); 
    flowerGroup.position.set(0, 2.75, 0); 
    flowerGroup.rotation.x = -Math.PI / 2; 
    const cM = new THREE.MeshPhongMaterial({ color: 0x5D4037, shininess: 10 }); 
    flowerCenter = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), cM); 
    flowerCenter.castShadow = true; 
    flowerGroup.add(flowerCenter); 
    const seM = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 50 }); 
    for(let i = 0; i < 30; i++) { 
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), seM); 
        const a = Math.random() * Math.PI * 2; 
        const r = Math.random() * 0.3; 
        s.position.set(Math.cos(a) * r, Math.random() * 0.05, Math.sin(a) * r); 
        s.castShadow = true; 
        flowerGroup.add(s); 
        flowerSeeds.push(s); 
    } 
    const addPetals = (c, w, h, d, r, yO, rX) => { 
        const g = createTrianglePetalGeometry(w, h, d); 
        const m = new THREE.MeshPhongMaterial({ color: 0xFFD700, shininess: 40 }); 
        for(let i = 0; i < c; i++) { 
            const p = new THREE.Mesh(g, m); 
            const a = (i / c) * Math.PI * 2; 
            p.position.set(Math.cos(a) * r, yO, Math.sin(a) * r); 
            p.rotation.y = -a; 
            p.rotation.x = rX; 
            p.castShadow = true; 
            flowerGroup.add(p); 
            flowerPetals.push(p); 
        } 
    }; 
    addPetals(20, 0.5, 0.3, 0.05, 0.7, 0, Math.PI / 8); 
    addPetals(16, 0.4, 0.25, 0.04, 0.5, 0.02, Math.PI / 10); 
    addPetals(12, 0.3, 0.2, 0.03, 0.3, 0.04, Math.PI / 12); 
    sG.add(flowerGroup); 
    return sG; 
}
function createTrianglePetalGeometry(w, h, d) { const g = new THREE.ConeGeometry(w/2, h, 3); g.rotateX(Math.PI / 2); g.scale(1, d/h, 1); return g; }

function createSkyCanvas() {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d'); const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height); gradient.addColorStop(0, '#87CEEB'); gradient.addColorStop(0.7, '#E0F7FF'); gradient.addColorStop(1, '#FFFFFF'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.beginPath(); ctx.arc(100, 100, 30, 0, Math.PI*2); ctx.arc(140, 90, 40, 0, Math.PI*2); ctx.fill();
    return canvas;
}

function createRainySkyCanvas() {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#555566');
    gradient.addColorStop(0.7, '#9999AA');
    gradient.addColorStop(1, '#AAAABB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
}

function createRain() {
    const rainGeometry = new THREE.BufferGeometry();
    const rainCount = 1500;
    const positions = new Float32Array(rainCount * 3);
    for(let i=0; i<rainCount; i++) {
        positions[i*3] = (Math.random() - 0.5) * 20;
        positions[i*3+1] = Math.random() * 20;
        positions[i*3+2] = (Math.random() * -0.4) - 2.0; 
    }
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rainMaterial = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.1, transparent: true, opacity: 0.8 });
    const rain = new THREE.Points(rainGeometry, rainMaterial);
    rain.visible = false;
    return rain;
}

function animateRain() {
    const positions = rainSystem.geometry.attributes.position.array;
    for(let i=1; i<positions.length; i+=3) {
        positions[i] -= 0.3;
        if (positions[i] < -10) { positions[i] = 10; }
    }
    rainSystem.geometry.attributes.position.needsUpdate = true;
}

// ==================== 装饰商店功能 ====================
function initDecorControls() {
    // 花盆样式按钮
    document.querySelectorAll('.decor-btn[data-type="pot"]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.decor-btn[data-type="pot"]').forEach(b => {
                b.classList.remove('selected');
            });
            this.classList.add('selected');
            
            currentPotStyle = this.dataset.value;
            updatePotStyle();
        });
    });
    
    // 窗外景色按钮
    document.querySelectorAll('.decor-btn[data-type="view"]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.decor-btn[data-type="view"]').forEach(b => {
                b.classList.remove('selected');
            });
            this.classList.add('selected');
            
            currentView = this.dataset.value;
            updateView();
        });
    });
    
    // 重置装饰按钮
    document.getElementById('btnResetDecor').addEventListener('click', function() {
        resetDecor();
    });
}

function updatePotStyle() {
    if (!pot) return;
    
    pot.material.dispose();
    
    let newMaterial;
    switch(currentPotStyle) {
        case 'ceramic':
            newMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x8B4513, 
                shininess: 80,
                specular: 0x222222
            });
            break;
        case 'plastic':
            newMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x4CAF50, 
                shininess: 30,
                specular: 0x111111
            });
            break;
        case 'vintage':
            newMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x795548, 
                shininess: 20,
                specular: 0x111111
            });
            break;
        case 'wooden':
            const woodTexture = createWoodTexture();
            newMaterial = new THREE.MeshPhongMaterial({ 
                map: woodTexture,
                shininess: 10,
                specular: 0x111111
            });
            break;
        default:
            newMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x8B4513, 
                shininess: 10
            });
    }
    
    pot.material = newMaterial;
    pot.castShadow = true;
    pot.receiveShadow = true;
}

function updateView() {
    if (!windowSill || !windowSill.skyMesh) return;
    
    let skyTexture;
    if (isHappy) {
        skyTexture = skyTextures[currentView] || sunnySkyTexture;
    } else {
        skyTexture = rainySkyTexture;
    }
    
    windowSill.skyMesh.material.map = skyTexture;
    windowSill.skyMesh.material.needsUpdate = true;
}

function resetDecor() {
    currentPotStyle = 'ceramic';
    document.querySelectorAll('.decor-btn[data-type="pot"]').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.value === 'ceramic') {
            btn.classList.add('selected');
        }
    });
    updatePotStyle();
    
    currentView = 'city';
    document.querySelectorAll('.decor-btn[data-type="view"]').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.value === 'city') {
            btn.classList.add('selected');
        }
    });
    updateView();
}

// ==================== 场景与日历数据 ====================
function saveSceneToJSON() { 
    const sD = { 
        camera: { 
            position: camera.position.toArray(), 
            rotation: camera.rotation.toArray(), 
            controlTarget: controls.target.toArray() 
        }, 
        lights: [{ 
            type: 'DirectionalLight',
            color: sunnyLight.color.getHex(), 
            intensity: sunnyLight.intensity,
            position: sunnyLight.position.toArray()
        }, {
            type: 'PointLight', 
            color: pointLight.color.getHex(), 
            intensity: pointLight.intensity, 
            position: pointLight.position.toArray() 
        }], 
        objects: [{ 
            type: 'Sunflower', 
            position: sunflower.position.toArray(), 
            scale: sunflower.scale.toArray(), 
            rotation: sunflower.rotation.toArray() 
        }], 
        mood: { isHappy: isHappy },
        material: materialProperties,
        light: lightProperties,
        cameraSettings: cameraProperties,
        thunder: thunderProperties,
        autoThunder: isAutoThunder,
        clouds: cloudProperties,
        stars: starsProperties,
        starsEnabled: isStarsEnabled,
        decor: {
            potStyle: currentPotStyle,
            view: currentView
        },
        items: itemObjects.map(item => ({
            id: item.userData.id,
            type: item.userData.type,
            name: item.userData.name,
            position: item.position.toArray(),
            scale: item.scale.toArray(),
            rotation: item.rotation.toArray(),
            mood: item.userData.mood,
            interactionCount: item.userData.interactionCount
        }))
    }; 
    const b = new Blob([JSON.stringify(sD, null, 2)], { type: 'application/json' }); 
    const u = URL.createObjectURL(b); 
    const a = document.createElement('a'); 
    a.href = u; 
    a.download = 'scene.json'; 
    a.click(); 
    URL.revokeObjectURL(u); 
}

function loadSceneFromJSON(data) { 
    scene.remove(sunflower); 
    sunflower = createSunflower(); 
    const oD = data.objects[0]; 
    sunflower.position.fromArray(oD.position); 
    sunflower.scale.fromArray(oD.scale); 
    sunflower.rotation.fromArray(oD.rotation); 
    scene.add(sunflower); 
    targetScaleNormal.copy(sunflower.scale); 
    originalPetalRotations.length = 0; 
    flowerPetals.forEach(p => originalPetalRotations.push(p.rotation.clone())); 
    camera.position.fromArray(data.camera.position); 
    camera.rotation.fromArray(data.camera.rotation); 
    controls.target.fromArray(data.camera.controlTarget); 
    
    if (data.lights && data.lights.length > 0) {
        const sunLightData = data.lights.find(l => l.type === 'DirectionalLight');
        if (sunLightData) {
            sunnyLight.color.setHex(sunLightData.color);
            sunnyLight.intensity = sunLightData.intensity;
            sunnyLight.position.fromArray(sunLightData.position);
        }
        
        const pointLightData = data.lights.find(l => l.type === 'PointLight');
        if (pointLightData) {
            pointLight.color.setHex(pointLightData.color);
            pointLight.intensity = pointLightData.intensity;
            pointLight.position.fromArray(pointLightData.position);
        }
    }
    
    if (data.material) {
        Object.assign(materialProperties, data.material);
        updateMaterialUI();
        applyMaterialProperties();
    }
    
    if (data.light) {
        Object.assign(lightProperties, data.light);
        updateLightUI();
        applyLightProperties();
    }
    
    if (data.cameraSettings) {
        Object.assign(cameraProperties, data.cameraSettings);
        updateCameraUI();
        applyCameraProperties();
    }
    
    if (data.thunder) {
        Object.assign(thunderProperties, data.thunder);
        updateThunderUI();
    }
    
    if (data.autoThunder !== undefined) {
        isAutoThunder = data.autoThunder;
    }
    
    if (data.clouds) {
        Object.assign(cloudProperties, data.clouds);
        updateCloudUI();
    }
    
    if (data.stars) {
        Object.assign(starsProperties, data.stars);
        updateStarsUI();
    }
    
    if (data.starsEnabled !== undefined) {
        isStarsEnabled = data.starsEnabled;
    }
    
    if (data.decor) {
        currentPotStyle = data.decor.potStyle || 'ceramic';
        currentView = data.decor.view || 'city';
        
        updateDecorUI();
        updatePotStyle();
        updateView();
    }
    
    // 加载物品
    if (data.items) {
        // 先清空现有物品
        itemObjects.forEach(item => {
            if (item.userData.light) {
                item.remove(item.userData.light);
            }
            scene.remove(item);
        });
        itemObjects = [];
        
        // 重新创建物品
        data.items.forEach(itemData => {
            const item = addItem(itemData.type);
            if (item) {
                item.userData.id = itemData.id;
                item.position.fromArray(itemData.position);
                item.scale.fromArray(itemData.scale);
                item.rotation.fromArray(itemData.rotation);
                item.userData.mood = itemData.mood || 'happy';
                item.userData.interactionCount = itemData.interactionCount || 0;
            }
        });
    }
    
    if (data.mood) { 
        data.mood.isHappy ? setHappyMood() : setSadMood(); 
    } else { 
        setHappyMood(); 
    } 
}

function saveRenderedImage(format = 'png') { 
    renderer.render(scene, camera); 
    const iD = renderer.domElement.toDataURL(`image/${format}`); 
    const a = document.createElement('a'); 
    a.href = iD; 
    a.download = `rendered_scene.${format}`; 
    a.click(); 
}

function getDateKey(d) { 
    const y = d.getFullYear(); 
    const m = (d.getMonth() + 1).toString().padStart(2, '0'); 
    const day = d.getDate().toString().padStart(2, '0'); 
    return `${y}-${m}-${day}`; 
}

function openCalendar() { 
    document.getElementById('calendarModal').style.display = 'flex'; 
    currentCalendarDate = new Date(); 
    renderCalendar(); 
    selectDate(null); 
}

function closeCalendar() { 
    document.getElementById('calendarModal').style.display = 'none'; 
}

function renderCalendar() { 
    const y = currentCalendarDate.getFullYear(); 
    const m = currentCalendarDate.getMonth(); 
    document.getElementById('calendarTitle').textContent = `${y}年 ${m + 1}月`; 
    const g = document.getElementById('calendarGrid'); 
    const wC = document.getElementById('weekdayContainer'); 
    g.innerHTML = ''; 
    wC.innerHTML = ''; 
    ['日', '一', '二', '三', '四', '五', '六'].forEach(d => { 
        wC.innerHTML += `<div class="calendar-weekday">${d}</div>`; 
    }); 
    const fD = new Date(y, m, 1).getDay(); 
    const dM = new Date(y, m + 1, 0).getDate(); 
    for (let i = 0; i < fD; i++) { 
        g.innerHTML += '<div></div>'; 
    } 
    for (let i = 1; i <= dM; i++) { 
        const dE = document.createElement('div'); 
        dE.className = 'calendar-day'; 
        dE.textContent = i; 
        const t = new Date(); 
        if (i === t.getDate() && y === t.getFullYear() && m === t.getMonth()) { 
            dE.classList.add('today'); 
        } 
        const dK = getDateKey(new Date(y, m, i)); 
        if (moodData[dK]) { 
            const mD = document.createElement('div'); 
            mD.className = `mood-dot ${moodData[dK].mood}`; 
            dE.appendChild(mD); 
        } 
        dE.addEventListener('click', () => selectDate(new Date(y, m, i))); 
        g.appendChild(dE); 
    } 
}

function selectDate(d) { 
    const dDE = document.getElementById('diaryDate'); 
    const dTE = document.getElementById('diaryText'); 
    if (!d) { 
        selectedDateKey = ''; 
        dDE.textContent = '选择一天来记录吧'; 
        dTE.value = ''; 
        dTE.disabled = true; 
        document.getElementById('btnSaveDiary').disabled = true; 
        return; 
    } 
    selectedDateKey = getDateKey(d); 
    dDE.textContent = `日记 for ${selectedDateKey}`; 
    dTE.disabled = false; 
    document.getElementById('btnSaveDiary').disabled = false; 
    if (moodData[selectedDateKey]) { 
        dTE.value = moodData[selectedDateKey].note || ''; 
    } else { 
        dTE.value = ''; 
    } 
}

function saveDiary() { 
    if (!selectedDateKey) return; 
    if (!moodData[selectedDateKey]) { 
        moodData[selectedDateKey] = {}; 
    } 
    moodData[selectedDateKey].note = document.getElementById('diaryText').value; 
    saveMoodData(); 
    alert('日记已保存！'); 
}

function recordTodayMood() { 
    const tK = getDateKey(new Date()); 
    const cM = isHappy ? 'happy' : 'sad'; 
    if (!moodData[tK]) { 
        moodData[tK] = {}; 
    } 
    moodData[tK].mood = cM; 
    saveMoodData(); 
    renderCalendar(); 
    alert(`已记录今天的心情为：${isHappy ? '愉悦' : '低落'}`); 
}

function saveMoodData() { 
    localStorage.setItem('sunflowerMoodDiary', JSON.stringify(moodData)); 
}

function loadMoodData() { 
    const d = localStorage.getItem('sunflowerMoodDiary'); 
    if (d) { 
        moodData = JSON.parse(d); 
    } 
}

// ==================== 新增：物品摆件功能 ====================
function initItemControls() {
    // 物品按钮点击事件
    document.querySelectorAll('.decor-btn[data-type="item"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemType = this.dataset.value;
            addItem(itemType);
        });
    });
    
    // 物品选择器事件
    document.getElementById('itemSelector').addEventListener('change', function() {
        const itemId = this.value;
        if (itemId) {
            selectItemById(itemId);
        } else {
            deselectItem();
        }
    });
    
    // 位置控制事件
    document.getElementById('itemPositionX').addEventListener('input', function() {
        if (selectedItem) {
            selectedItem.position.x = parseFloat(this.value);
            document.getElementById('itemPositionXValue').textContent = this.value;
            updateItemInList(selectedItem);
        }
    });
    
    document.getElementById('itemPositionY').addEventListener('input', function() {
        if (selectedItem) {
            selectedItem.position.y = parseFloat(this.value);
            document.getElementById('itemPositionYValue').textContent = this.value;
            updateItemInList(selectedItem);
        }
    });
    
    document.getElementById('itemPositionZ').addEventListener('input', function() {
        if (selectedItem) {
            selectedItem.position.z = parseFloat(this.value);
            document.getElementById('itemPositionZValue').textContent = this.value;
            updateItemInList(selectedItem);
        }
    });
    
    // 缩放控制事件
    document.getElementById('itemScale').addEventListener('input', function() {
        if (selectedItem) {
            const scale = parseFloat(this.value);
            selectedItem.scale.set(scale, scale, scale);
            document.getElementById('itemScaleValue').textContent = this.value;
            updateItemInList(selectedItem);
        }
    });
    
    // 旋转控制事件
    document.getElementById('itemRotation').addEventListener('input', function() {
        if (selectedItem) {
            const rotation = parseFloat(this.value) * Math.PI / 180;
            selectedItem.rotation.y = rotation;
            document.getElementById('itemRotationValue').textContent = this.value + '°';
            updateItemInList(selectedItem);
        }
    });
    
    // 删除物品按钮
    document.getElementById('btnDeleteItem').addEventListener('click', function() {
        if (selectedItem && confirm('确定要删除这个物品吗？')) {
            deleteItem(selectedItem.userData.id);
        }
    });
    
    // 重置物品按钮
    document.getElementById('btnResetItem').addEventListener('click', function() {
        if (selectedItem) {
            resetItemPosition(selectedItem);
        }
    });
    
    // 点击场景选择物品
    renderer.domElement.addEventListener('click', function(e) {
        if (e.target === renderer.domElement) {
            const mouse = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            
            // 检查是否点击到物品
            const intersects = raycaster.intersectObjects(itemObjects.map(item => item));
            
            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                // 找到包含该对象的物品组
                let item = clickedObject;
                while (item.parent && !item.userData.isItem) {
                    item = item.parent;
                }
                
                if (item.userData.isItem) {
                    selectItem(item);
                    e.stopPropagation();
                    return;
                }
            }
            
            // 如果没有点击到物品，取消选择
            deselectItem();
        }
    });
}

function addItem(type) {
    const itemGroup = new THREE.Group();
    itemGroup.userData = {
        id: `item_${itemIdCounter++}`,
        type: type,
        name: getItemName(type),
        isItem: true
    };
    
    let itemMesh;
    
    switch(type) {
        case 'stones':
            itemMesh = createStones();
            break;
        case 'painting':
            itemMesh = createPainting();
            break;
        case 'books':
            itemMesh = createBooks();
            break;
        case 'plant':
            itemMesh = createPlant();
            break;
        case 'lamp':
            itemMesh = createLamp();
            break;
        default:
            return;
    }
    
    itemGroup.add(itemMesh);
    
    // 设置初始位置（在窗台上方）
    const windowSillBottomY = -windowSill.height / 2 + 0.2;
    itemGroup.position.set(
        (Math.random() - 0.5) * 4,
        windowSillBottomY + 0.5, // 提高初始位置
        0.5 + Math.random() * 0.5
    );
    
    // 设置更大的默认缩放
    itemGroup.scale.set(1.3, 1.3, 1.3);
    
    // 随机旋转
    itemGroup.rotation.y = Math.random() * Math.PI * 2;
    
    scene.add(itemGroup);
    itemObjects.push(itemGroup);
    
    // 更新物品选择器
    updateItemSelector();
    
    // 自动选中新添加的物品
    selectItem(itemGroup);
    
    // 保存设置
    saveSettings();
    
    return itemGroup;
}

function createStones() {
    const group = new THREE.Group();
    
    for(let i = 0; i < 8; i++) { // 更多石子
        const stoneGeometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 10, 10); // 更大更圆滑
        const stoneMaterial = new THREE.MeshPhongMaterial({ 
            color: Math.random() > 0.5 ? 0x808080 : 0xA0522D,
            shininess: 15
        });
        const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
        
        stone.position.set(
            (Math.random() - 0.5) * 0.8,
            i * 0.04,
            (Math.random() - 0.5) * 0.4
        );
        
        stone.castShadow = true;
        stone.receiveShadow = true;
        group.add(stone);
    }
    
    return group;
}

function createPainting() {
    const group = new THREE.Group();
    
    // 画框 - 更大
    const frameGeometry = new THREE.BoxGeometry(1.2, 0.9, 0.08);
    const frameMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513,
        shininess: 30
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.castShadow = true;
    group.add(frame);
    
    // 画布
    const canvasGeometry = new THREE.PlaneGeometry(1.1, 0.8);
    
    // 创建画布纹理
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 随机生成一幅抽象画
    ctx.fillStyle = getRandomColor();
    ctx.fillRect(0, 0, 512, 512);
    
    // 添加一些随机形状
    for(let i = 0; i < 15; i++) {
        ctx.fillStyle = getRandomColor();
        ctx.beginPath();
        ctx.arc(
            Math.random() * 512,
            Math.random() * 512,
            Math.random() * 60 + 30,
            0, Math.PI * 2
        );
        ctx.fill();
    }
    
    // 添加画作标题
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('抽象艺术', 256, 50);
    
    const canvasTexture = new THREE.CanvasTexture(canvas);
    const canvasMaterial = new THREE.MeshBasicMaterial({ map: canvasTexture });
    const painting = new THREE.Mesh(canvasGeometry, canvasMaterial);
    painting.position.z = 0.04;
    group.add(painting);
    
    return group;
}

function createBooks() {
    const group = new THREE.Group();
    
    const bookColors = [
        0x4682B4, 0xDC143C, 0x32CD32, 0xFFD700, 
        0x8A2BE2, 0xFF6347, 0x20B2AA, 0x9370DB
    ];
    
    // 创建几本堆叠的书 - 更大
    for(let i = 0; i < 6; i++) {
        const width = 0.22 + Math.random() * 0.08;
        const height = 0.03;
        const depth = 0.3 + Math.random() * 0.08;
        
        const bookGeometry = new THREE.BoxGeometry(width, height, depth);
        const bookMaterial = new THREE.MeshPhongMaterial({ 
            color: bookColors[Math.floor(Math.random() * bookColors.length)],
            shininess: 30
        });
        
        const book = new THREE.Mesh(bookGeometry, bookMaterial);
        book.position.set(
            (Math.random() - 0.5) * 0.15,
            i * 0.04,
            (Math.random() - 0.5) * 0.08
        );
        
        book.rotation.y = (Math.random() - 0.5) * 0.5;
        book.castShadow = true;
        group.add(book);
        
        // 添加书脊文字
        if (Math.random() > 0.5) {
            const spineGeometry = new THREE.PlaneGeometry(0.02, depth * 0.8);
            const spineMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x000000
            });
            const spine = new THREE.Mesh(spineGeometry, spineMaterial);
            spine.position.set(-width/2 + 0.01, i * 0.04, 0);
            spine.rotation.y = Math.PI / 2;
            group.add(spine);
        }
    }
    
    return group;
}

function createPlant() {
    const group = new THREE.Group();
    
    // 花盆 - 更大
    const potGeometry = new THREE.CylinderGeometry(0.12, 0.09, 0.15, 16);
    const potMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513,
        shininess: 30
    });
    const pot = new THREE.Mesh(potGeometry, potMaterial);
    pot.castShadow = true;
    pot.receiveShadow = true;
    group.add(pot);
    
    // 土壤
    const soilGeometry = new THREE.CylinderGeometry(0.11, 0.11, 0.03, 16);
    const soilMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513,
        shininess: 10
    });
    const soil = new THREE.Mesh(soilGeometry, soilMaterial);
    soil.position.y = 0.09;
    soil.castShadow = true;
    group.add(soil);
    
    // 主茎
    const stemGeometry = new THREE.CylinderGeometry(0.008, 0.012, 0.35, 8);
    const stemMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2E7D32,
        shininess: 20
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.225;
    stem.castShadow = true;
    group.add(stem);
    
    // 分枝
    const branchGeometry = new THREE.CylinderGeometry(0.005, 0.008, 0.15, 8);
    
    for(let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const branch = new THREE.Mesh(branchGeometry, stemMaterial);
        branch.position.set(
            Math.cos(angle) * 0.05,
            0.3 + i * 0.03,
            Math.sin(angle) * 0.05
        );
        branch.rotation.z = Math.PI / 4;
        branch.rotation.y = angle;
        branch.castShadow = true;
        group.add(branch);
        
        // 叶子
        const leafGeometry = new THREE.PlaneGeometry(0.08, 0.15);
        const leafMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2E7D32,
            side: THREE.DoubleSide,
            shininess: 30
        });
        
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.position.set(
            Math.cos(angle) * 0.1,
            0.35 + i * 0.03,
            Math.sin(angle) * 0.1
        );
        leaf.rotation.z = Math.PI / 4;
        leaf.rotation.y = angle;
        leaf.castShadow = true;
        group.add(leaf);
    }
    
    // 花朵
    const flowerGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const flowerMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFF69B4,
        shininess: 40
    });
    const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
    flower.position.y = 0.45;
    flower.castShadow = true;
    group.add(flower);
    
    // 花瓣
    const petalGeometry = new THREE.ConeGeometry(0.02, 0.05, 5);
    const petalMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFF1493,
        shininess: 50
    });
    
    for(let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        petal.position.set(
            Math.cos(angle) * 0.04,
            0.45,
            Math.sin(angle) * 0.04
        );
        petal.rotation.x = Math.PI / 2;
        petal.rotation.y = angle;
        petal.castShadow = true;
        group.add(petal);
    }
    
    return group;
}

function createLamp() {
    const group = new THREE.Group();
    
    // 灯座 - 更大
    const baseGeometry = new THREE.CylinderGeometry(0.09, 0.12, 0.08, 16);
    const baseMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x808080,
        shininess: 50
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    
    // 灯杆
    const poleGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8);
    const pole = new THREE.Mesh(poleGeometry, baseMaterial);
    pole.position.y = 0.24;
    pole.castShadow = true;
    group.add(pole);
    
    // 灯罩
    const shadeGeometry = new THREE.ConeGeometry(0.12, 0.18, 16);
    const shadeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xF5F5F5,
        shininess: 10,
        transparent: true,
        opacity: 0.7
    });
    const shade = new THREE.Mesh(shadeGeometry, shadeMaterial);
    shade.position.y = 0.45;
    shade.rotation.x = Math.PI;
    shade.castShadow = true;
    group.add(shade);
    
    // 灯泡
    const bulbGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const bulbMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFFF00,
        emissive: 0xFFFF00,
        emissiveIntensity: 0.5
    });
    const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.position.y = 0.37;
    group.add(bulb);
    
    // 灯罩装饰线
    const decorationGeometry = new THREE.TorusGeometry(0.11, 0.005, 8, 16);
    const decorationMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x808080,
        shininess: 30
    });
    
    for(let i = 0; i < 3; i++) {
        const decoration = new THREE.Mesh(decorationGeometry, decorationMaterial);
        decoration.position.y = 0.45 - i * 0.04;
        decoration.rotation.x = Math.PI / 2;
        group.add(decoration);
    }
    
    // 添加点光源
    const lampLight = new THREE.PointLight(0xFFFF00, 0.8, 3);
    lampLight.position.set(0, 0.37, 0);
    group.add(lampLight);
    
    group.userData.light = lampLight;
    group.userData.isOn = true;
    
    return group;
}

function getItemName(type) {
    const names = {
        stones: '小石子',
        painting: '壁画',
        books: '书籍堆',
        plant: '盆栽',
        lamp: '台灯'
    };
    return names[type] || '物品';
}

function getRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
        '#BB8FCE', '#85C1E9', '#82E0AA', '#F8C471'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function selectItem(item) {
    // 取消之前选中的物品
    if (selectedItem) {
        deselectItem();
    }
    
    selectedItem = item;
    
    // 更新UI
    updateItemSelector();
    document.getElementById('itemSelector').value = item.userData.id;
    
    // 显示物品控制模块
    document.getElementById('itemControlsModule').style.display = 'block';
    
    // 更新控制滑块的值
    document.getElementById('itemPositionX').value = item.position.x;
    document.getElementById('itemPositionXValue').textContent = item.position.x.toFixed(1);
    
    document.getElementById('itemPositionY').value = item.position.y;
    document.getElementById('itemPositionYValue').textContent = item.position.y.toFixed(1);
    
    document.getElementById('itemPositionZ').value = item.position.z;
    document.getElementById('itemPositionZValue').textContent = item.position.z.toFixed(1);
    
    document.getElementById('itemScale').value = item.scale.x;
    document.getElementById('itemScaleValue').textContent = item.scale.x.toFixed(1);
    
    const rotationDeg = item.rotation.y * 180 / Math.PI;
    document.getElementById('itemRotation').value = rotationDeg;
    document.getElementById('itemRotationValue').textContent = rotationDeg.toFixed(0) + '°';
}

function selectItemById(itemId) {
    const item = itemObjects.find(item => item.userData.id === itemId);
    if (item) {
        selectItem(item);
    }
}

function deselectItem() {
    selectedItem = null;
    document.getElementById('itemSelector').value = '';
}

function updateItemSelector() {
    const selector = document.getElementById('itemSelector');
    selector.innerHTML = '<option value="">-- 选择一个物品 --</option>';
    
    itemObjects.forEach(item => {
        const option = document.createElement('option');
        option.value = item.userData.id;
        option.textContent = `${item.userData.name} (${item.userData.id})`;
        selector.appendChild(option);
    });
}

function updateItemInList(item) {
    // 更新物品在列表中的显示（如果需要）
    saveSettings();
}

function deleteItem(itemId) {
    const index = itemObjects.findIndex(item => item.userData.id === itemId);
    if (index !== -1) {
        const item = itemObjects[index];
        
        // 如果是台灯，移除光源
        if (item.userData.light) {
            item.remove(item.userData.light);
        }
        
        // 从场景中移除
        scene.remove(item);
        
        // 从列表中移除
        itemObjects.splice(index, 1);
        
        // 更新选择器
        updateItemSelector();
        
        // 取消选择
        deselectItem();
        
        // 保存设置
        saveSettings();
    }
}

function resetItemPosition(item) {
    // 重置物品到默认位置
    const windowSillBottomY = -windowSill.height / 2 + 0.2;
    item.position.set(
        (Math.random() - 0.5) * 4,
        windowSillBottomY + 0.5,
        0.5 + Math.random() * 0.5
    );
    
    // 重置缩放
    item.scale.set(1.3, 1.3, 1.3);
    
    item.rotation.y = Math.random() * Math.PI * 2;
    
    // 更新UI
    if (selectedItem === item) {
        document.getElementById('itemPositionX').value = item.position.x;
        document.getElementById('itemPositionXValue').textContent = item.position.x.toFixed(1);
        
        document.getElementById('itemPositionY').value = item.position.y;
        document.getElementById('itemPositionYValue').textContent = item.position.y.toFixed(1);
        
        document.getElementById('itemPositionZ').value = item.position.z;
        document.getElementById('itemPositionZValue').textContent = item.position.z.toFixed(1);
        
        document.getElementById('itemScale').value = item.scale.x;
        document.getElementById('itemScaleValue').textContent = item.scale.x.toFixed(1);
        
        const rotationDeg = item.rotation.y * 180 / Math.PI;
        document.getElementById('itemRotation').value = rotationDeg;
        document.getElementById('itemRotationValue').textContent = rotationDeg.toFixed(0) + '°';
    }
    
    saveSettings();
}

// ==================== 启动 ====================
init();