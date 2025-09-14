"""Abstract class for YOLO parser."""

from abc import ABC, abstractmethod
from typing import Generic, List, TypeVar

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import YoloDetection

P = TypeVar("P")


class AbstractYoloParser(Generic[P], ABC):  # noqa: UP046
    """Abstract class for YOLO parser."""

    def __init__(self, config: ProcessingConfig) -> None:
        self._config = config

    @abstractmethod
    def parse(self, detections: List[YoloDetection]) -> List[P]:
        """Extract detections from YOLO results."""
        msg = "This method should be implemented by subclasses."
        raise NotImplementedError(msg)

    @abstractmethod
    def _get_threshold(self) -> float:
        """Get the confidence threshold for filtering detections."""
        msg = "This method should be implemented by subclasses."
        raise NotImplementedError(msg)

    @abstractmethod
    def _is_correct_class(self, detection: YoloDetection) -> bool:
        """Check if the detection class is correct and supported."""
        msg = "This method should be implemented by subclasses."
        raise NotImplementedError(msg)

    def _filter_detections(self, detections: List[YoloDetection]) -> List[YoloDetection]:
        """Filter detections based on confidence threshold."""
        return [
            detection for detection in detections if detection.confidence >= self._get_threshold() and self._is_correct_class(detection)
        ]
