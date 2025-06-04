import logging
from typing import List

import numpy as np
from ultralytics import YOLO
from ultralytics.engine.results import Results

from src.models.detection_models import (
    CalibrationPoint,
    DartPosition,
    ClassMapping, Detection, ProcessingConfig, YoloDartParseResult, CalibrationPoints, DartPositions,
)
from src.models.exception import DartDetectionFailed, Code

logger = logging.getLogger(__name__)


class YoloDartImageProcessor:

    def __init__(self):
        logger.info(f"Loading YOLO model from: {ProcessingConfig.model_path}")
        self._model = YOLO(ProcessingConfig.model_path)

    def detect(self, image: np.ndarray) -> Results:
        """Run YOLO inference on image."""
        logger.info("Running YOLO inference...")
        try:
            results = list(self._model(image, verbose=False))
            result = results[0]
            logger.info(f"YOLO inference complete. Detected {len(result.boxes)} objects")
            return result

        except Exception as e:
            error_msg = f"YOLO inference failed: {str(e)}"
            raise DartDetectionFailed(Code.YOLO_ERROR, e, error_msg)

    def extract_detections(self, yolo_result: Results) -> YoloDartParseResult:
        """
        Extract calibration points and dart coordinates from YOLO results.
        """
        logger.debug("Processing YOLO detection output")

        detections = self.__parse_yolo_results(yolo_result)

        dart_detections = [d for d in detections if d.is_dart]
        calibration_detections = [d for d in detections if not d.is_dart and d.is_high_confidence]

        dart_positions = self.__create_dart_positions(dart_detections)
        calibration_points = self.__create_calibration_points(calibration_detections)

        logger.info(f"Extracted {len(calibration_points)} calibration points and {len(dart_positions)} darts")
        return YoloDartParseResult(calibration_points=CalibrationPoints(calibration_points),
                                   dart_positions=DartPositions(dart_positions))

    def __parse_yolo_results(self, yolo_result: Results) -> List[Detection]:
        """Convert YOLO results into our internal Detection format."""
        detections = []

        classes = yolo_result.boxes.cls
        boxes = yolo_result.boxes.xywhn
        confidences = yolo_result.boxes.conf

        for i in range(len(classes)):
            detection = Detection(
                class_id=int(classes[i].item()),
                confidence=float(confidences[i].item()),
                center_x=float(boxes[i][0].item()),
                center_y=float(boxes[i][1].item())
            )
            detections.append(detection)

        return detections

    def __create_dart_positions(self, dart_detections: List[Detection]) -> List[DartPosition]:
        """Create dart positions from dart detections (max 3 darts)."""
        dart_positions = []

        if len(dart_detections) > 3:
            logger.warning(f"Found {len(dart_detections)} darts, but only using the first 3")

        for detection in dart_detections[:3]:
            dart_position = DartPosition(
                x=detection.center_x,
                y=detection.center_y,
                confidence=detection.confidence
            )
            dart_positions.append(dart_position)
            logger.debug(
                f"Added dart at position ({detection.center_x:.3f}, {detection.center_y:.3f}) with confidence {detection.confidence:.3f}")

        return dart_positions

    def __create_calibration_points(self, calibration_detections: List[Detection]) -> List[CalibrationPoint]:
        """Create calibration points from calibration detections, handling duplicates and missing points."""
        detections_by_index = self.__group_calibration_detections(calibration_detections)

        calibration_points = []

        for calib_index in range(6):
            if calib_index not in detections_by_index:
                calibration_points.append(self.__create_invalid_calibration_point(calib_index, "missing"))
                continue

            detections = detections_by_index[calib_index]

            if len(detections) > 1:
                logger.info(
                    f"Found {len(detections)} duplicate calibration points for index {calib_index}, marking as invalid")
                calibration_points.append(self.__create_invalid_calibration_point(calib_index, "duplicate"))
                continue

            # Valid single detection
            detection = detections[0]
            point_type = ClassMapping.get_class_name(detection.class_id)

            calibration_point = CalibrationPoint(
                x=detection.center_x,
                y=detection.center_y,
                confidence=detection.confidence,
                point_type=point_type
            )
            calibration_points.append(calibration_point)
            logger.info(f"Added calibration point {point_type} with confidence {detection.confidence:.2f}")

        return calibration_points

    def __create_invalid_calibration_point(self, calib_index: int, reason: str) -> CalibrationPoint:
        """Create an invalid calibration point placeholder."""
        return CalibrationPoint(
            x=-1.0,
            y=-1.0,
            confidence=0.0,
            point_type=f"{reason}_{calib_index}"
        )

    def __group_calibration_detections(self, calibration_detections: List[Detection]) -> dict[int, List[Detection]]:
        """Group calibration detections by their calibration index."""
        detections_by_index = {}

        for detection in calibration_detections:
            calib_index = detection.class_id if detection.class_id < 4 else detection.class_id - 1

            if calib_index not in detections_by_index:
                detections_by_index[calib_index] = []
            detections_by_index[calib_index].append(detection)

        return detections_by_index
