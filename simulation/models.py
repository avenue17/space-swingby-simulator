from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    angle: float
    vertical_angle: float
    speed: float
    start_time: float
    mode: str
    date: str
    mass_scales: Dict[str, float] = Field(default_factory=dict)
    radius_scales: Dict[str, float] = Field(default_factory=dict)


class PredictResponse(BaseModel):
    positions: List[List[float]]
    speeds: List[float]
    times: List[float]
    collision: Optional[str]
    initial_speed: float
    closest_name: str
    closest_distance: float
    closest_influence_radius: float
    inside_influence_name: Optional[str]