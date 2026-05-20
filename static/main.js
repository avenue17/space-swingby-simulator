import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.164.1/examples/jsm/controls/OrbitControls.js";

const G = 0.9;
const DT = 0.18;
const DURATION = 220;
const SOFTENING = 8;
const MAX_POINTS = 900;

const viewport = document.getElementById("viewport");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(650, 650, 620);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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
        this.group = new THREE.Group();
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

        const a = this.angularSpeed * t + this.initialAngle;
        return new THREE.Vector3(
            this.orbitRadius * Math.cos(a),
            0,
            this.orbitRadius * Math.sin(a)
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
let selectedPlanet = planets.find(p => p.name === "Earth");
let trajectoryLine = null;
let startMarker = null;
let endMarker = null;
let currentResult = null;
let timeScale = 1;

function makeCircle(radius, color, opacity, y = 0) {
    const points = [];
    const n = 160;

    for (let i = 0; i <= n; i++) {
        const a = i / n * Math.PI * 2;
        points.push(new THREE.Vector3(radius * Math.cos(a), y, radius * Math.sin(a)));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity
    });

    return new THREE.Line(geometry, material);
}

function buildPlanetObjects() {
    for (const planet of planets) {
        if (planet.orbitRadius > 0) {
            planet.orbitMesh = makeCircle(planet.orbitRadius, 0x555555, 0.35);
            scene.add(planet.orbitMesh);
        }

        const visualRadius = planet.name === "Sun" ? 14 : Math.max(3, Math.min(9, planet.radius * 0.35));
        const geometry = new THREE.SphereGeometry(visualRadius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: planet.color,
            emissive: planet.name === "Sun" ? planet.color : 0x000000,
            emissiveIntensity: planet.name === "Sun" ? 0.8 : 0.05
        });

        planet.mesh = new THREE.Mesh(geometry, material);
        planet.mesh.userData.planet = planet;
        scene.add(planet.mesh);

        planet.influenceMesh = makeCircle(planet.influenceRadius, 0x4da3ff, 0.25, 0.5);
        scene.add(planet.influenceMesh);
    }
}

const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);

const light = new THREE.PointLight(0xffffff, 2.2, 2000);
light.position.set(0, 200, 0);
scene.add(light);

buildPlanetObjects();

function updatePlanetPositions(t) {
    for (const planet of planets) {
        const pos = planet.positionAt(t);
        planet.mesh.position.copy(pos);
        planet.influenceMesh.position.copy(pos);
        const s = planet.influenceRadius / planet.influenceMesh.geometry.boundingSphere?.radius || 1;
    }
}

function startPosition(t) {
    const earth = planets.find(p => p.name === "Earth");
    const earthPos = earth.positionAt(t);
    const dir = earthPos.clone().normalize();
    return earthPos.clone().add(dir.multiplyScalar(earth.radius * 2.5));
}

function totalAcceleration(position, t) {
    const acc = new THREE.Vector3(0, 0, 0);

    for (const planet of planets) {
        const p = planet.positionAt(t);
        const dir = p.clone().sub(position);
        const d = Math.max(dir.length(), SOFTENING);
        const scale = G * planet.mass / (d * d * d);
        acc.add(dir.multiplyScalar(scale));
    }

    return acc;
}

function simulate() {
    const angleDeg = Number(ui.angle.value);
    const speed = Number(ui.speed.value);
    const startTime = Number(ui.startTime.value);
    const angle = angleDeg * Math.PI / 180;

    let pos = startPosition(startTime);
    let vel = new THREE.Vector3(
        speed * Math.cos(angle),
        0,
        speed * Math.sin(angle)
    );

    const positions = [pos.clone()];
    const speeds = [vel.length()];
    const times = [startTime];

    let collision = null;
    const steps = Math.floor(DURATION / DT);

    for (let i = 0; i < steps; i++) {
        const t = startTime + i * DT;
        const acc = totalAcceleration(pos, t);

        vel.add(acc.multiplyScalar(DT));
        pos.add(vel.clone().multiplyScalar(DT));

        if (i % Math.max(1, Math.floor(steps / MAX_POINTS)) === 0) {
            positions.push(pos.clone());
            speeds.push(vel.length());
            times.push(t);
        }

        for (const planet of planets) {
            const d = planet.positionAt(t).distanceTo(pos);
            if (d < planet.radius) {
                collision = planet.name;
                break;
            }
        }

        if (collision) break;
        if (pos.length() > 1100) break;
    }

    currentResult = { positions, speeds, times, collision, initialSpeed: speed };
    drawTrajectory();
    drawChart();
    updateInfo();
    updatePlanetPositions(startTime);
}

