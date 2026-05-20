import numpy as np
from core.spacecraft import Spacecraft
from utils.constants import G, DEFAULT_DT, DEFAULT_DURATION, PLOT_LIMIT, MAX_TRAJECTORY_POINTS


class Simulation:
    def __init__(self, solar_system):
        self.solar_system = solar_system

    def run(self, launch_angle, launch_speed, start_time=0.0, duration=DEFAULT_DURATION, dt=DEFAULT_DT):
        spacecraft = Spacecraft()
        spacecraft.reset(launch_speed, launch_angle)

        times = []
        collision = None
        steps = max(1, int(duration / dt))

        for step in range(steps):
            t = start_time + step * dt
            acceleration = self._total_acceleration(spacecraft.position, t)
            spacecraft.update(acceleration, dt)
            times.append(t)

            collision = self._check_collision(spacecraft.position, t)
            if collision is not None:
                break

            if np.linalg.norm(spacecraft.position[:2]) > PLOT_LIMIT * 1.5:
                break

        trajectory = np.array(spacecraft.trajectory)
        velocities = np.array(spacecraft.velocity_history)
        times = np.array([start_time] + times[:len(trajectory) - 1])

        if len(trajectory) > MAX_TRAJECTORY_POINTS:
            idx = np.linspace(0, len(trajectory) - 1, MAX_TRAJECTORY_POINTS).astype(int)
            trajectory = trajectory[idx]
            velocities = velocities[idx]
            times = times[idx]

        return {
            "trajectory": trajectory,
            "velocities": velocities,
            "times": times,
            "collision": collision,
            "launch_speed": float(launch_speed),
            "launch_angle": float(launch_angle),
            "start_time": float(start_time),
            "duration": float(duration),
            "dt": float(dt)
        }

    def _total_acceleration(self, position, t):
        acceleration = np.zeros(3, dtype=float)

        for planet in self.solar_system.planets:
            acceleration += planet.gravity_acceleration(position, t, G)

        return acceleration

    def _check_collision(self, position, t):
        for planet in self.solar_system.planets:
            planet_position = planet.position_at(t)
            distance = np.linalg.norm(position - planet_position)

            if distance <= planet.radius:
                return planet.name

        return None