// static/main.js - Three.js 기반 3D 태양계 스윙바이 시뮬레이터의 물리 계산, 렌더링, UI 이벤트 처리

import * as THREE from "https://esm.sh/three@0.164.1";
import { OrbitControls } from "https://esm.sh/three@0.164.1/examples/jsm/controls/OrbitControls.js";

const G = 0.9;
const DT = 0.08;
const PREDICT_DT = 0.18;
const DURATION = 900;
const SOFTENING = 8;
const MAX_POINTS = 3500;
const TIME_FLOW = 25;

const viewport = document.getElementById("viewport");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x02030a, 0.00022);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    8000
);

camera.position.set(900, 900, 900);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 1);
renderer.domElement.style.display = "block";
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 80;
controls.maxDistance = 3000;
controls.update();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock();

const ui = {
    angle: document.getElementById("angle"),
    speed: document.getElementById("speed"),
    startTime: document.getElementById("start-time"),
    systemMode: document.getElementById("system-mode"),
    dateInput: document.getElementById("date-input"),
    angleValue: document.getElementById("angle-value"),
    speedValue: document.getElementById("speed-value"),
    timeValue: document.getElementById("time-value"),
    selectedPlanet: document.getElementById("selected-planet"),
    massScale: document.getElementById("mass-scale"),
    radiusScale: document.getElementById("radius-scale"),
    massValue: document.getElementById("mass-value"),
    radiusValue: document.getElementById("radius-value"),
    savePlanet: document.getElementById("save-planet"),
    resetPlanets: document.getElementById("reset-planets"),
    launch: document.getElementById("launch"),
    play: document.getElementById("play"),
    pause: document.getElementById("pause"),
    resetFlight: document.getElementById("reset-flight"),
    info: document.getElementById("info"),
    chart: document.getElementById("speed-chart"),
    chartModal: document.getElementById("chart-modal"),
    closeChart: document.getElementById("close-chart"),
    bigChart: document.getElementById("big-speed-chart"),
    speed05x: document.getElementById("speed-05x"),
    speed1x: document.getElementById("speed-1x"),
    speed2x: document.getElementById("speed-2x"),
    speed5x: document.getElementById("speed-5x"),
    cameraLock: document.getElementById("camera-lock"),
    back1: document.getElementById("back-1"),
    back5: document.getElementById("back-5"),
    leftPanel: document.getElementById("left-panel"),
    rightPanel: document.getElementById("right-panel"),
    toggleLeft: document.getElementById("toggle-left"),
    toggleRight: document.getElementById("toggle-right")
};

class Planet {
    constructor(data) {
        this.name = data.name;
        this.baseMass = data.mass;
        this.baseRadius = data.radius;
        this.baseInfluenceRadius = data.influenceRadius;
        this.orbitRadius = data.orbitRadius;
        this.angularSpeed = data.angularSpeed;
        this.initialAngle = data.initialAngle;
        this.color = data.color;
        this.massScale = 1;
        this.radiusScale = 1;
        this.mesh = null;
        this.influenceMesh = null;
        this.orbitMesh = null;
    }

    get mass() {
        return this.baseMass * this.massScale;
    }

    get radius() {
        return this.baseRadius * this.radiusScale;
    }

    get influenceRadius() {
        return this.baseInfluenceRadius * Math.sqrt(this.massScale);
    }

    get visualRadius() {
        if (this.name === "Sun") return 32;
        if (this.name === "Jupiter") return 18;
        if (this.name === "Saturn") return 15;
        if (this.name === "Uranus") return 13;
        if (this.name === "Neptune") return 13;
        if (this.name === "Earth") return 12;
        if (this.name === "Venus") return 11;
        if (this.name === "Mars") return 10;
        return 8;
    }

    get visualScaledRadius() {
        return this.visualRadius * this.radiusScale;
    }

    positionAt(t) {
        if (this.orbitRadius === 0) {
            return new THREE.Vector3(0, 0, 0);
        }

        const angle = this.angularSpeed * t + this.initialAngle;

        return new THREE.Vector3(
            this.orbitRadius * Math.cos(angle),
            0,
            this.orbitRadius * Math.sin(angle)
        );
    }

