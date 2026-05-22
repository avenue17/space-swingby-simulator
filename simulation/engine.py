import math
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional

from .models import PredictRequest, PredictResponse

G = 0.9
DT = 0.08
DURATION = 900
SOFTENING = 8
TIME_FLOW = 20
ORBIT_DISTANCE_SCALE = 1.75
WORLD_LIMIT = 5200


@dataclass
class Vec3:
    x: float
    y: float
    z: float

    def copy(self):
        return Vec3(self.x, self.y, self.z)

    def add(self, other):
        return Vec3(self.x + other.x, self.y + other.y, self.z + other.z)

    def sub(self, other):
        return Vec3(self.x - other.x, self.y - other.y, self.z - other.z)

    def mul(self, value):
        return Vec3(self.x * value, self.y * value, self.z * value)

    def div(self, value):
        return Vec3(self.x / value, self.y / value, self.z / value)

    def dot(self, other):
        return self.x * other.x + self.y * other.y + self.z * other.z

    def cross(self, other):
        return Vec3(
            self.y * other.z - self.z * other.y,
            self.z * other.x - self.x * other.z,
            self.x * other.y - self.y * other.x,
        )

    def length(self):
        return math.sqrt(self.x * self.x + self.y * self.y + self.z * self.z)

    def normalize(self):
        length = self.length()
        if length == 0:
            return Vec3(1, 0, 0)
        return self.div(length)

    def distance_to(self, other):
        return self.sub(other).length()

    def to_list(self):
        return [self.x, self.y, self.z]


@dataclass
class Planet:
    name: str
    mass: float
    radius: float
    orbit_radius: float
    angular_speed: float
    initial_angle: float
    inclination: float
    ascending_node: float
    influence_radius: float
    color: int
    period_days: float = 0
    phase_at_epoch: float = 0
    mass_scale: float = 1
    radius_scale: float = 1

    @property
    def scaled_mass(self):
        return self.mass * self.mass_scale

    @property
    def scaled_radius(self):
        return self.radius * self.radius_scale

    @property
    def visual_radius(self):
        if self.name == "Sun":
            return 32
        if self.name == "Jupiter":
            return 18
        if self.name == "Saturn":
            return 15
        if self.name == "Uranus":
            return 13
        if self.name == "Neptune":
            return 13
        if self.name == "Earth":
            return 12
        if self.name == "Venus":
            return 11
        if self.name == "Mars":
            return 10
        return 8

    @property
    def visual_scaled_radius(self):
        return self.visual_radius * self.radius_scale

    @property
    def scaled_influence_radius(self):
        return self.influence_radius * math.sqrt(self.mass_scale)

    def rotate_axis(self, vector: Vec3, axis: Vec3, angle: float):
        axis = axis.normalize()
        c = math.cos(angle)
        s = math.sin(angle)
        term1 = vector.mul(c)
        term2 = axis.cross(vector).mul(s)
        term3 = axis.mul(axis.dot(vector) * (1 - c))
        return term1.add(term2).add(term3)

    def rotate_y(self, vector: Vec3, angle: float):
        c = math.cos(angle)
        s = math.sin(angle)
        return Vec3(
            vector.x * c + vector.z * s,
            vector.y,
            -vector.x * s + vector.z * c,
        )

    def orbit_transform_vector(self, vector: Vec3):
        node_axis = Vec3(
            math.cos(self.ascending_node),
            0,
            -math.sin(self.ascending_node),
        ).normalize()

        tilted = self.rotate_axis(vector, node_axis, self.inclination)
        return self.rotate_y(tilted, self.ascending_node)

    def position_at(self, t: float):
        if self.orbit_radius == 0:
            return Vec3(0, 0, 0)

        angle = self.angular_speed * t + self.initial_angle
        flat_position = Vec3(
            self.orbit_radius * math.cos(angle),
            0,
            self.orbit_radius * math.sin(angle),
        )

        return self.orbit_transform_vector(flat_position)


