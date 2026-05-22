G = 0.9
OUTPUT_DT = 0.08
DURATION = 900
SOFTENING = 8
TIME_FLOW = 20
ORBIT_DISTANCE_SCALE = 1.75
WORLD_LIMIT = 5200

MAX_SUBSTEPS = 6

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