function drawTrajectory() {
    if (trajectoryLine) scene.remove(trajectoryLine);
    if (startMarker) scene.remove(startMarker);
    if (endMarker) scene.remove(endMarker);

    const geometry = new THREE.BufferGeometry().setFromPoints(currentResult.positions);
    const material = new THREE.LineBasicMaterial({
        color: 0x58f0ff,
        transparent: true,
        opacity: 0.95
    });

    trajectoryLine = new THREE.Line(geometry, material);
    scene.add(trajectoryLine);

    startMarker = new THREE.Mesh(
        new THREE.SphereGeometry(4, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00ff66 })
    );
    startMarker.position.copy(currentResult.positions[0]);
    scene.add(startMarker);

    endMarker = new THREE.Mesh(
        new THREE.SphereGeometry(5, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff3333 })
    );
    endMarker.position.copy(currentResult.positions[currentResult.positions.length - 1]);
    scene.add(endMarker);
}

function updateInfo() {
    const speeds = currentResult.speeds;
    const finalSpeed = speeds[speeds.length - 1];
    const maxSpeed = Math.max(...speeds);
    const gain = finalSpeed - currentResult.initialSpeed;

    let closestName = "";
    let closestDist = Infinity;

    for (let i = 0; i < currentResult.positions.length; i++) {
        const pos = currentResult.positions[i];
        const t = currentResult.times[i];

        for (const planet of planets) {
            const d = planet.positionAt(t).distanceTo(pos);
            if (d < closestDist) {
                closestDist = d;
                closestName = planet.name;
            }
        }
    }

    ui.info.textContent =
        `초기 속도: ${currentResult.initialSpeed.toFixed(2)}
최종 속도: ${finalSpeed.toFixed(2)}
최대 속도: ${maxSpeed.toFixed(2)}
속도 변화량: ${gain.toFixed(2)}
가장 가까운 천체: ${closestName}
최소 접근 거리: ${closestDist.toFixed(2)}
충돌 여부: ${currentResult.collision ?? "없음"}
스윙바이 판정: ${gain > 0.5 && !currentResult.collision ? "성공 가능" : "미충족"}`;
}

function drawChart() {
    const canvas = ui.chart;
    const ctx = canvas.getContext("2d");
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, w, h);

    const speeds = currentResult.speeds;
    const min = Math.min(...speeds);
    const max = Math.max(...speeds);
    const range = Math.max(max - min, 1);

    ctx.strokeStyle = "#58f0ff";
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < speeds.length; i++) {
        const x = i / (speeds.length - 1) * w;
        const y = h - ((speeds[i] - min) / range * (h - 20) + 10);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }

    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText("speed graph", 10, 18);
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
    const pos = planet.positionAt(Number(ui.startTime.value));
    controls.target.copy(pos);
    camera.position.copy(pos.clone().add(new THREE.Vector3(90, 90, 90)));
}

function resetCamera() {
    controls.target.set(0, 0, 0);
    camera.position.set(0, 760, 0.1);
}

for (const input of [ui.angle, ui.speed]) {
    input.addEventListener("input", () => {
        updateUIValues();
        simulate();
    });
}

ui.startTime.addEventListener("input", () => {
    updateUIValues();
    simulate();
});

ui.massScale.addEventListener("input", updateUIValues);
ui.radiusScale.addEventListener("input", updateUIValues);

ui.savePlanet.addEventListener("click", () => {
    selectedPlanet.massScale = Number(ui.massScale.value);
    selectedPlanet.radiusScale = Number(ui.radiusScale.value);
    simulate();
});

ui.resetPlanets.addEventListener("click", () => {
    for (const planet of planets) planet.reset();
    loadSelectedPlanet();
    simulate();
});

ui.speed1x.addEventListener("click", () => timeScale = 1);
ui.speed2x.addEventListener("click", () => timeScale = 2);
ui.speed5x.addEventListener("click", () => timeScale = 5);

ui.back1.addEventListener("click", () => {
    ui.startTime.value = Math.max(0, Number(ui.startTime.value) - 1);
    updateUIValues();
    simulate();
});

ui.back5.addEventListener("click", () => {
    ui.startTime.value = Math.max(0, Number(ui.startTime.value) - 5);
    updateUIValues();
    simulate();
});

window.addEventListener("mousemove", event => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(planets.map(p => p.mesh));

    for (const planet of planets) {
        planet.mesh.scale.set(1, 1, 1);
    }

    if (hits.length > 0) {
        hits[0].object.scale.set(1.45, 1.45, 1.45);
    }
});

window.addEventListener("click", event => {
    if (event.target !== renderer.domElement) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(planets.map(p => p.mesh));

    if (hits.length > 0) {
        selectedPlanet = hits[0].object.userData.planet;
        loadSelectedPlanet();
        focusPlanet(selectedPlanet);
    }
});

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

updateUIValues();
loadSelectedPlanet();
resetCamera();
simulate();
animate();