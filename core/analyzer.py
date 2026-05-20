import numpy as np


def analyze_result(result, solar_system):
    trajectory = result["trajectory"]
    velocities = result["velocities"]
    times = result["times"]

    speeds = np.linalg.norm(velocities, axis=1)
    final_speed = float(speeds[-1])
    max_speed = float(np.max(speeds))
    initial_speed = float(result["launch_speed"])

    closest_planet = None
    closest_distance = float("inf")

    for i, position in enumerate(trajectory):
        t = times[i]
        for planet in solar_system.planets:
            planet_position = planet.position_at(t)
            distance = float(np.linalg.norm(position - planet_position))
            if distance < closest_distance:
                closest_distance = distance
                closest_planet = planet.name

    collision = result["collision"]
    speed_gain = final_speed - initial_speed

    swingby_success = (
        collision is None
        and closest_planet is not None
        and closest_planet != "Sun"
        and speed_gain > 0.5
    )

    return {
        "initial_speed": initial_speed,
        "final_speed": final_speed,
        "max_speed": max_speed,
        "speed_gain": speed_gain,
        "closest_planet": closest_planet,
        "closest_distance": closest_distance,
        "collision": collision,
        "swingby_success": swingby_success
    }


def format_summary(analysis):
    collision_text = "없음" if analysis["collision"] is None else analysis["collision"]
    success_text = "성공" if analysis["swingby_success"] else "미충족"

    return (
        f"초기 속도: {analysis['initial_speed']:.2f}\n"
        f"최종 속도: {analysis['final_speed']:.2f}\n"
        f"최대 속도: {analysis['max_speed']:.2f}\n"
        f"속도 변화량: {analysis['speed_gain']:.2f}\n"
        f"가장 가까이 접근한 천체: {analysis['closest_planet']}\n"
        f"최소 접근 거리: {analysis['closest_distance']:.2f}\n"
        f"충돌 여부: {collision_text}\n"
        f"스윙바이 판정: {success_text}"
    )