    reset() {
        this.massScale = 1;
        this.radiusScale = 1;
    }
}

const customPlanetData = [
    { name: "Sun", mass: 12000, radius: 28, orbitRadius: 0, angularSpeed: 0, initialAngle: 0, influenceRadius: 135, color: 0xffcc33 },
    { name: "Mercury", mass: 90, radius: 5, orbitRadius: 80, angularSpeed: 0.045, initialAngle: 0.4, influenceRadius: 24, color: 0x999999 },
    { name: "Venus", mass: 210, radius: 8, orbitRadius: 125, angularSpeed: 0.032, initialAngle: 1.1, influenceRadius: 38, color: 0xffa64d },
    { name: "Earth", mass: 280, radius: 9, orbitRadius: 180, angularSpeed: 0.024, initialAngle: 2.0, influenceRadius: 52, color: 0x3a7bff },
    { name: "Mars", mass: 170, radius: 7, orbitRadius: 250, angularSpeed: 0.018, initialAngle: 2.8, influenceRadius: 45, color: 0xff5533 },
    { name: "Ceres", mass: 75, radius: 5, orbitRadius: 315, angularSpeed: 0.014, initialAngle: 3.3, influenceRadius: 28, color: 0xb0a090 },
    { name: "Jupiter", mass: 1300, radius: 20, orbitRadius: 420, angularSpeed: 0.010, initialAngle: 4.0, influenceRadius: 112, color: 0xd6a36a },
    { name: "Saturn", mass: 950, radius: 17, orbitRadius: 560, angularSpeed: 0.007, initialAngle: 5.0, influenceRadius: 102, color: 0xe6d28a },
    { name: "Uranus", mass: 620, radius: 14, orbitRadius: 710, angularSpeed: 0.005, initialAngle: 5.7, influenceRadius: 88, color: 0x7fd4d9 },
    { name: "Neptune", mass: 660, radius: 14, orbitRadius: 850, angularSpeed: 0.004, initialAngle: 0.9, influenceRadius: 90, color: 0x4169e1 },
    { name: "Pluto", mass: 45, radius: 4, orbitRadius: 980, angularSpeed: 0.003, initialAngle: 1.7, influenceRadius: 24, color: 0xc9b18a }
];

const realScaledPlanetData = [
    { name: "Sun", mass: 333000 * 280 * 0.015, radius: 28, orbitRadius: 0, angularSpeed: 0, initialAngle: 0, influenceRadius: 160, color: 0xffcc33, periodDays: 0, phaseAtEpoch: 0 },
    { name: "Mercury", mass: 0.055 * 280, radius: 5, orbitRadius: 70, angularSpeed: 0, initialAngle: 0, influenceRadius: 20, color: 0x999999, periodDays: 87.969, phaseAtEpoch: 4.40 },
    { name: "Venus", mass: 0.815 * 280, radius: 8, orbitRadius: 130, angularSpeed: 0, initialAngle: 0, influenceRadius: 36, color: 0xffa64d, periodDays: 224.701, phaseAtEpoch: 3.18 },
    { name: "Earth", mass: 280, radius: 9, orbitRadius: 180, angularSpeed: 0, initialAngle: 0, influenceRadius: 52, color: 0x3a7bff, periodDays: 365.256, phaseAtEpoch: 1.75 },
    { name: "Mars", mass: 0.107 * 280, radius: 7, orbitRadius: 275, angularSpeed: 0, initialAngle: 0, influenceRadius: 42, color: 0xff5533, periodDays: 686.980, phaseAtEpoch: 6.20 },
    { name: "Ceres", mass: 0.03 * 280, radius: 5, orbitRadius: 385, angularSpeed: 0, initialAngle: 0, influenceRadius: 24, color: 0xb0a090, periodDays: 1680.0, phaseAtEpoch: 2.20 },
    { name: "Jupiter", mass: 317.8 * 280, radius: 20, orbitRadius: 560, angularSpeed: 0, initialAngle: 0, influenceRadius: 130, color: 0xd6a36a, periodDays: 4332.59, phaseAtEpoch: 0.60 },
    { name: "Saturn", mass: 95.2 * 280, radius: 17, orbitRadius: 760, angularSpeed: 0, initialAngle: 0, influenceRadius: 115, color: 0xe6d28a, periodDays: 10759.22, phaseAtEpoch: 5.80 },
    { name: "Uranus", mass: 14.5 * 280, radius: 14, orbitRadius: 970, angularSpeed: 0, initialAngle: 0, influenceRadius: 95, color: 0x7fd4d9, periodDays: 30688.5, phaseAtEpoch: 1.10 },
    { name: "Neptune", mass: 17.1 * 280, radius: 14, orbitRadius: 1180, angularSpeed: 0, initialAngle: 0, influenceRadius: 98, color: 0x4169e1, periodDays: 60182.0, phaseAtEpoch: 5.35 }
];

