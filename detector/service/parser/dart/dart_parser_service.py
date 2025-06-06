"""Service for parsing darts from YOLO detections."""

import logging
from typing import List

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import DartDetection, DartPosition, YoloDetection
from detector.service.parser.abstract_parser import AbstractYoloParser

logger = logging.getLogger(__name__)


class DartParserService(AbstractYoloParser):
    """Service for parsing dart detections from YOLO results."""

    def __init__(self, config: ProcessingConfig) -> None:
        super().__init__(config)

    def _get_threshold(self) -> float:
        return self._config.dart_confidence_threshold

    def _is_correct_class(self, detection: YoloDetection) -> bool:
        return detection.is_dart

    def parse(self, detections: List[YoloDetection]) -> List[DartDetection]:
        """Create dart detections from dart detections."""
        dart_detections = self._filter_detections(detections)
        dart_detection_results: List[DartDetection] = []

        if len(dart_detections) == 0:
            logger.warning("No dart detections found in YOLO results")
            return dart_detection_results

        sorted_detections = sorted(dart_detections, key=lambda d: d.confidence, reverse=True)

        max_darts = min(self._config.max_allowed_darts, len(sorted_detections))

        if len(sorted_detections) > max_darts:
            logger.warning("Found %s darts, but only using the %s highest confidence ones", len(sorted_detections), max_darts)

        for detection in sorted_detections[:max_darts]:
            if self._config.dart_confidence_threshold > 0.0 and detection.confidence < self._config.dart_confidence_threshold:
                logger.info(
                    "Dart detection at (%s, %s) with confidence %s is below minimum threshold %s, skipping",
                    f"{detection.center_x:.3f}",
                    f"{detection.center_y:.3f}",
                    f"{detection.confidence:.3f}",
                    f"{self._config.dart_confidence_threshold:.3f}",
                )
                continue
            dart_position = DartPosition(x=detection.center_x, y=detection.center_y)
            dart_detection = DartDetection(
                original_dart_position=dart_position,
                confidence=detection.confidence,
            )
            dart_detection_results.append(dart_detection)
            logger.debug(
                "Added dart detection at position (%s, %s) with confidence %s",
                f"{detection.center_x:.3f}",
                f"{detection.center_y:.3f}",
                f"{detection.confidence:.3f}",
            )

        return dart_detection_results
