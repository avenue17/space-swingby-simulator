import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const G = 0.9;
const DT = 0.18;
const DURATION = 220;
const SOFTENING = 8;
const MAX_POINTS = 900;

const viewport = document.getElementById("viewport");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
);

camera.position.set(0, 760, 0.1);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 80;
controls.maxDistance = 1800;

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
    info: document.getElementById("info"),
    chart: document.getElementById("speed-chart"),
    pause: document.getElementById("pause"),
    speed1x: document.getElementById("speed-1x"),
    speed2x: document.getElementById("speed-2x"),
    speed5x: document.getElementById("speed-5x"),
    back1: document.getElementById("back-1"),
    back5: document.getElementById("back-5")
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
    { name: "Sun", mass: 12000, radius: 28, orbitRadius: 0, angularSpeed: 0, initialAngle: 0, influenceRadius: 130, color: 0xffcc33 },
    { name: "Mercury", mass: 90, radius: 5, orbitRadius: 80, angularSpeed: 0.045, initialAngle: 0.4, influenceRadius: 24, color: 0x999999 },
    { name: "Venus", mass: 210, radius: 8, orbitRadius: 125, angularSpeed: 0.032, initialAngle: 1.1, influenceRadius: 38, color: 0xffa64d },
    { name: "Earth", mass: 280, radius: 9, orbitRadius: 180, angularSpeed: 0.024, initialAngle: 2.0, influenceRadius: 50, color: 0x3a7bff },
    { name: "Mars", mass: 170, radius: 7, orbitRadius: 250, angularSpeed: 0.018, initialAngle: 2.8, influenceRadius: 45, color: 0xff5533 },
    { name: "Jupiter", mass: 1300, radius: 20, orbitRadius: 390, angularSpeed: 0.010, initialAngle: 4.0, influenceRadius: 105, color: 0xd6a36a },
    { name: "Saturn", mass: 950, radius: 17, orbitRadius: 520, angularSpeed: 0.007, initialAngle: 5.0, influenceRadius: 95, color: 0xe6d28a }
];

const planets = defaultPlanets.map(data => new Planet(data));
let selectedPlanet = planets.find(planet => planet.name === "Earth");
let trajectoryLine = null;
let startMarker = null;
let endMarker = null;
let hoverRing = null;
let currentResult = null;
let playScale = 0;
let playAccumulator = 0;

const ambient = new THREE.AmbientLight(0xffffff, 0.38);
scene.add(ambient);

const sunLight = new THREE.PointLight(0xffffff, 2.4, 2500);
sunLight.position.set(0, 150, 0);
scene.add(sunLight);