let planets = [];
let selectedPlanet = null;

let predictedLine = null;
let predictedStartMarker = null;
let predictedEndMarker = null;

let actualLine = null;
let actualMarker = null;
let hoverRing = null;

let predictedResult = null;
let actualState = null;

let simTime = Number(ui.startTime.value);
let running = false;
let playScale = 1;
let accumulator = 0;
let lastChartSpeeds = [];
let lastChartLabel = "speed";

let cameraLocked = false;
let cameraLockOffset = new THREE.Vector3(240, 220, 240);

const ambient = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambient);

const sunLight = new THREE.PointLight(0xffffff, 3.0, 4000);
sunLight.position.set(0, 300, 0);
scene.add(sunLight);

const helperGrid = new THREE.GridHelper(2600, 52, 0x1d3557, 0x0b1a2d);
helperGrid.material.transparent = true;
helperGrid.material.opacity = 0.18;
scene.add(helperGrid);

function cloneData(data) {
    return data.map((item) => ({ ...item }));
}

function daysFromJ2000(dateString) {
    const selected = new Date(`${dateString}T12:00:00Z`);
    const j2000 = new Date("2000-01-01T12:00:00Z");
    return (selected - j2000) / (1000 * 60 * 60 * 24);
}

function makePlanetDataByMode() {
    if (ui.systemMode.value === "custom") {
        return cloneData(customPlanetData);
    }

    const days = daysFromJ2000(ui.dateInput.value);
    const data = cloneData(realScaledPlanetData);

    for (const planet of data) {
        if (planet.orbitRadius === 0) {
            planet.angularSpeed = 0;
            planet.initialAngle = 0;
            continue;
        }

        const anglePerDay = (2 * Math.PI) / planet.periodDays;
        planet.angularSpeed = anglePerDay * TIME_FLOW;
        planet.initialAngle = planet.phaseAtEpoch + anglePerDay * days;
    }

    return data;
}

function makeCircle(radius, color, opacity, y = 0, segments = 240) {
    const points = [];

    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
            radius * Math.cos(angle),
            y,
            radius * Math.sin(angle)
        ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity
    });

    return new THREE.Line(geometry, material);
}

function makeStars() {
    const count = 1800;
    const positions = [];

    for (let i = 0; i < count; i++) {
        const r = 2200 + Math.random() * 2200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions.push(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.6,
        transparent: true,
        opacity: 0.72
    });

    scene.add(new THREE.Points(geometry, material));
}

function buildPlanetObjects() {
    for (const planet of planets) {
        if (planet.orbitRadius > 0) {
            planet.orbitMesh = makeCircle(planet.orbitRadius, 0x888888, 0.34, 0, 260);
            scene.add(planet.orbitMesh);
        }

        const geometry = new THREE.SphereGeometry(planet.visualScaledRadius, 40, 40);
        const material = new THREE.MeshStandardMaterial({
            color: planet.color,
            emissive: planet.name === "Sun" ? planet.color : 0x000000,
            emissiveIntensity: planet.name === "Sun" ? 1.1 : 0.08,
            roughness: 0.75,
            metalness: 0.05
        });

        planet.mesh = new THREE.Mesh(geometry, material);
        planet.mesh.userData.planet = planet;
        scene.add(planet.mesh);

        planet.influenceMesh = makeCircle(planet.influenceRadius, 0x4da3ff, 0.30, 2.0, 180);
        scene.add(planet.influenceMesh);
    }

    hoverRing = makeCircle(22, 0xffffff, 0.9, 3.0, 120);
    hoverRing.visible = false;
    scene.add(hoverRing);
}