CUSTOM_PLANET_DATA = [
    {"name": "Sun", "mass": 12000, "radius": 28, "orbit_radius": 0, "angular_speed": 0, "initial_angle": 0, "inclination": 0, "ascending_node": 0, "influence_radius": 135, "color": 0xffcc33},
    {"name": "Mercury", "mass": 90, "radius": 5, "orbit_radius": 80, "angular_speed": 0.045, "initial_angle": 0.4, "inclination": 7.0, "ascending_node": 48.3, "influence_radius": 24, "color": 0x999999},
    {"name": "Venus", "mass": 210, "radius": 8, "orbit_radius": 125, "angular_speed": 0.032, "initial_angle": 1.1, "inclination": 3.4, "ascending_node": 76.7, "influence_radius": 38, "color": 0xffa64d},
    {"name": "Earth", "mass": 280, "radius": 9, "orbit_radius": 180, "angular_speed": 0.024, "initial_angle": 2.0, "inclination": 0.0, "ascending_node": 0.0, "influence_radius": 52, "color": 0x3a7bff},
    {"name": "Mars", "mass": 170, "radius": 7, "orbit_radius": 250, "angular_speed": 0.018, "initial_angle": 2.8, "inclination": 1.85, "ascending_node": 49.6, "influence_radius": 45, "color": 0xff5533},
    {"name": "Ceres", "mass": 75, "radius": 5, "orbit_radius": 315, "angular_speed": 0.014, "initial_angle": 3.3, "inclination": 10.6, "ascending_node": 80.3, "influence_radius": 28, "color": 0xb0a090},
    {"name": "Jupiter", "mass": 1300, "radius": 20, "orbit_radius": 420, "angular_speed": 0.010, "initial_angle": 4.0, "inclination": 1.3, "ascending_node": 100.5, "influence_radius": 112, "color": 0xd6a36a},
    {"name": "Saturn", "mass": 950, "radius": 17, "orbit_radius": 560, "angular_speed": 0.007, "initial_angle": 5.0, "inclination": 2.49, "ascending_node": 113.7, "influence_radius": 102, "color": 0xe6d28a},
    {"name": "Uranus", "mass": 620, "radius": 14, "orbit_radius": 710, "angular_speed": 0.005, "initial_angle": 5.7, "inclination": 0.77, "ascending_node": 74.0, "influence_radius": 88, "color": 0x7fd4d9},
    {"name": "Neptune", "mass": 660, "radius": 14, "orbit_radius": 850, "angular_speed": 0.004, "initial_angle": 0.9, "inclination": 1.77, "ascending_node": 131.8, "influence_radius": 90, "color": 0x4169e1},
    {"name": "Pluto", "mass": 45, "radius": 4, "orbit_radius": 980, "angular_speed": 0.003, "initial_angle": 1.7, "inclination": 17.2, "ascending_node": 110.3, "influence_radius": 24, "color": 0xc9b18a},
]