function makeCircle(radius, color, opacity, y = 0, segments = 192) {
    const points = [];

    for (let i = 0; i <= segments; i++) {
        const angle = i / segments * Math.PI * 2;
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
    const count = 1000;
    const positions = [];

    for (let i = 0; i < count; i++) {
        const r = 1600 + Math.random() * 1200;
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
        size: 1.3,
        transparent: true,
        opacity: 0.65
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

function visualRadiusOf(planet) {
    if (planet.name === "Sun") {
        return 16;
    }

    if (planet.name === "Jupiter") {
        return 8;
    }

    if (planet.name === "Saturn") {
        return 7;
    }

    return 4.5;
}

function buildPlanetObjects() {
    for (const planet of planets) {
        if (planet.orbitRadius > 0) {
            planet.orbitMesh = makeCircle(planet.orbitRadius, 0x777777, 0.28, 0, 220);
            scene.add(planet.orbitMesh);
        }

        const geometry = new THREE.SphereGeometry(visualRadiusOf(planet), 36, 36);
        const material = new THREE.MeshStandardMaterial({
            color: planet.color,
            emissive: planet.name === "Sun" ? planet.color : 0x000000,
            emissiveIntensity: planet.name === "Sun" ? 0.9 : 0.04,
            roughness: 0.8,
            metalness: 0.05
        });

        planet.mesh = new THREE.Mesh(geometry, material);
        planet.mesh.userData.planet = planet;
        scene.add(planet.mesh);

        planet.influenceMesh = makeCircle(planet.influenceRadius, 0x4da3ff, 0.26, 1.0, 160);
        scene.add(planet.influenceMesh);
    }

    hoverRing = makeCircle(16, 0xffffff, 0.85, 1.5, 96);
    hoverRing.visible = false;
    scene.add(hoverRing);
}

function updatePlanetPositions(t) {
    for (const planet of planets) {
        const position = planet.positionAt(t);
        planet.mesh.position.copy(position);
        planet.influenceMesh.position.copy(position);
    }
}

function startPosition(t) {
    const earth = planets.find(planet => planet.name === "Earth");
    const earthPosition = earth.positionAt(t);
    const direction = earthPosition.clone().normalize();

    return earthPosition.clone().add(
        direction.multiplyScalar(earth.radius * 2.5)
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

function simulate() {
    const angleDegrees = Number(ui.angle.value);
    const initialSpeed = Number(ui.speed.value);
    const startTime = Number(ui.startTime.value);
    const angle = angleDegrees * Math.PI / 180;

    let position = startPosition(startTime);
    let velocity = new THREE.Vector3(
        initialSpeed * Math.cos(angle),
        0,
        initialSpeed * Math.sin(angle)
    );

    const rawPositions = [position.clone()];
    const speeds = [velocity.length()];
    const times = [startTime];

    let collision = null;
    const steps = Math.floor(DURATION / DT);
    const interval = Math.max(1, Math.floor(steps / MAX_POINTS));

    for (let i = 0; i < steps; i++) {
        const t = startTime + i * DT;
        const acceleration = totalAcceleration(position, t);

        velocity.add(acceleration.multiplyScalar(DT));
        position.add(velocity.clone().multiplyScalar(DT));

        if (i % interval === 0) {
            rawPositions.push(position.clone());
            speeds.push(velocity.length());
            times.push(t);
        }

        for (const planet of planets) {
            const distance = planet.positionAt(t).distanceTo(position);

            if (distance < planet.radius) {
                collision = planet.name;
                break;
            }
        }

        if (collision) {
            break;
        }

        if (position.length() > 1100) {
            break;
        }
    }

    currentResult = {
        positions: rawPositions,
        speeds,
        times,
        collision,
        initialSpeed
    };

    drawTrajectory();
    drawChart();
    updateInfo();
    updatePlanetPositions(startTime);
}

function drawTrajectory() {
    if (trajectoryLine !== null) {
        scene.remove(trajectoryLine);
        trajectoryLine.geometry.dispose();
        trajectoryLine.material.dispose();
    }

    if (startMarker !== null) {
        scene.remove(startMarker);
        startMarker.geometry.dispose();
        startMarker.material.dispose();
    }

    if (endMarker !== null) {
        scene.remove(endMarker);
        endMarker.geometry.dispose();
        endMarker.material.dispose();
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(currentResult.positions);
    const material = new THREE.LineBasicMaterial({
        color: 0x58f0ff,
        transparent: true,
        opacity: 0.95
    });

    trajectoryLine = new THREE.Line(geometry, material);
    scene.add(trajectoryLine);

    startMarker = new THREE.Mesh(
        new THREE.SphereGeometry(4, 18, 18),
        new THREE.MeshBasicMaterial({ color: 0x00ff66 })
    );

    startMarker.position.copy(currentResult.positions[0]);
    scene.add(startMarker);

    endMarker = new THREE.Mesh(
        new THREE.SphereGeometry(5, 18, 18),
        new THREE.MeshBasicMaterial({ color: 0xff3333 })
    );

    endMarker.position.copy(currentResult.positions[currentResult.positions.length - 1]);
    scene.add(endMarker);
}

function updateInfo() {
    const speeds = currentResult.speeds;
    const finalSpeed = speeds[speeds.length - 1];
    const maxSpeed = Math.max(...speeds);
    const speedGain = finalSpeed - currentResult.initialSpeed;

    let closestName = "";
    let closestDistance = Infinity;

    for (let i = 0; i < currentResult.positions.length; i++) {
        const position = currentResult.positions[i];
        const t = currentResult.times[i];

        for (const planet of planets) {
            const distance = planet.positionAt(t).distanceTo(position);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestName = planet.name;
            }
        }
    }

    const success = speedGain > 0.5 && currentResult.collision === null && closestName !== "Sun";

    ui.info.textContent =
        `초기 속도: ${currentResult.initialSpeed.toFixed(2)}
최종 속도: ${finalSpeed.toFixed(2)}
최대 속도: ${maxSpeed.toFixed(2)}
속도 변화량: ${speedGain.toFixed(2)}
가장 가까운 천체: ${closestName}
최소 접근 거리: ${closestDistance.toFixed(2)}
충돌 여부: ${currentResult.collision ?? "없음"}
스윙바이 판정: ${success ? "성공 가능" : "미충족"}`;
}

function drawChart() {
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

    const speeds = currentResult.speeds;
    const minSpeed = Math.min(...speeds);
    const maxSpeed = Math.max(...speeds);
    const range = Math.max(maxSpeed - minSpeed, 1);

    context.strokeStyle = "#58f0ff";
    context.lineWidth = 2;
    context.beginPath();

    for (let i = 0; i < speeds.length; i++) {
        const x = speeds.length === 1 ? 0 : i / (speeds.length - 1) * width;
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
    context.fillText("speed graph", 10, 18);
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

    const offset = new THREE.Vector3(90, 90, 90);
    camera.position.copy(position.clone().add(offset));
}

function resetCamera() {
    controls.target.set(0, 0, 0);
    camera.position.set(0, 760, 0.1);
}

function moveTime(delta) {
    const next = Math.max(
        0,
        Math.min(500, Number(ui.startTime.value) + delta)
    );

    ui.startTime.value = next.toFixed(0);
    updateUIValues();
    simulate();
}

function handleHover(event) {
    mouse.x = event.clientX / window.innerWidth * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(
        planets.map(planet => planet.mesh),
        false
    );

    for (const planet of planets) {
        planet.mesh.scale.set(1, 1, 1);
    }

    if (hits.length > 0) {
        const planet = hits[0].object.userData.planet;
        const position = planet.positionAt(Number(ui.startTime.value));

        hits[0].object.scale.set(1.45, 1.45, 1.45);
        hoverRing.visible = true;
        hoverRing.position.copy(position);
        hoverRing.scale.setScalar(Math.max(0.75, visualRadiusOf(planet) / 8));
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

    mouse.x = event.clientX / window.innerWidth * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(
        planets.map(planet => planet.mesh),
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
        simulate();
    });
}

ui.massScale.addEventListener("input", updateUIValues);
ui.radiusScale.addEventListener("input", updateUIValues);

ui.savePlanet.addEventListener("click", () => {
    selectedPlanet.massScale = Number(ui.massScale.value);
    selectedPlanet.radiusScale = Number(ui.radiusScale.value);
    simulate();
});

ui.resetPlanets.addEventListener("click", () => {
    for (const planet of planets) {
        planet.reset();
    }

    selectedPlanet = planets.find(planet => planet.name === "Earth");
    loadSelectedPlanet();
    resetCamera();
    simulate();
});

ui.pause.addEventListener("click", () => {
    playScale = 0;
});

ui.speed1x.addEventListener("click", () => {
    playScale = 1;
});

ui.speed2x.addEventListener("click", () => {
    playScale = 2;
});

ui.speed5x.addEventListener("click", () => {
    playScale = 5;
});

ui.back1.addEventListener("click", () => {
    playScale = 0;
    moveTime(-1);
});

ui.back5.addEventListener("click", () => {
    playScale = 0;
    moveTime(-5);
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

    if (playScale > 0) {
        playAccumulator += delta;

        if (playAccumulator > 0.12) {
            const next = Number(ui.startTime.value) + playAccumulator * playScale;
            ui.startTime.value = Math.min(500, next).toFixed(1);
            playAccumulator = 0;
            updateUIValues();
            simulate();
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
resetCamera();
simulate();
animate();