function disposeObject(object) {
    if (!object) return;

    scene.remove(object);

    if (object.geometry) object.geometry.dispose();

    if (object.material) {
        if (Array.isArray(object.material)) {
            for (const material of object.material) material.dispose();
        } else {
            object.material.dispose();
        }
    }
}

function clearPlanetObjects() {
    for (const planet of planets) {
        disposeObject(planet.mesh);
        disposeObject(planet.influenceMesh);
        disposeObject(planet.orbitMesh);
    }

    disposeObject(hoverRing);
    hoverRing = null;
    planets = [];
}

function resetActualObjects() {
    disposeObject(actualLine);
    disposeObject(actualMarker);
    actualLine = null;
    actualMarker = null;
}

function resetPredictedObjects() {
    disposeObject(predictedLine);
    disposeObject(predictedStartMarker);
    disposeObject(predictedEndMarker);
    predictedLine = null;
    predictedStartMarker = null;
    predictedEndMarker = null;
}

function rebuildSolarSystem() {
    running = false;
    actualState = null;
    accumulator = 0;

    resetActualObjects();
    resetPredictedObjects();
    clearPlanetObjects();

    planets = makePlanetDataByMode().map((item) => new Planet(item));
    selectedPlanet = planets.find((planet) => planet.name === "Earth") || planets[0];

    buildPlanetObjects();
    loadSelectedPlanet();

    simTime = Number(ui.startTime.value);
    updatePlanetPositions(simTime);
    computePredictedTrajectory();
    resetCamera();
}

function updatePlanetPositions(t) {
    for (const planet of planets) {
        const position = planet.positionAt(t);

        if (planet.mesh) planet.mesh.position.copy(position);
        if (planet.influenceMesh) planet.influenceMesh.position.copy(position);
    }
}

function startPosition(t) {
    const earth = planets.find((planet) => planet.name === "Earth");

    if (!earth) {
        return new THREE.Vector3(-200, 0, 0);
    }

    const earthPosition = earth.positionAt(t);
    const direction = earthPosition.clone().normalize();

    const safeDistance = Math.max(
        earth.radius * 2.8,
        earth.visualScaledRadius * 2.2,
        35
    );

    return earthPosition.clone().add(direction.multiplyScalar(safeDistance));
}

function initialVelocity() {
    const angleDegrees = Number(ui.angle.value);
    const initialSpeed = Number(ui.speed.value);
    const angle = angleDegrees * Math.PI / 180;

    return new THREE.Vector3(
        initialSpeed * Math.cos(angle),
        0,
        initialSpeed * Math.sin(angle)
    );
}

function totalAcceleration(position, t) {
    const acceleration = new THREE.Vector3(0, 0, 0);

    for (const planet of planets) {
        const planetPosition = planet.positionAt(t);
        const direction = planetPosition.clone().sub(position);
        const distance = Math.max(direction.length(), SOFTENING);
        const scale = G * planet.mass / (distance * distance * distance);

        acceleration.add(direction.multiplyScalar(scale));
    }

    return acceleration;
}

function advance(position, velocity, t, dt) {
    const acceleration = totalAcceleration(position, t);
    velocity.add(acceleration.multiplyScalar(dt));
    position.add(velocity.clone().multiplyScalar(dt));
}

function checkCollision(position, t) {
    for (const planet of planets) {
        const distance = planet.positionAt(t).distanceTo(position);

        if (distance < planet.radius) {
            return planet.name;
        }
    }

    return null;
}

function computePredictedTrajectory() {
    const launchTime = Number(ui.startTime.value);
    const initialSpeed = Number(ui.speed.value);

    let position = startPosition(launchTime);
    let velocity = initialVelocity();

    const positions = [position.clone()];
    const speeds = [velocity.length()];
    const times = [launchTime];

    let collision = null;
    const steps = Math.floor(DURATION / PREDICT_DT);
    const interval = Math.max(1, Math.floor(steps / MAX_POINTS));

    for (let i = 0; i < steps; i++) {
        const t = launchTime + i * PREDICT_DT;

        advance(position, velocity, t, PREDICT_DT);

        if (i % interval === 0) {
            positions.push(position.clone());
            speeds.push(velocity.length());
            times.push(t);
        }

        collision = checkCollision(position, t);
        if (collision) break;
        if (position.length() > 2600) break;
    }

    predictedResult = {
        positions,
        speeds,
        times,
        collision,
        initialSpeed
    };

    updatePlanetPositions(simTime);
    drawPredictedTrajectory();
    drawChart(predictedResult.speeds, "predicted speed");
    updateInfo();
}

