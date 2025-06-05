"""Models for dart detection and scoring."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, Final, List, Optional, Tuple

import numpy as np

from detector.model.geometry_models import DART_CLASS_ID

DETECTOR_PATH = Path(__file__).parent.parent
MODEL_PATH = DETECTOR_PATH / "yolo"

class Code(Enum):
    """Enum containing error codes and their corresponding messages."""

    SUCCESS = (0, "Successful dart detection")
    YOLO_ERROR = (1, "Yolo model inference failed")
    HOMOGRAPHY = (2, "Homography matrix calculation failed")
    MISSING_CALIBRATION_POINTS = (3, "Not enough calibration points detected")
    UNKNOWN = (4, "Unknown error")

    def __init__(self, code: int, message: str) -> None:
        self.code = code
        self.message = message


@dataclass
class DartDetection:
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

    dart_class = DART_CLASS_ID
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
        from detector.model.geometry_models import DART_CLASS_ID

        return cls.mapping.get(class_id) == "dart" or class_id == DART_CLASS_ID


@dataclass
class HomoGraphyMatrix:
    """Represents a homography transformation matrix for dartboard calibration."""

    matrix: np.ndarray
    calibration_point_count: int


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

    DEFAULT_CONFIDENCE_THRESHOLD = 0.6  # Default confidence threshold for detections
    DEFAULT_TARGET_IMAGE_SIZE = (800, 800)  # Default target image size for processing
    MIN_CALIBRATION_POINTS_REQUIRED = 4  # Minimum calibration points required for homography
    MAX_ALLOWED_DARTS = 3  # Maximum number of darts allowed in detection
    DEFAULT_STABILIZING_THRESHOLD = 0.1  # Default threshold for dart position stabilization

    dart_scorer_model_path: str = str(MODEL_PATH / "dart_scorer.pt")
    dartboard_model_path: str = str(MODEL_PATH / "dartboard_detection.pt")
    confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD
    target_image_size: Tuple[int, int] = DEFAULT_TARGET_IMAGE_SIZE
    min_calibration_points: int = MIN_CALIBRATION_POINTS_REQUIRED
    max_allowed_darts: int = MAX_ALLOWED_DARTS
    stabilizing_threshold: float = DEFAULT_STABILIZING_THRESHOLD


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


class DartDetectionError(Exception):
    """Exception raised when dart detection fails."""

    def __init__(self, error_code: Code, cause: Optional[BaseException] = None, details: Optional[str] = None) -> None:
        self.error_code = error_code
        self.message = error_code.message
        self.details = details
        message = f"[Error {self.error_code.code}] {self.message}"
        if details:
            message += f": {details}"
        if cause:
            self.__cause__ = cause
        super().__init__(message)

    def __str__(self) -> str:
        if self.details:
            return f"[Error {self.error_code.code}] {self.message}: {self.details}"
        return f"[Error {self.error_code.code}] {self.message}"
