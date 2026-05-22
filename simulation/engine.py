import math
from typing import List, Optional, Tuple

from .constants import DURATION, G, MAX_SUBSTEPS, OUTPUT_DT, SOFTENING, WORLD_LIMIT
from .models import PredictRequest, PredictResponse
from .planets import Planet, make_planets
from .vector import Vec3, lerp


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


def nearest_body_metrics(planets: List[Planet], position: Vec3, t: float):
    nearest_distance = float("inf")
    nearest_influence_ratio = float("inf")
    nearest_radius_ratio = float("inf")

    for planet in planets:
        planet_position = planet.position_at(t)
        distance = planet_position.distance_to(position)

        if distance < nearest_distance:
            nearest_distance = distance

        influence = max(planet.scaled_influence_radius, 1)
        radius = max(planet.visual_scaled_radius, planet.scaled_radius, 1)

        nearest_influence_ratio = min(nearest_influence_ratio, distance / influence)
        nearest_radius_ratio = min(nearest_radius_ratio, distance / radius)

    return nearest_distance, nearest_influence_ratio, nearest_radius_ratio


def choose_substeps(planets: List[Planet], position: Vec3, velocity: Vec3, t: float):
    acceleration = total_acceleration(planets, position, t).length()
    _, influence_ratio, radius_ratio = nearest_body_metrics(planets, position, t)

    substeps = 1

    if acceleration > 0.6 or influence_ratio < 1.2:
        substeps = 2

    if acceleration > 1.5 or influence_ratio < 0.75:
        substeps = 3

    if acceleration > 3.0 or influence_ratio < 0.45 or radius_ratio < 5:
        substeps = 4

    if acceleration > 7.0 or radius_ratio < 3:
        substeps = 6

    if velocity.length() > 120:
        substeps = max(substeps, 3)

    return min(MAX_SUBSTEPS, substeps)


def adaptive_step(planets: List[Planet], position: Vec3, velocity: Vec3, t: float, dt: float):
    substeps = choose_substeps(planets, position, velocity, t)
    sub_dt = dt / substeps

    current_position = position
    current_velocity = velocity
    current_time = t

    for _ in range(substeps):
        current_position, current_velocity = rk4_step(
            planets,
            current_position,
            current_velocity,
            current_time,
            sub_dt,
        )
        current_time += sub_dt

    return current_position, current_velocity


def check_collision(planets: List[Planet], position: Vec3, t: float):
    for planet in planets:
        distance = planet.position_at(t).distance_to(position)
        collision_radius = max(planet.scaled_radius, planet.visual_scaled_radius * 0.72)

        if distance <= collision_radius:
            return planet.name

    return None


def refine_collision(
    planets: List[Planet],
    previous_position: Vec3,
    current_position: Vec3,
    previous_time: float,
    current_time: float,
    collision_name: str,
):
    planet = next((item for item in planets if item.name == collision_name), None)

    if planet is None:
        return current_position, current_time

    left = 0.0
    right = 1.0

    for _ in range(16):
        mid = (left + right) * 0.5
        point = lerp(previous_position, current_position, mid)
        time = previous_time + (current_time - previous_time) * mid
        planet_position = planet.position_at(time)
        collision_radius = max(planet.scaled_radius, planet.visual_scaled_radius * 0.72)

        if planet_position.distance_to(point) <= collision_radius:
            right = mid
        else:
            left = mid

    ratio = right
    point = lerp(previous_position, current_position, ratio)
    time = previous_time + (current_time - previous_time) * ratio

    return point, time


def update_close_approach(
    planets: List[Planet],
    position: Vec3,
    t: float,
    closest_name: str,
    closest_distance: float,
    closest_influence_radius: float,
    inside_influence_name: Optional[str],
):
    for planet in planets:
        distance = planet.position_at(t).distance_to(position)

        if distance < closest_distance:
            closest_distance = distance
            closest_name = planet.name
            closest_influence_radius = planet.scaled_influence_radius

        if inside_influence_name is None and distance <= planet.scaled_influence_radius:
            inside_influence_name = planet.name

    return closest_name, closest_distance, closest_influence_radius, inside_influence_name


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

    steps = int(DURATION / OUTPUT_DT)

    closest_name, closest_distance, closest_influence_radius, inside_influence_name = update_close_approach(
        planets,
        position,
        request.start_time,
        closest_name,
        closest_distance,
        closest_influence_radius,
        inside_influence_name,
    )

    for i in range(steps):
        previous_position = position
        previous_velocity = velocity
        previous_time = request.start_time + i * OUTPUT_DT
        current_time = previous_time + OUTPUT_DT

        position, velocity = adaptive_step(
            planets,
            previous_position,
            previous_velocity,
            previous_time,
            OUTPUT_DT,
        )

        collision = check_collision(planets, position, current_time)

        if collision:
            position, current_time = refine_collision(
                planets,
                previous_position,
                position,
                previous_time,
                current_time,
                collision,
            )

        positions.append(position.to_list())
        speeds.append(velocity.length())
        times.append(current_time)

        closest_name, closest_distance, closest_influence_radius, inside_influence_name = update_close_approach(
            planets,
            position,
            current_time,
            closest_name,
            closest_distance,
            closest_influence_radius,
            inside_influence_name,
        )

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