function drawPredictedTrajectory() {
    resetPredictedObjects();

    const geometry = new THREE.BufferGeometry().setFromPoints(predictedResult.positions);
    const material = new THREE.LineBasicMaterial({
        color: 0x58f0ff,
        transparent: true,
        opacity: 0.5
    });

    predictedLine = new THREE.Line(geometry, material);
    scene.add(predictedLine);

    predictedStartMarker = new THREE.Mesh(
        new THREE.SphereGeometry(7, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0x00ff66 })
    );
    predictedStartMarker.position.copy(predictedResult.positions[0]);
    scene.add(predictedStartMarker);

    predictedEndMarker = new THREE.Mesh(
        new THREE.SphereGeometry(8, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xff3333 })
    );
    predictedEndMarker.position.copy(predictedResult.positions[predictedResult.positions.length - 1]);
    scene.add(predictedEndMarker);
}

function launchActual() {
    simTime = Number(ui.startTime.value);

    const position = startPosition(simTime);
    const velocity = initialVelocity();

    actualState = {
        active: true,
        paused: false,
        time: simTime,
        position,
        velocity,
        positions: [position.clone()],
        speeds: [velocity.length()],
        collision: null
    };

    running = true;
    playScale = 1;
    accumulator = 0;

    resetActualObjects();
    drawActualTrajectory();
    drawChart(actualState.speeds, "actual speed");
    updateInfo();
}

function pauseActual() {
    running = false;

    if (actualState) {
        actualState.paused = true;
    }

    updateInfo();
}

function playActual() {
    if (!actualState) {
        launchActual();
        return;
    }

    running = true;
    actualState.paused = false;
    updateInfo();
}

function resumeActual(scale) {
    if (!actualState) {
        launchActual();
    }

    running = true;
    playScale = scale;
    actualState.paused = false;
    updateInfo();
}

function stepActual(dt) {
    if (!actualState || !actualState.active || actualState.paused) return;

    advance(actualState.position, actualState.velocity, actualState.time, dt);
    actualState.time += dt;
    simTime = actualState.time;

    actualState.positions.push(actualState.position.clone());
    actualState.speeds.push(actualState.velocity.length());

    actualState.collision = checkCollision(actualState.position, actualState.time);

    if (actualState.collision) {
        actualState.active = false;
        actualState.paused = true;
        running = false;
    }

    if (actualState.position.length() > 2600 || actualState.time - Number(ui.startTime.value) > DURATION) {
        actualState.active = false;
        actualState.paused = true;
        running = false;
    }

    updatePlanetPositions(simTime);
    drawActualTrajectory();
    drawChart(actualState.speeds, "actual speed");
    updateInfo();
}

function drawActualTrajectory() {
    resetActualObjects();

    const geometry = new THREE.BufferGeometry().setFromPoints(actualState.positions);
    const material = new THREE.LineBasicMaterial({
        color: 0xffd84d,
        transparent: true,
        opacity: 1.0
    });

    actualLine = new THREE.Line(geometry, material);
    scene.add(actualLine);

    actualMarker = new THREE.Mesh(
        new THREE.SphereGeometry(12, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd84d })
    );
    actualMarker.position.copy(actualState.position);
    scene.add(actualMarker);
}

