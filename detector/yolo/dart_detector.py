"""Contains a  class for YOLO-based dart detection."""

import logging
from typing import Dict, List

import numpy as np
import torch
from ultralytics import YOLO
from ultralytics.engine.results import Results

from detector.model.configuration import ImmutableConfig, ProcessingConfig
from detector.model.detection_models import (
    CalibrationPoint,
    Dart2dPosition,
    DartDetection,
    YoloDartParseResult,
    YoloDetection,
)
from detector.model.detection_result_code import DetectionResultCode
from detector.model.exception import DartDetectionError
from detector.model.yolo_dart_class_mapping import YoloDartClassMapping

logger = logging.getLogger(__name__)


class YoloDartImageProcessor:
    """Processor for running YOLO inference and extracting dart positions and calibration points."""

    def __init__(self, config: ProcessingConfig) -> None:
        self.__config = config
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Loading YOLO model from: %s to device %s", ImmutableConfig.dart_scorer_model_path, device)
        self._model = YOLO(ImmutableConfig.dart_scorer_model_path)
        self._model.to(device)

    def detect(self, image: np.ndarray) -> Results:
        """Run YOLO inference on image."""
        logger.info("Running YOLO inference...")
        try:
            results = list(self._model(image, verbose=False))
            result = results[0]
            logger.info("YOLO inference complete. Detected %s objects", len(result.boxes))
            return result  # noqa: TRY300
        except Exception as e:
            error_msg = f"YOLO inference failed: {e!s}"
            raise DartDetectionError(DetectionResultCode.YOLO_ERROR, e, error_msg) from e

    def extract_detections(self, yolo_result: Results) -> YoloDartParseResult:
        """Extract calibration points and dart coordinates from YOLO results."""
        logger.debug("Processing YOLO detection output")

        detections = self.__parse_yolo_results(yolo_result)

        dart_detections = [d for d in detections if d.is_dart]
        calibration_detections = [d for d in detections if not d.is_dart and d.is_high_confidence(self.__config)]

        dart_detection_results = self.__create_dart_detections(dart_detections)
        calibration_points = self.__create_calibration_points(calibration_detections)

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

    def __create_dart_detections(self, dart_detections: List[YoloDetection]) -> List[DartDetection]:
        """Create dart detections from dart detections (max 3 darts)."""
        dart_detection_results = []

        if len(dart_detections) > self.__config.max_allowed_darts:
            logger.warning("Found %s darts, but only using the first %s", len(dart_detections), self.__config.max_allowed_darts)
        if len(dart_detections) == 0:
            raise DartDetectionError(DetectionResultCode.NO_DARTS, details="No dart detections found")

        for detection in dart_detections[: self.__config.max_allowed_darts]:
            if self.__config.dart_confidence_threshold > 0.0 and detection.confidence < self.__config.dart_confidence_threshold:
                logger.info(
                    "Dart detection at (%s, %s) with confidence %s is below minimum threshold %s, skipping",
                    f"{detection.center_x:.3f}",
                    f"{detection.center_y:.3f}",
                    f"{detection.confidence:.3f}",
                    f"{self.__config.dart_confidence_threshold:.3f}",
                )
                continue
            dart_position = Dart2dPosition(x=detection.center_x, y=detection.center_y)
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

    def __create_calibration_points(self, calibration_detections: List[YoloDetection]) -> List[CalibrationPoint]:
        """Create calibration points from calibration detections, handling duplicates and missing points."""
        detections_by_index = self.__group_calibration_detections(calibration_detections)

        calibration_points = []

        for calib_index in range(6):
            if calib_index not in detections_by_index:
                calibration_points.append(self.__create_invalid_calibration_point(calib_index, "missing"))
                continue

            detections = detections_by_index[calib_index]

            if len(detections) > 1:
                logger.info("Found %s duplicate calibration points for index %s, marking as invalid", len(detections), calib_index)
                calibration_points.append(self.__create_invalid_calibration_point(calib_index, "duplicate"))
                continue

            # Valid single detection
            detection = detections[0]
            point_type = YoloDartClassMapping.get_class_name(detection.class_id)

            calibration_point = CalibrationPoint(
                x=detection.center_x,
                y=detection.center_y,
                confidence=detection.confidence,
                point_type=point_type,
            )
            calibration_points.append(calibration_point)
            logger.info("Added calibration point %s with confidence %s", point_type, f"{detection.confidence:.2f}")

        return calibration_points

    @staticmethod
    def __create_invalid_calibration_point(calib_index: int, reason: str) -> CalibrationPoint:
        """Create an invalid calibration point placeholder."""
        return CalibrationPoint(
            x=-1.0,
            y=-1.0,
            confidence=0.0,
            point_type=f"{reason}_{calib_index}",
        )

    @staticmethod
    def __group_calibration_detections(calibration_detections: List[YoloDetection]) -> Dict[int, List[YoloDetection]]:
        """Group calibration detections by their calibration index."""
        detections_by_index: Dict[int, List[YoloDetection]] = {}

        for detection in calibration_detections:
            calib_index = detection.class_id if detection.class_id < YoloDartClassMapping.dart_class else detection.class_id - 1

            if calib_index not in detections_by_index:
                detections_by_index[calib_index] = []
            detections_by_index[calib_index].append(detection)

        return detections_by_index
