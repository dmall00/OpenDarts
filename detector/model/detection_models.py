"""Models for dart detection and scoring."""
import time
from abc import ABC
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, List, Optional, Sequence, TypeVar

import numpy as np

from detector.model.detection_result_code import ResultCode
from detector.model.yolo_dart_class_mapping import YoloDartClassMapping

if TYPE_CHECKING:
    from detector.model.configuration import ProcessingConfig


@dataclass
class Point2D(ABC):
    """Mixin that automatically implements to_array() for classes with x, y attributes."""

    x: float
    y: float

    def to_array(self) -> np.ndarray:
        """Automatically convert x, y attributes to a NumPy array."""
        if not (hasattr(self, "x") and hasattr(self, "y")):
            msg = f"{self.__class__.__qualname__} must have 'x' and 'y' attributes"
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
class TransformedDartPosition(DartPosition):
    """Represents a dart position transformed to the dartboard coordinate system."""


@dataclass
class OriginalDartPosition(DartPosition):
    """Represents the original dart position in the image coordinate system before transformation."""

    confidence: float


@dataclass
class CalibrationPoint(YoloPoint):
    """Represents a calibration point for the dartboard."""

    class_id: int
    message: str

    @property
    def point_type(self) -> str:
        """Get the type of the calibration point based on its class ID."""
        return YoloDartClassMapping.get_class_name(self.class_id)


@dataclass
class DartScore:
    """Represents the score of a dart based on its position."""

    score_string: str
    score_value: int


@dataclass
class DartDetection:
    """Dart detection and scoring result of a single dart."""

    original_position: OriginalDartPosition
    transformed_position: TransformedDartPosition
    dart_score: DartScore

    @property
    def confidence(self) -> float:
        """Get the confidence of the original dart position."""
        return self.original_position.confidence


@dataclass
class YoloDartParseResult:
    """Result of YOLO model result parsing."""

    original_positions: List[OriginalDartPosition]
    calibration_points: List[CalibrationPoint]


@dataclass
class AbstractResult(ABC):
    """Abstract base class for results."""

    processing_time: float
    result_code: ResultCode
    message: Optional[str] = None
    details: Optional[str] = None
    creation_time: float = field(default_factory=time.time)

    @property
    def success(self) -> bool:
        """Check if the result is successful."""
        return self.result_code is ResultCode.SUCCESS


@dataclass
class CalibrationResult(AbstractResult):
    """Result of the calibration process."""

    homography_matrix: HomoGraphyMatrix = None  # type: ignore
    calibration_points: List[CalibrationPoint] = field(default_factory=list)


@dataclass
class ScoringResult(AbstractResult):
    """Result of the scoring process."""

    dart_detections: List[DartDetection] = field(default_factory=list)

    @property
    def total_score(self) -> int:
        """Calculate the total score from all dart scores."""
        return sum(dart_score.score_value for score in self.dart_detections if (dart_score := score.dart_score) is not None)

    def __str__(self) -> str:
        darts_info = [
            f"Dart {i + 1}: {dart.dart_score.score_string} ({dart.confidence:.2f})" for i, dart in enumerate(self.dart_detections)
        ]
        return f"Score: {self.total_score} | Darts: {', '.join(darts_info) if darts_info else 'None'}"


@dataclass
class DetectionResult(AbstractResult):
    """Result of the dart detection process, including calibration and scoring."""

    calibration_result: Optional[CalibrationResult] = None
    scoring_result: Optional[ScoringResult] = None

    @property
    def total_score(self) -> int:
        """Calculate the total score from all dart scores."""
        return self.scoring_result.total_score if self.scoring_result else 0

    @property
    def success(self) -> bool:
        """Check if the detection result is successful."""
        return (
            self.calibration_result is not None
            and self.calibration_result.success
            and self.scoring_result is not None
            and self.scoring_result.success
        )


P = TypeVar("P", bound=YoloPoint)
