from core.solar_system import SolarSystem
from core.simulation import Simulation
from core.analyzer import analyze_result, format_summary
from ui.plots import draw_solar_system, draw_speed_graph


def create_default_state():
    return SolarSystem()


def run_simulation_view(solar_system, angle, speed, start_time, duration, camera_mode):
    simulation = Simulation(solar_system)
    result = simulation.run(
        launch_angle=angle,
        launch_speed=speed,
        start_time=start_time,
        duration=duration
    )
    analysis = analyze_result(result, solar_system)
    summary = format_summary(analysis)
    solar_fig = draw_solar_system(result, solar_system, start_time, camera_mode)
    speed_fig = draw_speed_graph(result)
    return solar_fig, speed_fig, summary


def update_simulation(solar_system, angle, speed, start_time, duration, camera_mode):
    return run_simulation_view(solar_system, angle, speed, start_time, duration, camera_mode)


def load_planet_settings(solar_system, planet_name):
    planet = solar_system.get_planet(planet_name)
    if planet is None:
        return 1.0, 1.0, 1.0
    return planet.mass_scale, planet.radius_scale, planet.influence_scale


def save_planet_settings(solar_system, planet_name, mass_scale, radius_scale, influence_scale, angle, speed, start_time, duration, camera_mode):
    solar_system.update_planet(
        planet_name,
        mass_scale,
        radius_scale,
        influence_scale
    )
    solar_fig, speed_fig, summary = run_simulation_view(
        solar_system,
        angle,
        speed,
        start_time,
        duration,
        camera_mode
    )
    return solar_system, solar_fig, speed_fig, summary


def reset_planets(solar_system, angle, speed, start_time, duration, camera_mode):
    solar_system.reset_to_default()
    solar_fig, speed_fig, summary = run_simulation_view(
        solar_system,
        angle,
        speed,
        start_time,
        duration,
        camera_mode
    )
    return solar_system, solar_fig, speed_fig, summary


def shift_time(solar_system, angle, speed, start_time, duration, camera_mode, delta):
    new_time = max(0.0, start_time + delta)
    solar_fig, speed_fig, summary = run_simulation_view(
        solar_system,
        angle,
        speed,
        new_time,
        duration,
        camera_mode
    )
    return new_time, solar_fig, speed_fig, summary