REAL_PLANET_DATA = [
    {"name": "Sun", "mass": 333000 * 280 * 0.015, "radius": 28, "orbit_radius": 0, "angular_speed": 0, "initial_angle": 0, "inclination": 0, "ascending_node": 0, "influence_radius": 160, "color": 0xffcc33, "period_days": 0, "phase_at_epoch": 0},
    {"name": "Mercury", "mass": 0.055 * 280, "radius": 5, "orbit_radius": 70, "angular_speed": 0, "initial_angle": 0, "inclination": 7.00, "ascending_node": 48.33, "influence_radius": 20, "color": 0x999999, "period_days": 87.969, "phase_at_epoch": 4.40},
    {"name": "Venus", "mass": 0.815 * 280, "radius": 8, "orbit_radius": 130, "angular_speed": 0, "initial_angle": 0, "inclination": 3.39, "ascending_node": 76.68, "influence_radius": 36, "color": 0xffa64d, "period_days": 224.701, "phase_at_epoch": 3.18},
    {"name": "Earth", "mass": 280, "radius": 9, "orbit_radius": 180, "angular_speed": 0, "initial_angle": 0, "inclination": 0.00, "ascending_node": 0.00, "influence_radius": 52, "color": 0x3a7bff, "period_days": 365.256, "phase_at_epoch": 1.75},
    {"name": "Mars", "mass": 0.107 * 280, "radius": 7, "orbit_radius": 275, "angular_speed": 0, "initial_angle": 0, "inclination": 1.85, "ascending_node": 49.56, "influence_radius": 42, "color": 0xff5533, "period_days": 686.980, "phase_at_epoch": 6.20},
    {"name": "Ceres", "mass": 0.03 * 280, "radius": 5, "orbit_radius": 385, "angular_speed": 0, "initial_angle": 0, "inclination": 10.59, "ascending_node": 80.31, "influence_radius": 24, "color": 0xb0a090, "period_days": 1680.0, "phase_at_epoch": 2.20},
    {"name": "Jupiter", "mass": 317.8 * 280, "radius": 20, "orbit_radius": 560, "angular_speed": 0, "initial_angle": 0, "inclination": 1.30, "ascending_node": 100.46, "influence_radius": 130, "color": 0xd6a36a, "period_days": 4332.59, "phase_at_epoch": 0.60},
    {"name": "Saturn", "mass": 95.2 * 280, "radius": 17, "orbit_radius": 760, "angular_speed": 0, "initial_angle": 0, "inclination": 2.49, "ascending_node": 113.67, "influence_radius": 115, "color": 0xe6d28a, "period_days": 10759.22, "phase_at_epoch": 5.80},
    {"name": "Uranus", "mass": 14.5 * 280, "radius": 14, "orbit_radius": 970, "angular_speed": 0, "initial_angle": 0, "inclination": 0.77, "ascending_node": 74.01, "influence_radius": 95, "color": 0x7fd4d9, "period_days": 30688.5, "phase_at_epoch": 1.10},
    {"name": "Neptune", "mass": 17.1 * 280, "radius": 14, "orbit_radius": 1180, "angular_speed": 0, "initial_angle": 0, "inclination": 1.77, "ascending_node": 131.78, "influence_radius": 98, "color": 0x4169e1, "period_days": 60182.0, "phase_at_epoch": 5.35},
]


def days_from_j2000(date_string: str):
    selected = datetime.fromisoformat(date_string + "T12:00:00+00:00")
    j2000 = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    return (selected - j2000).total_seconds() / 86400


def make_planets(request: PredictRequest):
    source = CUSTOM_PLANET_DATA if request.mode == "custom" else REAL_PLANET_DATA
    days = days_from_j2000(request.date)
    planets = []

    for item in source:
        data = dict(item)
        data["orbit_radius"] *= ORBIT_DISTANCE_SCALE
        data["inclination"] = math.radians(data.get("inclination", 0))
        data["ascending_node"] = math.radians(data.get("ascending_node", 0))

        if request.mode == "real" and data["orbit_radius"] != 0:
            angle_per_day = 2 * math.pi / data["period_days"]
            data["angular_speed"] = angle_per_day * TIME_FLOW
            data["initial_angle"] = data["phase_at_epoch"] + angle_per_day * days

        planet = Planet(**data)
        planet.mass_scale = request.mass_scales.get(planet.name, 1)
        planet.radius_scale = request.radius_scales.get(planet.name, 1)
        planets.append(planet)

    return planets


def initial_velocity(request: PredictRequest):
    horizontal = math.radians(request.angle)
    vertical = math.radians(request.vertical_angle)

    horizontal_speed = request.speed * math.cos(vertical)
    vertical_speed = request.speed * math.sin(vertical)

    return Vec3(
        horizontal_speed * math.cos(horizontal),
        vertical_speed,
        horizontal_speed * math.sin(horizontal),
    )


