"""Models for dart detection and scoring."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional, Sequence, TypeVar

import numpy as np

from detector.model.detection_result_code import DetectionResultCode
from detector.model.yolo_dart_class_mapping import YoloDartClassMapping

if TYPE_CHECKING:
    from detector.model.configuration import ProcessingConfig


@dataclass
class Point2D:
    """Mixin that automatically implements to_array() for classes with x, y attributes."""

    x: float
    y: float

    def to_array(self) -> np.ndarray:
        """Automatically convert x, y attributes to a NumPy array."""
        if not (hasattr(self, "x") and hasattr(self, "y")):
            msg = f"{self.__class__.__name__} must have 'x' and 'y' attributes"
            raise AttributeError(msg)
        return np.array([self.x, self.y])

    @staticmethod
    def to_ndarray(xy_objects: Sequence["Point2D"]) -> np.ndarray:
        """Convert a sequence of XYToArray objects to a single NumPy array."""
        if not xy_objects:
            return np.empty((0, 2))
        return np.array([obj.to_array() for obj in xy_objects])


@dataclass
class YoloPoint(Point2D):
    """Represents a point from a yolo object with confidence."""

    confidence: float


@dataclass
class YoloDetection:
    """Represents a single detection from YOLO."""

    class_id: int
    confidence: float
    center_x: float
    center_y: float

    @property
    def get_dart_class(self) -> str:
        """Get the class name of the detection."""
        return YoloDartClassMapping.get_class_name(self.class_id)

    @property
    def is_dart(self) -> bool:
        """Check if the detection corresponds to a dart class."""
        return YoloDartClassMapping.is_dart(self.class_id)

    def is_high_confidence(self, config: "ProcessingConfig") -> bool:
        """Check if the detection confidence is above the configured threshold."""
        return self.confidence >= config.calibration_confidence_threshold


@dataclass
class HomoGraphyMatrix:
    """Represents a homography transformation matrix for dartboard calibration."""

    matrix: np.ndarray
    calibration_point_count: int


@dataclass
class DartPosition(Point2D):
    """Represents the position of a dart on the dartboard."""


@dataclass
class CalibrationPoint(YoloPoint):
    """Represents a calibration point for the dartboard."""

    point_type: str


@dataclass
class DartScore:
    """Represents the score of a dart based on its position."""

    score_string: str
    score_value: int


@dataclass
class DartDetection:
    """Dart detection and scoring result of a single dart."""

    original_dart_position: DartPosition
    confidence: float
    dart_position: Optional[DartPosition] = None
    dart_score: Optional[DartScore] = None


@dataclass
class YoloDartParseResult:
    """Result of YOLO model result parsing."""

    dart_detections: List[DartDetection]
    calibration_points: List[CalibrationPoint]


@dataclass
class DetectionResult:
    """Result of the dart detection process."""

    dart_detections: List[DartDetection]
    processing_time: float
    homography_matrix: Optional[HomoGraphyMatrix]
    calibration_points: List[CalibrationPoint]
    result_code: DetectionResultCode
    message: str
    creation_time: datetime = field(default_factory=datetime.now)

    def get_total_score(self) -> int:
        """Calculate the total score from all dart scores."""
        return sum(dart_score.score_value for score in self.dart_detections if (dart_score := score.dart_score) is not None)

    def is_success(self) -> bool:
        """Check if the detection result is successful."""
        return self is not None and self.result_code is DetectionResultCode.SUCCESS


P = TypeVar("P", bound=YoloPoint)