function updateInfo() {
    if (!predictedResult) return;

    const predictedSpeeds = predictedResult.speeds;
    const predictedFinalSpeed = predictedSpeeds[predictedSpeeds.length - 1];
    const predictedMaxSpeed = Math.max(...predictedSpeeds);
    const predictedSpeedGain = predictedFinalSpeed - predictedResult.initialSpeed;

    let closestName = "";
    let closestDistance = Infinity;
    let closestInfluenceRadius = 0;
    let insideInfluenceName = null;

    for (let i = 0; i < predictedResult.positions.length; i++) {
        const position = predictedResult.positions[i];
        const t = predictedResult.times[i];

        for (const planet of planets) {
            const distance = planet.positionAt(t).distanceTo(position);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestName = planet.name;
                closestInfluenceRadius = planet.influenceRadius;
            }

            if (!insideInfluenceName && distance <= planet.influenceRadius) {
                insideInfluenceName = planet.name;
            }
        }
    }

    let actualText = "아직 발사 안 됨";

    if (actualState) {
        const actualSpeed = actualState.velocity.length();
        const actualMaxSpeed = Math.max(...actualState.speeds);
        const status = actualState.collision
            ? `충돌: ${actualState.collision}`
            : actualState.active && running
                ? "비행 중"
                : actualState.paused
                    ? "멈춤"
                    : "종료";

        actualText =
            `실제 시간: ${actualState.time.toFixed(2)}
실제 현재 속도: ${actualSpeed.toFixed(2)}
실제 최대 속도: ${actualMaxSpeed.toFixed(2)}
실제 상태: ${status}`;
    }

    ui.info.textContent =
        `[태양계 설정]
모드: ${ui.systemMode.value === "real" ? "Real Scaled Solar System" : "Custom Solar System"}
기준 날짜: ${ui.dateInput.value}
시점 고정: ${cameraLocked ? "ON" : "OFF"}

[예상 궤적]
예상 초기 속도: ${predictedResult.initialSpeed.toFixed(2)}
예상 최종 속도: ${predictedFinalSpeed.toFixed(2)}
예상 최대 속도: ${predictedMaxSpeed.toFixed(2)}
예상 속도 변화량: ${predictedSpeedGain.toFixed(2)}
예상 최소 접근 천체: ${closestName}
예상 최소 접근 거리: ${closestDistance.toFixed(2)}
최소 접근 천체 중력권 반지름: ${closestInfluenceRadius.toFixed(2)}
예상 중력권 진입: ${insideInfluenceName ?? "없음"}
예상 충돌 여부: ${predictedResult.collision ?? "없음"}

[실제 궤적]
${actualText}

현재 태양계 시간: ${simTime.toFixed(2)}
청록색: 예상 궤적
노란색: 실제 궤적
파란색 원: 중력권`;
}

function drawChart(speeds, label, targetCanvas = ui.chart) {
    if (targetCanvas === ui.chart) {
        lastChartSpeeds = [...speeds];
        lastChartLabel = label;
    }

    const canvas = targetCanvas;
    const context = canvas.getContext("2d");

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    context.clearRect(0, 0, width, height);

    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(88, 240, 255, 0.12)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.35)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    if (!speeds || speeds.length === 0) {
        context.fillStyle = "white";
        context.font = "13px Arial";
        context.fillText("no speed data", 14, 24);
        return;
    }

    const minSpeed = Math.min(...speeds);
    const maxSpeed = Math.max(...speeds);
    const range = Math.max(maxSpeed - minSpeed, 1);

    context.strokeStyle = label.includes("actual") ? "#ffd84d" : "#58f0ff";
    context.lineWidth = targetCanvas === ui.bigChart ? 3 : 2;
    context.beginPath();

    for (let i = 0; i < speeds.length; i++) {
        const x = speeds.length === 1 ? 0 : (i / (speeds.length - 1)) * width;
        const y = height - ((speeds[i] - minSpeed) / range * (height - 40) + 20);

        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
    }

    context.stroke();

    context.fillStyle = "rgba(255,255,255,0.9)";
    context.font = targetCanvas === ui.bigChart ? "16px Arial" : "12px Arial";
    context.fillText(label, 14, 24);

    context.fillStyle = "rgba(255,255,255,0.65)";
    context.font = targetCanvas === ui.bigChart ? "13px Arial" : "11px Arial";
    context.fillText(`min ${minSpeed.toFixed(2)}   max ${maxSpeed.toFixed(2)}`, 14, 44);
}

