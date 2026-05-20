import numpy as np
import plotly.graph_objects as go
from utils.constants import PLOT_LIMIT


def _circle_points(radius, z=0.0, count=180):
    theta = np.linspace(0, 2 * np.pi, count)
    x = radius * np.cos(theta)
    y = radius * np.sin(theta)
    z_values = np.full_like(x, z)
    return x, y, z_values


def _camera(mode):
    if mode == "top":
        return dict(eye=dict(x=0.0, y=0.0, z=1.8))
    if mode == "angled":
        return dict(eye=dict(x=1.35, y=1.35, z=1.15))
    return dict(eye=dict(x=1.0, y=1.0, z=1.0))


def draw_solar_system(result, solar_system, start_time=0.0, camera_mode="angled"):
    fig = go.Figure()

    for planet in solar_system.planets:
        if planet.orbit_radius > 0:
            x, y, z = _circle_points(planet.orbit_radius)
            fig.add_trace(
                go.Scatter3d(
                    x=x,
                    y=y,
                    z=z,
                    mode="lines",
                    line=dict(width=2, color="rgba(180,180,180,0.35)"),
                    hoverinfo="skip",
                    showlegend=False
                )
            )

    display_time = float(result["times"][-1]) if result is not None and len(result["times"]) > 0 else start_time

    for planet in solar_system.planets:
        position = planet.position_at(display_time)

        ix, iy, iz = _circle_points(planet.influence_radius)
        fig.add_trace(
            go.Scatter3d(
                x=ix + position[0],
                y=iy + position[1],
                z=iz + position[2],
                mode="lines",
                line=dict(width=3, color="rgba(80,150,255,0.30)"),
                name=f"{planet.name} gravity range",
                hoverinfo="skip",
                showlegend=False
            )
        )

        fig.add_trace(
            go.Scatter3d(
                x=[position[0]],
                y=[position[1]],
                z=[position[2]],
                mode="markers+text",
                marker=dict(size=max(5, planet.radius * 0.8), color=planet.color),
                text=[planet.name],
                textposition="top center",
                name=planet.name,
                hovertemplate=(
                    f"<b>{planet.name}</b><br>"
                    f"mass: {planet.mass:.2f}<br>"
                    f"radius: {planet.radius:.2f}<br>"
                    f"influence: {planet.influence_radius:.2f}<extra></extra>"
                )
            )
        )

    if result is not None:
        trajectory = result["trajectory"]

        fig.add_trace(
            go.Scatter3d(
                x=trajectory[:, 0],
                y=trajectory[:, 1],
                z=trajectory[:, 2],
                mode="lines",
                line=dict(width=5, color="white"),
                name="spacecraft trajectory"
            )
        )

        fig.add_trace(
            go.Scatter3d(
                x=[trajectory[0, 0]],
                y=[trajectory[0, 1]],
                z=[trajectory[0, 2]],
                mode="markers",
                marker=dict(size=6, color="lime"),
                name="start"
            )
        )

        fig.add_trace(
            go.Scatter3d(
                x=[trajectory[-1, 0]],
                y=[trajectory[-1, 1]],
                z=[trajectory[-1, 2]],
                mode="markers",
                marker=dict(size=7, color="red"),
                name="final"
            )
        )

    fig.update_layout(
        template="plotly_dark",
        height=650,
        margin=dict(l=0, r=0, t=30, b=0),
        scene=dict(
            xaxis=dict(range=[-PLOT_LIMIT, PLOT_LIMIT], title="x"),
            yaxis=dict(range=[-PLOT_LIMIT, PLOT_LIMIT], title="y"),
            zaxis=dict(range=[-180, 180], title="z"),
            aspectmode="cube",
            camera=_camera(camera_mode)
        ),
        legend=dict(x=0.02, y=0.98)
    )

    return fig


def draw_speed_graph(result):
    fig = go.Figure()

    if result is not None:
        times = result["times"]
        velocities = result["velocities"]
        speeds = np.linalg.norm(velocities, axis=1)

        fig.add_trace(
            go.Scatter(
                x=times,
                y=speeds,
                mode="lines",
                name="speed"
            )
        )

    fig.update_layout(
        template="plotly_dark",
        height=300,
        margin=dict(l=40, r=20, t=30, b=40),
        xaxis_title="time",
        yaxis_title="spacecraft speed"
    )

    return fig