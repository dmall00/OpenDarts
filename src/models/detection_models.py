from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import List, Tuple, Optional

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
        return ClassMapping.is_dart(self.class_id)

    @property
    def is_high_confidence(self) -> bool:
        return self.confidence >= ProcessingConfig.confidence_threshold


class ClassMapping:
    mapping = {0: '20', 1: '3', 2: '11', 3: '6', 4: 'dart', 6: '15', 5: '11'}

    @staticmethod
    def get_class_name(class_id: int) -> str:
        return ClassMapping.mapping.get(class_id, str(class_id))

    @classmethod
    def is_dart(cls, class_id: int) -> bool:
        return cls.mapping.get(class_id) == 'dart' or class_id == 4


@dataclass
class DartPosition:
    x: float
    y: float
    confidence: Optional[float] = None

    def to_array(self) -> np.ndarray:
        return np.array([self.x, self.y])


@dataclass
class CalibrationPoint:
    x: float
    y: float
    confidence: float
    point_type: str

    def to_array(self) -> np.ndarray:
        return np.array([self.x, self.y])


@dataclass
class DartScore:
    score_string: str
    score_value: int


@dataclass
class ProcessingConfig:
    model_path: str = str(MODEL_PATH / "dart_scorer.pt")
    confidence_threshold: float = 0.6
    repeat_threshold: int = 1
    queue_size: int = 5
    target_image_size: Tuple[int, int] = (800, 800)


@dataclass
class CalibrationPoints:
    points: List[CalibrationPoint]

    def to_ndarray(self) -> np.ndarray:
        if not self.points:
            return np.array([])
        return np.array([point.to_array() for point in self.points])


@dataclass
class DartPositions:
    positions: List[DartPosition]

    def to_ndarray(self) -> np.ndarray:
        if not self.positions:
            return np.array([])
        return np.array([point.to_array() for point in self.positions])


@dataclass
class YoloDartParseResult:
    dart_positions: DartPositions
    calibration_points: CalibrationPoints


@dataclass
class DartResult:
    dart_positions: DartPositions
    dart_scores: List[DartScore]
    original_dart_positions: DartPositions

    def get_total_score(self) -> int:
        return sum(score.score_value for score in self.dart_scores)


@dataclass
class DetectionResult:
    dart_result: Optional[DartResult]
    processing_time: float
    homography_matrix: Optional[HomoGraphyMatrix]
    calibration_points: Optional[CalibrationPoints]
    code: Code
    message: str
    creation_time: datetime = field(default_factory=datetime.now)