function updateUIValues() {
    ui.angleValue.textContent = ui.angle.value;
    ui.speedValue.textContent = ui.speed.value;
    ui.timeValue.textContent = ui.startTime.value;
    ui.massValue.textContent = Number(ui.massScale.value).toFixed(1);
    ui.radiusValue.textContent = Number(ui.radiusScale.value).toFixed(1);
}

function loadSelectedPlanet() {
    if (!selectedPlanet) return;

    ui.selectedPlanet.textContent = `선택된 행성: ${selectedPlanet.name}`;
    ui.massScale.value = selectedPlanet.massScale;
    ui.radiusScale.value = selectedPlanet.radiusScale;
    updateUIValues();
}

function updatePlanetVisualGeometry(planet) {
    if (!planet) return;

    if (planet.mesh) {
        const oldGeometry = planet.mesh.geometry;
        planet.mesh.geometry = new THREE.SphereGeometry(planet.visualScaledRadius, 40, 40);
        oldGeometry.dispose();
    }

    if (planet.influenceMesh) {
        const oldGeometry = planet.influenceMesh.geometry;
        planet.influenceMesh.geometry = makeCircle(planet.influenceRadius, 0x4da3ff, 0.30, 2.0, 180).geometry;
        oldGeometry.dispose();
    }
}

function focusPlanet(planet) {
    cameraLocked = false;
    updateCameraLockButton();

    const position = planet.positionAt(simTime);
    controls.target.copy(position);

    const offset = new THREE.Vector3(140, 140, 140);
    camera.position.copy(position.clone().add(offset));
    camera.lookAt(position);
    controls.update();
}

function resetCamera() {
    cameraLocked = false;
    updateCameraLockButton();

    controls.target.set(0, 0, 0);
    camera.position.set(900, 900, 900);
    camera.lookAt(0, 0, 0);
    controls.update();
}

function getCameraLockTarget() {
    if (actualState) {
        return actualState.position.clone();
    }

    const earth = planets.find((planet) => planet.name === "Earth");
    if (earth) {
        return earth.positionAt(simTime);
    }

    return new THREE.Vector3(0, 0, 0);
}

function updateCameraLockButton() {
    ui.cameraLock.textContent = cameraLocked ? "시점 고정 ON" : "시점 고정 OFF";
}

function toggleCameraLock() {
    cameraLocked = !cameraLocked;

    if (cameraLocked) {
        const target = getCameraLockTarget();
        cameraLockOffset.copy(camera.position.clone().sub(controls.target));

        if (cameraLockOffset.length() < 80) {
            cameraLockOffset.set(240, 220, 240);
        }

        controls.target.copy(target);
        camera.position.copy(target.clone().add(cameraLockOffset));
        camera.lookAt(target);
    }

    updateCameraLockButton();
    updateInfo();
}

function applyCameraLock() {
    if (!cameraLocked) return;

    const target = getCameraLockTarget();
    controls.target.copy(target);
    camera.position.copy(target.clone().add(cameraLockOffset));
    camera.lookAt(target);
}

function clearActual() {
    running = false;
    actualState = null;
    accumulator = 0;
    resetActualObjects();
    updatePlanetPositions(simTime);

    if (predictedResult) {
        drawChart(predictedResult.speeds, "predicted speed");
    }

    updateInfo();
}

function resetFlight() {
    simTime = Number(ui.startTime.value);
    clearActual();
    updatePlanetPositions(simTime);
    computePredictedTrajectory();
}

function resetToSliderTime() {
    simTime = Number(ui.startTime.value);
    clearActual();
    updatePlanetPositions(simTime);
    computePredictedTrajectory();
}

function moveBack(seconds) {
    simTime = Math.max(0, simTime - seconds);
    ui.startTime.value = simTime.toFixed(0);
    resetToSliderTime();
}

function handleHover(event) {
    mouse.x = event.clientX / window.innerWidth * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(planets.map((planet) => planet.mesh), false);

    for (const planet of planets) {
        if (planet.mesh) planet.mesh.scale.set(1, 1, 1);
    }

    if (hits.length > 0) {
        const planet = hits[0].object.userData.planet;
        const position = planet.positionAt(simTime);

        hits[0].object.scale.set(1.45, 1.45, 1.45);
        hoverRing.visible = true;
        hoverRing.position.copy(position);
        hoverRing.scale.setScalar(Math.max(0.8, planet.visualScaledRadius / 12));
        renderer.domElement.style.cursor = "pointer";
    } else if (hoverRing) {
        hoverRing.visible = false;
        renderer.domElement.style.cursor = "default";
    }
}

