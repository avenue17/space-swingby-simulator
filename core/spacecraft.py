from dataclasses import dataclass
import numpy as np
from utils.constants import SOFTENING


@dataclass
class Planet:
    name: str
    base_mass: float
    base_radius: float
    orbit_radius: float
    angular_speed: float
    initial_angle: float
    base_influence_radius: float
    color: str
    mass_scale: float = 1.0
    radius_scale: float = 1.0
    influence_scale: float = 1.0

    @property
    def mass(self):
        return self.base_mass * self.mass_scale

    @property
    def radius(self):
        return self.base_radius * self.radius_scale

    @property
    def influence_radius(self):
        value = self.base_influence_radius * self.influence_scale
        return max(value, self.radius * 1.5)

    def position_at(self, t):
        if self.orbit_radius == 0:
            return np.array([0.0, 0.0, 0.0], dtype=float)

        angle = self.angular_speed * t + self.initial_angle
        return np.array([
            self.orbit_radius * np.cos(angle),
            self.orbit_radius * np.sin(angle),
            0.0
        ], dtype=float)

    def gravity_acceleration(self, spacecraft_position, t, gravitational_constant):
        planet_position = self.position_at(t)
        direction = planet_position - spacecraft_position
        distance = np.linalg.norm(direction)
        safe_distance = max(distance, SOFTENING)
        return gravitational_constant * self.mass * direction / (safe_distance ** 3)

    def set_scales(self, mass_scale, radius_scale, influence_scale):
        self.mass_scale = float(mass_scale)
        self.radius_scale = float(radius_scale)
        self.influence_scale = float(influence_scale)

    def reset(self):
        self.mass_scale = 1.0
        self.radius_scale = 1.0
        self.influence_scale = 1.0