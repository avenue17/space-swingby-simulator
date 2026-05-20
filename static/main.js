import * as THREE from "https://esm.sh/three@0.164.1";
import { OrbitControls } from "https://esm.sh/three@0.164.1/examples/jsm/controls/OrbitControls.js";

const G = 0.9;
const DT = 0.12;
const DURATION = 800;
const SOFTENING = 8;
const MAX_POINTS = 3200;

const viewport = document.getElementById("viewport");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    8000
);

camera.position.set(900, 900, 900);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
});
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
controls.maxDistance = 2800;
controls.update();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock();

const ui = {
    angle: document.getElementById("angle"),
    speed: document.getElementById("speed"),
    startTime: document.getElementById("start-time"),
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
    pause: document.getElementById("pause"),
    info: document.getElementById("info"),
    chart: document.getElementById("speed-chart"),
    speed1x: document.getElementById("speed-1x"),
    speed2x: document.getElementById("speed-2x"),
    speed5x: document.getElementById("speed-5x"),
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
        this.orbitRadius = data.orbitRadius;
        this.angularSpeed = data.angularSpeed;
        this.initialAngle = data.initialAngle;
        this.influenceRadius = data.influenceRadius;
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

const defaultPlanets = [
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

const planets = defaultPlanets.map((data) => new Planet(data));

let selectedPlanet = planets.find((planet) => planet.name === "Earth");

let predictedLine = null;
let predictedStartMarker = null;
let predictedEndMarker = null;

let actualLine = null;
let actualMarker = null;
let hoverRing = null;

let predictedResult = null;
let actualState = null;

let playScale = 0;
let accumulator = 0;

const ambient = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambient);

const sunLight = new THREE.PointLight(0xffffff, 3.0, 4000);
sunLight.position.set(0, 300, 0);
scene.add(sunLight);

const helperGrid = new THREE.GridHelper(2400, 48, 0x1d3557, 0x0b1a2d);
helperGrid.material.transparent = true;
helperGrid.material.opacity = 0.18;
scene.add(helperGrid);

function makeCircle(radius, color, opacity, y = 0, segments = 240) {
    const points = [];

    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(
            new THREE.Vector3(
                radius * Math.cos(angle),
                y,
                radius * Math.sin(angle)
            )
        );
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

        const geometry = new THREE.SphereGeometry(planet.visualRadius, 40, 40);
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

function updatePlanetPositions(t) {
    for (const planet of planets) {
        const position = planet.positionAt(t);

        if (planet.mesh) {
            planet.mesh.position.copy(position);
        }

        if (planet.influenceMesh) {
            planet.influenceMesh.position.copy(position);
        }
    }
}

function startPosition(t) {
    const earth = planets.find((planet) => planet.name === "Earth");
    const earthPosition = earth.positionAt(t);
    const direction = earthPosition.clone().normalize();

    return earthPosition.clone().add(direction.multiplyScalar(earth.radius * 2.8));
}

function initialVelocity() {
    const angleDegrees = Number(ui.angle.value);
    const initialSpeed = Number(ui.speed.value);
    const angle = (angleDegrees * Math.PI) / 180;

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

function advanceState(position, velocity, t, dt) {
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
    const startTime = Number(ui.startTime.value);
    const initialSpeed = Number(ui.speed.value);

    let position = startPosition(startTime);
    let velocity = initialVelocity();

    const positions = [position.clone()];
    const speeds = [velocity.length()];
    const times = [startTime];

    let collision = null;
    const steps = Math.floor(DURATION / DT);
    const interval = Math.max(1, Math.floor(steps / MAX_POINTS));

    for (let i = 0; i < steps; i++) {
        const t = startTime + i * DT;
        advanceState(position, velocity, t, DT);

        if (i % interval === 0) {
            positions.push(position.clone());
            speeds.push(velocity.length());
            times.push(t);
        }

        collision = checkCollision(position, t);

        if (collision) {
            break;
        }

        if (position.length() > 2400) {
            break;
        }
    }

    predictedResult = {
        positions,
        speeds,
        times,
        collision,
        initialSpeed
    };

    updatePlanetPositions(startTime);
    drawPredictedTrajectory();
    drawChart(predictedResult.speeds, "predicted speed");
    updateInfo();
}

function disposeObject(object) {
    if (!object) {
        return;
    }

    scene.remove(object);

    if (object.geometry) {
        object.geometry.dispose();
    }

    if (object.material) {
        object.material.dispose();
    }
}

function drawPredictedTrajectory() {
    disposeObject(predictedLine);
    disposeObject(predictedStartMarker);
    disposeObject(predictedEndMarker);

    const geometry = new THREE.BufferGeometry().setFromPoints(predictedResult.positions);
    const material = new THREE.LineBasicMaterial({
        color: 0x58f0ff,
        transparent: true,
        opacity: 0.55
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

function resetActualObjects() {
    disposeObject(actualLine);
    disposeObject(actualMarker);
    actualLine = null;
    actualMarker = null;
}

function startActualFlight() {
    const startTime = Number(ui.startTime.value);
    const position = startPosition(startTime);
    const velocity = initialVelocity();

    actualState = {
        active: true,
        paused: false,
        startTime,
        elapsed: 0,
        position,
        velocity,
        positions: [position.clone()],
        speeds: [velocity.length()],
        times: [startTime],
        collision: null
    };

    playScale = 1;
    accumulator = 0;

    resetActualObjects();
    drawActualTrajectory();
    drawChart(actualState.speeds, "actual speed");
    updateInfo();
}

function pauseActualFlight() {
    if (actualState) {
        actualState.paused = true;
    }

    playScale = 0;
}

function resumeActualFlight(scale) {
    if (!actualState) {
        startActualFlight();
    }

    actualState.paused = false;
    actualState.active = true;
    playScale = scale;
}

function stepActualFlight(dt) {
    if (!actualState || !actualState.active || actualState.paused) {
        return;
    }

    const currentTime = actualState.startTime + actualState.elapsed;

    advanceState(actualState.position, actualState.velocity, currentTime, dt);
    actualState.elapsed += dt;

    const nextTime = actualState.startTime + actualState.elapsed;
    actualState.positions.push(actualState.position.clone());
    actualState.speeds.push(actualState.velocity.length());
    actualState.times.push(nextTime);

    actualState.collision = checkCollision(actualState.position, nextTime);

    if (actualState.collision) {
        actualState.active = false;
        actualState.paused = true;
        playScale = 0;
    }

    if (actualState.position.length() > 2400 || actualState.elapsed >= DURATION) {
        actualState.active = false;
        actualState.paused = true;
        playScale = 0;
    }

    updatePlanetPositions(nextTime);
    drawActualTrajectory();
    drawChart(actualState.speeds, "actual speed");
    updateInfo();
}

function rebuildActualUntil(targetElapsed) {
    if (!actualState) {
        return;
    }

    const startTime = actualState.startTime;
    const position = startPosition(startTime);
    const velocity = initialVelocity();

    actualState.position = position;
    actualState.velocity = velocity;
    actualState.elapsed = 0;
    actualState.positions = [position.clone()];
    actualState.speeds = [velocity.length()];
    actualState.times = [startTime];
    actualState.collision = null;
    actualState.active = true;
    actualState.paused = true;

    let remaining = Math.max(0, targetElapsed);

    while (remaining > 0) {
        const step = Math.min(DT, remaining);
        const currentTime = actualState.startTime + actualState.elapsed;

        advanceState(actualState.position, actualState.velocity, currentTime, step);
        actualState.elapsed += step;

        const nextTime = actualState.startTime + actualState.elapsed;
        actualState.positions.push(actualState.position.clone());
        actualState.speeds.push(actualState.velocity.length());
        actualState.times.push(nextTime);

        actualState.collision = checkCollision(actualState.position, nextTime);

        if (actualState.collision) {
            actualState.active = false;
            break;
        }

        remaining -= step;
    }

    updatePlanetPositions(actualState.startTime + actualState.elapsed);
    drawActualTrajectory();
    drawChart(actualState.speeds, "actual speed");
    updateInfo();
}

function drawActualTrajectory() {
    disposeObject(actualLine);
    disposeObject(actualMarker);

    const geometry = new THREE.BufferGeometry().setFromPoints(actualState.positions);
    const material = new THREE.LineBasicMaterial({
        color: 0xffd84d,
        transparent: true,
        opacity: 1.0
    });

    actualLine = new THREE.Line(geometry, material);
    scene.add(actualLine);

    actualMarker = new THREE.Mesh(
        new THREE.SphereGeometry(11, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd84d })
    );
    actualMarker.position.copy(actualState.position);
    scene.add(actualMarker);
}

function updateInfo() {
    if (!predictedResult) {
        return;
    }

    const predictedSpeeds = predictedResult.speeds;
    const predictedFinalSpeed = predictedSpeeds[predictedSpeeds.length - 1];
    const predictedMaxSpeed = Math.max(...predictedSpeeds);
    const predictedSpeedGain = predictedFinalSpeed - predictedResult.initialSpeed;

    let closestName = "";
    let closestDistance = Infinity;

    for (let i = 0; i < predictedResult.positions.length; i++) {
        const position = predictedResult.positions[i];
        const t = predictedResult.times[i];

        for (const planet of planets) {
            const distance = planet.positionAt(t).distanceTo(position);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestName = planet.name;
            }
        }
    }

    let actualText = "아직 발사 안 됨";

    if (actualState) {
        const actualSpeed = actualState.velocity.length();
        const actualMaxSpeed = Math.max(...actualState.speeds);
        const actualStatus = actualState.collision
            ? `충돌: ${actualState.collision}`
            : actualState.active && !actualState.paused
                ? "비행 중"
                : actualState.paused
                    ? "일시정지"
                    : "종료";

        actualText =
            `실제 비행 시간: ${actualState.elapsed.toFixed(2)}
실제 현재 속도: ${actualSpeed.toFixed(2)}
실제 최대 속도: ${actualMaxSpeed.toFixed(2)}
실제 상태: ${actualStatus}`;
    }

    ui.info.textContent =
        `[예상 궤적]
예상 초기 속도: ${predictedResult.initialSpeed.toFixed(2)}
예상 최종 속도: ${predictedFinalSpeed.toFixed(2)}
예상 최대 속도: ${predictedMaxSpeed.toFixed(2)}
예상 속도 변화량: ${predictedSpeedGain.toFixed(2)}
예상 최소 접근 천체: ${closestName}
예상 최소 접근 거리: ${closestDistance.toFixed(2)}
예상 충돌 여부: ${predictedResult.collision ?? "없음"}

[실제 궤적]
${actualText}

청록색: 예상 궤적
노란색: 실제 궤적`;
}

function drawChart(speeds, label) {
    const canvas = ui.chart;
    const context = canvas.getContext("2d");

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(0, 0, 0, 0.35)";
    context.fillRect(0, 0, width, height);

    const minSpeed = Math.min(...speeds);
    const maxSpeed = Math.max(...speeds);
    const range = Math.max(maxSpeed - minSpeed, 1);

    context.strokeStyle = label.includes("actual") ? "#ffd84d" : "#58f0ff";
    context.lineWidth = 2;
    context.beginPath();

    for (let i = 0; i < speeds.length; i++) {
        const x = speeds.length === 1 ? 0 : (i / (speeds.length - 1)) * width;
        const y = height - ((speeds[i] - minSpeed) / range * (height - 24) + 12);

        if (i === 0) {
            context.moveTo(x, y);
        } else {
            context.lineTo(x, y);
        }
    }

    context.stroke();

    context.fillStyle = "white";
    context.font = "12px Arial";
    context.fillText(label, 10, 18);
}

function updateUIValues() {
    ui.angleValue.textContent = ui.angle.value;
    ui.speedValue.textContent = ui.speed.value;
    ui.timeValue.textContent = ui.startTime.value;
    ui.massValue.textContent = Number(ui.massScale.value).toFixed(1);
    ui.radiusValue.textContent = Number(ui.radiusScale.value).toFixed(1);
}

function loadSelectedPlanet() {
    ui.selectedPlanet.textContent = `선택된 행성: ${selectedPlanet.name}`;
    ui.massScale.value = selectedPlanet.massScale;
    ui.radiusScale.value = selectedPlanet.radiusScale;
    updateUIValues();
}

function focusPlanet(planet) {
    const position = planet.positionAt(Number(ui.startTime.value));
    controls.target.copy(position);

    const offset = new THREE.Vector3(140, 140, 140);
    camera.position.copy(position.clone().add(offset));
    camera.lookAt(position);
    controls.update();
}

function resetCamera() {
    controls.target.set(0, 0, 0);
    camera.position.set(900, 900, 900);
    camera.lookAt(0, 0, 0);
    controls.update();
}

function clearActualAndRecomputePredicted() {
    actualState = null;
    playScale = 0;
    accumulator = 0;
    resetActualObjects();
    computePredictedTrajectory();
}

function moveBack(seconds) {
    if (actualState) {
        const targetElapsed = Math.max(0, actualState.elapsed - seconds);
        rebuildActualUntil(targetElapsed);
        playScale = 0;
        return;
    }

    const next = Math.max(0, Math.min(900, Number(ui.startTime.value) - seconds));
    ui.startTime.value = next.toFixed(0);
    updateUIValues();
    computePredictedTrajectory();
}

function handleHover(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(
        planets.map((planet) => planet.mesh),
        false
    );

    for (const planet of planets) {
        if (planet.mesh) {
            planet.mesh.scale.set(1, 1, 1);
        }
    }

    if (hits.length > 0) {
        const planet = hits[0].object.userData.planet;
        const position = planet.positionAt(Number(ui.startTime.value));

        hits[0].object.scale.set(1.45, 1.45, 1.45);
        hoverRing.visible = true;
        hoverRing.position.copy(position);
        hoverRing.scale.setScalar(Math.max(0.8, planet.visualRadius / 12));
        renderer.domElement.style.cursor = "pointer";
    } else {
        hoverRing.visible = false;
        renderer.domElement.style.cursor = "default";
    }
}

function handleClick(event) {
    if (event.target !== renderer.domElement) {
        return;
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(
        planets.map((planet) => planet.mesh),
        false
    );

    if (hits.length > 0) {
        selectedPlanet = hits[0].object.userData.planet;
        loadSelectedPlanet();
        focusPlanet(selectedPlanet);
    }
}

for (const input of [ui.angle, ui.speed, ui.startTime]) {
    input.addEventListener("input", () => {
        updateUIValues();
        clearActualAndRecomputePredicted();
    });
}

ui.massScale.addEventListener("input", updateUIValues);
ui.radiusScale.addEventListener("input", updateUIValues);

ui.savePlanet.addEventListener("click", () => {
    selectedPlanet.massScale = Number(ui.massScale.value);
    selectedPlanet.radiusScale = Number(ui.radiusScale.value);

    const oldGeometry = selectedPlanet.mesh.geometry;
    selectedPlanet.mesh.geometry = new THREE.SphereGeometry(
        selectedPlanet.visualRadius,
        40,
        40
    );
    oldGeometry.dispose();

    clearActualAndRecomputePredicted();
});

ui.resetPlanets.addEventListener("click", () => {
    for (const planet of planets) {
        planet.reset();
    }

    selectedPlanet = planets.find((planet) => planet.name === "Earth");
    loadSelectedPlanet();
    resetCamera();
    clearActualAndRecomputePredicted();
});

ui.launch.addEventListener("click", () => {
    startActualFlight();
});

ui.pause.addEventListener("click", () => {
    pauseActualFlight();
});

ui.speed1x.addEventListener("click", () => {
    resumeActualFlight(1);
});

ui.speed2x.addEventListener("click", () => {
    resumeActualFlight(2);
});

ui.speed5x.addEventListener("click", () => {
    resumeActualFlight(5);
});

ui.back1.addEventListener("click", () => {
    moveBack(1);
});

ui.back5.addEventListener("click", () => {
    moveBack(5);
});

ui.toggleLeft.addEventListener("click", () => {
    ui.leftPanel.classList.toggle("collapsed");
    ui.toggleLeft.classList.toggle("collapsed");

    if (ui.leftPanel.classList.contains("collapsed")) {
        ui.toggleLeft.textContent = "›";
    } else {
        ui.toggleLeft.textContent = "☰";
    }
});

ui.toggleRight.addEventListener("click", () => {
    ui.rightPanel.classList.toggle("collapsed");
    ui.toggleRight.classList.toggle("collapsed");

    if (ui.rightPanel.classList.contains("collapsed")) {
        ui.toggleRight.textContent = "‹";
    } else {
        ui.toggleRight.textContent = "☷";
    }
});

window.addEventListener("mousemove", handleHover);
window.addEventListener("click", handleClick);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    const delta = clock.getDelta();

    if (actualState && actualState.active && !actualState.paused && playScale > 0) {
        accumulator += delta * playScale;

        while (accumulator >= DT) {
            stepActualFlight(DT);
            accumulator -= DT;
        }
    }

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

makeStars();
buildPlanetObjects();
updateUIValues();
loadSelectedPlanet();
computePredictedTrajectory();
resetCamera();
animate();