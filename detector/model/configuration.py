"""Contains Configurations for dart detection and scoring."""

from dataclasses import dataclass
from typing import Tuple

from pydantic import BaseModel, Field

from detector.model import MODEL_PATH


@dataclass(frozen=True)
class ImmutableConfig:
    """Class for immutable fixed configurations."""

    dart_scorer_model_path: str = str(MODEL_PATH / "dart_scorer.pt")  # Path to the dart scorer model, immutable
    dartboard_model_path: str = str(MODEL_PATH / "dartboard_detection.pt")  # Path to the dartboard detection model, immutable


class ProcessingConfig(BaseModel):
    """Configurations for dart detection and scoring."""

    calibration_confidence_threshold: float = Field(
        default=0.6,
        ge=0.0,
        le=1.0,
        description="Confidence threshold for calibration point detections. Must be between 0.0 and 1.0.",
    )
    dart_confidence_threshold: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence threshold for dart detection, 0.0 disables filtering. Must be between 0.0 and 1.0.",
    )
    target_image_size: Tuple[int, int] = Field(
        default=(800, 800),
        description="Target image size for processing. Recommended to be 800x800 pixels.",
    )
    min_calibration_points: int = Field(
        default=4,
        description="Minimum calibration points required for homography. Must be at least 4.",
        ge=4,
    )
    max_allowed_darts: int = Field(
        default=3,
        description="Maximum number of darts allowed in detection",
    )
    enable_cropping_model: bool = Field(
        default=False,
        description="Enable cropping model for dart detection",
    )
