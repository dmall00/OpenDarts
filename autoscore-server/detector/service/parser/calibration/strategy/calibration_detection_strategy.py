"""Abstract class for Calibration Detection Strategy."""

from abc import ABC, abstractmethod
from typing import List, Optional

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import YoloDetection


class CalibrationDetectionStrategy(ABC):
    """Abstract strategy for calibration point detection."""

    @abstractmethod
    def select_calibration_point(
        self, calib_index: int, detections: List[YoloDetection], config: ProcessingConfig
    ) -> Optional[YoloDetection]:
        """Select the best calibration point from multiple detections."""
