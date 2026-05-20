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
        this.influenceShell = null;
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