import numpy as np
from utils.constants import SPACECRAFT_START_POSITION


class Spacecraft:
    def __init__(self):
        self.initial_position = np.array(SPACECRAFT_START_POSITION, dtype=float)
        self.position = self.initial_position.copy()
        self.velocity = np.zeros(3, dtype=float)
        self.trajectory = []
        self.velocity_history = []

    def reset(self, speed, angle_degrees):
        self.position = self.initial_position.copy()
        angle = np.deg2rad(angle_degrees)
        self.velocity = np.array([
            speed * np.cos(angle),
            speed * np.sin(angle),
            0.0
        ], dtype=float)
        self.trajectory = [self.position.copy()]
        self.velocity_history = [self.velocity.copy()]

    def update(self, acceleration, dt):
        self.velocity = self.velocity + acceleration * dt
        self.position = self.position + self.velocity * dt
        self.trajectory.append(self.position.copy())
        self.velocity_history.append(self.velocity.copy())

    def speed(self):
        return float(np.linalg.norm(self.velocity))