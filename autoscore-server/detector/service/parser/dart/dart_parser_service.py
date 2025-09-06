"""Service for parsing darts from YOLO detections."""

import logging
from typing import List

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import OriginalDartPosition, YoloDetection
from detector.service.parser.abstract_parser import AbstractYoloParser


class DartParserService(AbstractYoloParser):
    """Service for parsing dart detections from YOLO results."""

    logger = logging.getLogger(__qualname__)

    def __init__(self, config: ProcessingConfig) -> None:
        super().__init__(config)

    def _get_threshold(self) -> float:
        return self._config.dart_confidence_threshold

    def _is_correct_class(self, detection: YoloDetection) -> bool:
        return detection.is_dart

    def parse(self, detections: List[YoloDetection]) -> List[OriginalDartPosition]:
        """Create dart detections from dart detections."""
        dart_detections = self._filter_detections(detections)
        dart_positions: List[OriginalDartPosition] = []

        if len(dart_detections) == 0:
            self.logger.info("No dart detections found in YOLO results")
            return dart_positions

        sorted_detections = sorted(dart_detections, key=lambda d: d.confidence, reverse=True)

        max_darts = min(self._config.max_allowed_darts, len(sorted_detections))

        if len(sorted_detections) > max_darts:
            self.logger.warning("Found %s darts, but only using the %s highest confidence ones", len(sorted_detections), max_darts)

        for detection in sorted_detections[:max_darts]:
            if self._config.dart_confidence_threshold > 0.0 and detection.confidence < self._config.dart_confidence_threshold:
                self.logger.info(
                    "Dart detection at (%s, %s) with confidence %s is below minimum threshold %s, skipping",
                    f"{detection.center_x:.3f}",
                    f"{detection.center_y:.3f}",
                    f"{detection.confidence:.3f}",
                    f"{self._config.dart_confidence_threshold:.3f}",
                )
                continue
            dart_position = OriginalDartPosition(x=detection.center_x, y=detection.center_y, confidence=detection.confidence)
            dart_positions.append(dart_position)
            self.logger.debug(
                "Added dart detection at position (%s, %s) with confidence %s",
                f"{detection.center_x:.3f}",
                f"{detection.center_y:.3f}",
                f"{detection.confidence:.3f}",
            )

        return dart_positions
