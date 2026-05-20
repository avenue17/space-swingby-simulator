from copy import deepcopy
from config.presets import DEFAULT_PLANETS
from core.planet import Planet


class SolarSystem:
    def __init__(self, planet_data=None):
        self.planet_data = deepcopy(planet_data if planet_data is not None else DEFAULT_PLANETS)
        self.planets = self._build_planets(self.planet_data)

    def _build_planets(self, planet_data):
        planets = []
        for name, data in planet_data.items():
            planets.append(
                Planet(
                    name=name,
                    base_mass=data["mass"],
                    base_radius=data["radius"],
                    orbit_radius=data["orbit_radius"],
                    angular_speed=data["angular_speed"],
                    initial_angle=data["initial_angle"],
                    base_influence_radius=data["influence_radius"],
                    color=data["color"]
                )
            )
        return planets

    def get_planet(self, name):
        for planet in self.planets:
            if planet.name == name:
                return planet
        return None

    def planet_names(self):
        return [planet.name for planet in self.planets]

    def update_planet(self, name, mass_scale, radius_scale, influence_scale):
        planet = self.get_planet(name)
        if planet is not None:
            planet.set_scales(mass_scale, radius_scale, influence_scale)

    def reset_to_default(self):
        for planet in self.planets:
            planet.reset()

    def positions_at(self, t):
        return {planet.name: planet.position_at(t) for planet in self.planets}