def start_position(planets: List[Planet], t: float):
    earth = next((planet for planet in planets if planet.name == "Earth"), None)

    if earth is None:
        return Vec3(-200, 0, 0)

    earth_position = earth.position_at(t)
    direction = earth_position.normalize()

    safe_distance = max(
        earth.scaled_radius * 2.8,
        earth.visual_scaled_radius * 2.2,
        35,
    )

    return earth_position.add(direction.mul(safe_distance))


def total_acceleration(planets: List[Planet], position: Vec3, t: float):
    acceleration = Vec3(0, 0, 0)

    for planet in planets:
        planet_position = planet.position_at(t)
        direction = planet_position.sub(position)
        distance = max(direction.length(), SOFTENING)
        scale = G * planet.scaled_mass / (distance * distance * distance)
        acceleration = acceleration.add(direction.mul(scale))

    return acceleration


def rk4_step(planets: List[Planet], position: Vec3, velocity: Vec3, t: float, dt: float):
    a1 = total_acceleration(planets, position, t)
    k1_r = velocity
    k1_v = a1

    p2 = position.add(k1_r.mul(dt * 0.5))
    v2 = velocity.add(k1_v.mul(dt * 0.5))
    a2 = total_acceleration(planets, p2, t + dt * 0.5)
    k2_r = v2
    k2_v = a2

    p3 = position.add(k2_r.mul(dt * 0.5))
    v3 = velocity.add(k2_v.mul(dt * 0.5))
    a3 = total_acceleration(planets, p3, t + dt * 0.5)
    k3_r = v3
    k3_v = a3

    p4 = position.add(k3_r.mul(dt))
    v4 = velocity.add(k3_v.mul(dt))
    a4 = total_acceleration(planets, p4, t + dt)
    k4_r = v4
    k4_v = a4

    new_position = position.add(
        k1_r.add(k2_r.mul(2)).add(k3_r.mul(2)).add(k4_r).mul(dt / 6)
    )

    new_velocity = velocity.add(
        k1_v.add(k2_v.mul(2)).add(k3_v.mul(2)).add(k4_v).mul(dt / 6)
    )

    return new_position, new_velocity


def check_collision(planets: List[Planet], position: Vec3, t: float):
    for planet in planets:
        distance = planet.position_at(t).distance_to(position)
        if distance < planet.scaled_radius:
            return planet.name
    return None


def predict_trajectory(request: PredictRequest):
    planets = make_planets(request)

    position = start_position(planets, request.start_time)
    velocity = initial_velocity(request)

    positions = [position.to_list()]
    speeds = [velocity.length()]
    times = [request.start_time]

    collision = None
    closest_name = ""
    closest_distance = float("inf")
    closest_influence_radius = 0
    inside_influence_name: Optional[str] = None

    steps = int(DURATION / DT)

    for i in range(steps):
        t = request.start_time + i * DT

        position, velocity = rk4_step(planets, position, velocity, t, DT)
        current_time = t + DT

        positions.append(position.to_list())
        speeds.append(velocity.length())
        times.append(current_time)

        for planet in planets:
            distance = planet.position_at(current_time).distance_to(position)

            if distance < closest_distance:
                closest_distance = distance
                closest_name = planet.name
                closest_influence_radius = planet.scaled_influence_radius

            if inside_influence_name is None and distance <= planet.scaled_influence_radius:
                inside_influence_name = planet.name

        collision = check_collision(planets, position, current_time)
        if collision:
            break

        if position.length() > WORLD_LIMIT:
            break

    return PredictResponse(
        positions=positions,
        speeds=speeds,
        times=times,
        collision=collision,
        initial_speed=request.speed,
        closest_name=closest_name,
        closest_distance=closest_distance,
        closest_influence_radius=closest_influence_radius,
        inside_influence_name=inside_influence_name,
    )