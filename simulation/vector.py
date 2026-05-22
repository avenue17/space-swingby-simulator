import math
from dataclasses import dataclass


@dataclass(frozen=True)
class Vec3:
    x: float
    y: float
    z: float

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


def lerp(a: Vec3, b: Vec3, ratio: float):
    return a.mul(1 - ratio).add(b.mul(ratio))