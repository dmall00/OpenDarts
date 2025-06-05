"""Contains Configurations for dart detection and scoring."""
from dataclasses import dataclass
from typing import Tuple

from detector.model import MODEL_PATH


@dataclass
class ProcessingConfig:
    """Configurations for dart detection and scoring."""

    dart_scorer_model_path: str = str(MODEL_PATH / "dart_scorer.pt")  # Path to the dart scorer model, immutable
    dartboard_model_path: str = str(MODEL_PATH / "dartboard_detection.pt")  # Path to the dartboard detection model, immutable
    confidence_threshold: float = 0.6  # Default confidence threshold for detections
    target_image_size: Tuple[int, int] = (800, 800)  # Default target image size for processing
    min_calibration_points: int = 4  # Minimum calibration points required for homography, immutable
    max_allowed_darts: int = 3  # Maximum number of darts allowed in detection
