import numpy as np
import plotly.graph_objects as go
from utils.constants import PLOT_LIMIT


DISPLAY_SIZES = {
    "Sun": 11,
    "Mercury": 3,
    "Venus": 4,
    "Earth": 4,
    "Mars": 4,
    "Jupiter": 7,
    "Saturn": 6
}


def _circle_points(radius, z=0.0, count=120):
    theta = np.linspace(0, 2 * np.pi, count)
    x = radius * np.cos(theta)
    y = radius * np.sin(theta)
    z_values = np.full_like(x, z)
    return x, y, z_values


def _camera(mode):
    if mode == "top":
        return dict(
            eye=dict(x=0.0, y=0.0, z=1.9),
            center=dict(x=0.0, y=0.0, z=0.0)
        )

    if mode == "intro":
        return dict(
            eye=dict(x=1.0, y=1.0, z=1.0),
            center=dict(x=0.0, y=0.0, z=0.0)
        )

    return dict(
        eye=dict(x=1.35, y=1.35, z=1.05),
        center=dict(x=0.0, y=0.0, z=0.0)
    )


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
                    line=dict(
                        width=1.2,
                        color="rgba(180,180,180,0.25)",
                        dash="dot"
                    ),
                    hoverinfo="skip",
                    showlegend=False
                )
            )

    if result is not None and len(result["times"]) > 0:
        display_time = float(result["times"][-1])
    else:
        display_time = float(start_time)

    for planet in solar_system.planets:
        position = planet.position_at(display_time)

        ix, iy, iz = _circle_points(planet.influence_radius, count=100)

        fig.add_trace(
            go.Scatter3d(
                x=ix + position[0],
                y=iy + position[1],
                z=iz + position[2],
                mode="lines",
                line=dict(
                    width=1.4,
                    color="rgba(70,150,255,0.22)"
                ),
                hoverinfo="skip",
                showlegend=False
            )
        )

        display_size = DISPLAY_SIZES.get(planet.name, 4)

        fig.add_trace(
            go.Scatter3d(
                x=[position[0]],
                y=[position[1]],
                z=[position[2]],
                mode="markers",
                marker=dict(
                    size=display_size,
                    color=planet.color,
                    opacity=1.0,
                    line=dict(width=0)
                ),
                name=planet.name,
                hovertemplate=(
                    f"<b>{planet.name}</b><br>"
                    f"mass: {planet.mass:.2f}<br>"
                    f"radius: {planet.radius:.2f}<br>"
                    f"influence: {planet.influence_radius:.2f}<extra></extra>"
                ),
                showlegend=False
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
                line=dict(
                    width=4,
                    color="rgba(80,240,255,0.95)"
                ),
                name="spacecraft trajectory",
                hoverinfo="skip",
                showlegend=False
            )
        )

        fig.add_trace(
            go.Scatter3d(
                x=[trajectory[0, 0]],
                y=[trajectory[0, 1]],
                z=[trajectory[0, 2]],
                mode="markers",
                marker=dict(
                    size=5,
                    color="lime"
                ),
                name="start",
                hovertemplate="<b>Start</b><extra></extra>",
                showlegend=False
            )
        )

        fig.add_trace(
            go.Scatter3d(
                x=[trajectory[-1, 0]],
                y=[trajectory[-1, 1]],
                z=[trajectory[-1, 2]],
                mode="markers",
                marker=dict(
                    size=6,
                    color="red"
                ),
                name="final",
                hovertemplate="<b>Final</b><extra></extra>",
                showlegend=False
            )
        )

    fig.update_layout(
        template="plotly_dark",
        height=650,
        margin=dict(l=0, r=0, t=0, b=0),
        paper_bgcolor="black",
        scene=dict(
            xaxis=dict(
                range=[-PLOT_LIMIT, PLOT_LIMIT],
                visible=False,
                showbackground=False,
                showgrid=False,
                zeroline=False
            ),
            yaxis=dict(
                range=[-PLOT_LIMIT, PLOT_LIMIT],
                visible=False,
                showbackground=False,
                showgrid=False,
                zeroline=False
            ),
            zaxis=dict(
                range=[-120, 120],
                visible=False,
                showbackground=False,
                showgrid=False,
                zeroline=False
            ),
            aspectmode="cube",
            camera=_camera(camera_mode),
            bgcolor="black"
        ),
        showlegend=False
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
                line=dict(width=3, color="rgba(80,240,255,0.95)"),
                name="speed"
            )
        )

    fig.update_layout(
        template="plotly_dark",
        height=260,
        margin=dict(l=40, r=20, t=20, b=35),
        paper_bgcolor="black",
        plot_bgcolor="black",
        xaxis_title="time",
        yaxis_title="speed",
        showlegend=False
    )

    return fig