"""A parser for YOLO detection results."""

import logging
from typing import List

from ultralytics.engine.results import Results

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import YoloDartParseResult, YoloDetection
from detector.service.parser.calibration.calibration_point_parser_service import CalibrationPointParserService
from detector.service.parser.dart.dart_parser_service import DartParserService

logger = logging.getLogger(__name__)


class YoloResultParser:
    """A parser for YOLO detection results."""

    def __init__(self, config: ProcessingConfig) -> None:
        self.__config = config
        self.__dart_parser_service = DartParserService(config)
        self.__calibration_parser_service = CalibrationPointParserService(config)

    def extract_detections(self, yolo_result: Results) -> YoloDartParseResult:
        """Extract calibration points and dart coordinates from YOLO results."""
        logger.debug("Processing YOLO detection output")

        detections = self.__parse_yolo_results(yolo_result)
        dart_detection_results = self.__dart_parser_service.parse(detections)
        calibration_points = self.__calibration_parser_service.parse(detections)
        logger.info("Extracted %s calibration points and %s darts", len(calibration_points), len(dart_detection_results))
        return YoloDartParseResult(calibration_points=calibration_points, dart_detections=dart_detection_results)

    @staticmethod
    def __parse_yolo_results(yolo_result: Results) -> List[YoloDetection]:
        """Convert YOLO results into our internal Detection format."""
        detections = []

        classes = yolo_result.boxes.cls
        boxes = yolo_result.boxes.xywhn
        confidences = yolo_result.boxes.conf

        for i in range(len(classes)):
            detection = YoloDetection(
                class_id=int(classes[i].item()),
                confidence=float(confidences[i].item()),
                center_x=float(boxes[i][0].item()),
                center_y=float(boxes[i][1].item()),
            )
            detections.append(detection)

        return detections
