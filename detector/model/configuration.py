"""Contains Configurations for dart detection and scoring."""

import json
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Tuple

from pydantic import BaseModel, Field

from detector.model import MODEL_PATH


@dataclass(frozen=True)
class ImmutableConfig:
    """Class for immutable fixed configurations."""

    dart_scorer_model_path: str = str(MODEL_PATH / "dart_scorer.pt")  # Path to the dart scorer model, immutable
    dartboard_model_path: str = str(MODEL_PATH / "dartboard_detection.pt")  # Path to the dartboard detection model, immutable


class CalibrationPointDetectionMode(Enum):
    """Enum for calibration point detection modes."""

    HIGHEST_CONFIDENCE = 1  # Detect points with the highest confidence
    GEOMETRIC = 2  # Smart detection with filtering based on confidence and distance
    FILTER_DUPLICATES = 3  # Discard duplicate calibration points


class ProcessingConfig(BaseModel):
    """Configurations for dart detection and scoring."""

    calibration_confidence_threshold: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence threshold for calibration point detections, 0.0 disables filtering. Must be between 0.0 and 1.0.",
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
        default=True,
        description="Enable cropping model for dart detection",
    )
    calibration_detection_mode: CalibrationPointDetectionMode = Field(
        default=CalibrationPointDetectionMode.GEOMETRIC,
        description="Mode for calibration point detection",
    )
    calibration_position_tolerance: float = Field(
        default=0.15,
        description="Tolerance for calibration point position matching, in pixels.",
    )

    @classmethod
    def from_json(cls, json_path: Path) -> "ProcessingConfig":
        """Load configuration from a JSON file."""
        with open(json_path, encoding="utf-8") as f:  # noqa: PTH123
            data = json.load(f)
        return cls(**data)