function handleClick(event) {
    if (event.target !== renderer.domElement) return;

    mouse.x = event.clientX / window.innerWidth * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(planets.map((planet) => planet.mesh), false);

    if (hits.length > 0) {
        selectedPlanet = hits[0].object.userData.planet;
        loadSelectedPlanet();
        focusPlanet(selectedPlanet);
    }
}

for (const input of [ui.angle, ui.speed]) {
    input.addEventListener("input", () => {
        updateUIValues();
        clearActual();
        computePredictedTrajectory();
    });
}

ui.startTime.addEventListener("input", () => {
    updateUIValues();
    resetToSliderTime();
});

ui.systemMode.addEventListener("change", () => {
    rebuildSolarSystem();
});

ui.dateInput.addEventListener("change", () => {
    if (ui.systemMode.value === "real") {
        rebuildSolarSystem();
    }
});

ui.massScale.addEventListener("input", updateUIValues);
ui.radiusScale.addEventListener("input", updateUIValues);

ui.savePlanet.addEventListener("click", () => {
    if (!selectedPlanet) return;

    selectedPlanet.massScale = Number(ui.massScale.value);
    selectedPlanet.radiusScale = Number(ui.radiusScale.value);

    updatePlanetVisualGeometry(selectedPlanet);
    resetToSliderTime();
});

ui.resetPlanets.addEventListener("click", () => {
    rebuildSolarSystem();
});

ui.launch.addEventListener("click", launchActual);
ui.play.addEventListener("click", playActual);
ui.pause.addEventListener("click", pauseActual);
ui.resetFlight.addEventListener("click", resetFlight);

ui.speed05x.addEventListener("click", () => resumeActual(0.5));
ui.speed1x.addEventListener("click", () => resumeActual(1));
ui.speed2x.addEventListener("click", () => resumeActual(2));
ui.speed5x.addEventListener("click", () => resumeActual(5));

ui.cameraLock.addEventListener("click", toggleCameraLock);

ui.back1.addEventListener("click", () => moveBack(1));
ui.back5.addEventListener("click", () => moveBack(5));

ui.chart.addEventListener("click", () => {
    ui.chartModal.classList.remove("hidden");
    drawChart(
        lastChartSpeeds.length ? lastChartSpeeds : [0],
        lastChartLabel,
        ui.bigChart
    );
});

ui.closeChart.addEventListener("click", () => {
    ui.chartModal.classList.add("hidden");
});

ui.chartModal.addEventListener("click", (event) => {
    if (event.target === ui.chartModal) {
        ui.chartModal.classList.add("hidden");
    }
});

ui.toggleLeft.addEventListener("click", () => {
    const collapsed = ui.leftPanel.classList.toggle("collapsed");
    ui.toggleLeft.classList.toggle("collapsed", collapsed);
    ui.toggleLeft.textContent = collapsed ? "›" : "☰";
});

ui.toggleRight.addEventListener("click", () => {
    const collapsed = ui.rightPanel.classList.toggle("collapsed");
    ui.toggleRight.classList.toggle("collapsed", collapsed);
    ui.toggleRight.textContent = collapsed ? "‹" : "☷";
});

window.addEventListener("mousemove", handleHover);
window.addEventListener("click", handleClick);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (lastChartSpeeds.length > 0) {
        drawChart(lastChartSpeeds, lastChartLabel, ui.chart);
    }
});

function animate() {
    const delta = clock.getDelta();

    if (running && actualState && actualState.active && !actualState.paused) {
        accumulator += delta * playScale * TIME_FLOW;

        while (accumulator >= DT) {
            stepActual(DT);
            accumulator -= DT;
        }
    }

    updatePlanetPositions(simTime);

    if (actualState && actualMarker) {
        actualMarker.position.copy(actualState.position);
    }

    applyCameraLock();

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

makeStars();
updateUIValues();
updateCameraLockButton();
rebuildSolarSystem();
animate();