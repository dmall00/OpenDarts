"""Models for dart detection and scoring."""

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, Final, List, Optional, Tuple

import numpy as np

from src.models.exception import Code
from src.models.geometry_models import HomoGraphyMatrix

ROOT_PATH = Path(__file__).parent.parent.parent
MODEL_PATH = ROOT_PATH / "models"
IMAGES_PATH = ROOT_PATH / "images"


@dataclass
class Detection:
    """Represents a single detection from YOLO."""

    class_id: int
    confidence: float
    center_x: float
    center_y: float

    @property
    def is_dart(self) -> bool:
        """Check if the detection corresponds to a dart class."""
        return ClassMapping.is_dart(self.class_id)

    @property
    def is_high_confidence(self) -> bool:
        """Check if the detection confidence is above the configured threshold."""
        return self.confidence >= ProcessingConfig.confidence_threshold


class ClassMapping:
    """Maps YOLO class IDs to human-readable class names and checks for dart classes."""

    dart_class = 4  # Class ID for dart
    mapping: Final[Dict[int, str]] = {
        0: "20",
        1: "3",
        2: "11",
        3: "6",
        dart_class: "dart",
        5: "11",
        6: "15",
    }

    @staticmethod
    def get_class_name(class_id: int) -> str:
        """Get the class name for a given class ID."""
        return ClassMapping.mapping.get(class_id, str(class_id))

    @classmethod
    def is_dart(cls, class_id: int) -> bool:
        """Check if the class ID corresponds to a dart."""
        return cls.mapping.get(class_id) == "dart" or class_id == 4  # noqa: PLR2004


@dataclass
class DartPosition:
    """Represents the position of a dart on the dartboard."""

    x: float
    y: float
    confidence: Optional[float] = None

    def to_array(self) -> np.ndarray:
        """Convert DartPosition to a NumPy array."""
        return np.array([self.x, self.y])


@dataclass
class CalibrationPoint:
    """Represents a calibration point for the dartboard."""

    x: float
    y: float
    confidence: float
    point_type: str

    def to_array(self) -> np.ndarray:
        """Convert CalibrationPoint to a NumPy array."""
        return np.array([self.x, self.y])


@dataclass
class DartScore:
    """Represents the score of a dart based on its position."""

    score_string: str
    score_value: int


@dataclass
class ProcessingConfig:
    """Configurations for dart detection and scoring."""

    model_path: str = str(MODEL_PATH / "dart_scorer.pt")
    confidence_threshold: float = 0.6
    target_image_size: Tuple[int, int] = (800, 800)
    min_calibration_points: int = 4
    max_allowed_darts: int = 3
    stabilizing_threshold: float = 0.1


@dataclass
class CalibrationPoints:
    """Collection of CalibrationPoint objects."""

    points: List[CalibrationPoint]

    def to_ndarray(self) -> np.ndarray:
        """Convert CalibrationPoints to a NumPy array."""
        if not self.points:
            return np.array([])
        return np.array([point.to_array() for point in self.points])


@dataclass
class DartPositions:
    """Collection of DartPosition objects."""

    positions: List[DartPosition]

    def to_ndarray(self) -> np.ndarray:
        """Convert DartPositions to a NumPy array."""
        if not self.positions:
            return np.array([])
        return np.array([point.to_array() for point in self.positions])


@dataclass
class YoloDartParseResult:
    """Result of YOLO model result parsing."""

    dart_positions: DartPositions
    calibration_points: CalibrationPoints


@dataclass
class DartResult:
    """Dart detection and scoring result."""

    dart_positions: DartPositions
    dart_scores: List[DartScore]
    original_dart_positions: DartPositions

    def get_total_score(self) -> int:
        """Calculate the total score from all dart scores."""
        return sum(score.score_value for score in self.dart_scores)


@dataclass
class DetectionResult:
    """Result of the dart detection process."""

    dart_result: Optional[DartResult]
    processing_time: float
    homography_matrix: Optional[HomoGraphyMatrix]
    calibration_points: Optional[CalibrationPoints]
    code: Code
    message: str
    creation_time: datetime = field(default_factory=datetime.now)
