"""Contains a  class for YOLO-based dart detection."""

import logging
import math
from typing import Dict, List, Optional, Tuple

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
            logger.warning("No dart detections found in YOLO results")

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
                if self.__config.enable_smart_calibration_filtering:
                    logger.info(
                        "Found %s duplicate calibration points for index %s, applying smart filtering", len(detections), calib_index
                    )
                    best_detection = self.__select_best_calibration_point(calib_index, detections)
                    if best_detection:
                        calibration_points.append(self.__create_calibration_point_from_detection(best_detection))
                        continue

                logger.info("Found %s duplicate calibration points for index %s, marking as invalid", len(detections), calib_index)
                calibration_points.append(self.__create_invalid_calibration_point(calib_index, "duplicate"))
                continue

            # Valid single detection
            detection = detections[0]
            calibration_points.append(self.__create_calibration_point_from_detection(detection))

        return calibration_points

    def __select_best_calibration_point(self, calib_index: int, detections: List[YoloDetection]) -> Optional[YoloDetection]:
        """Select the most geometrically plausible calibration point from duplicates."""
        if not detections:
            return None

        # Get expected position for this calibration index
        expected_pos = self.__get_expected_calibration_position(calib_index)
        if not expected_pos:
            # Fallback to highest confidence if we can't determine expected position
            return max(detections, key=lambda d: d.confidence)

        # Score each detection based on geometric plausibility and confidence
        scored_detections = []
        for detection in detections:
            score = self.__calculate_calibration_score(detection, expected_pos, calib_index)
            scored_detections.append((detection, score))
            logger.debug("Calibration point %s at (%.3f, %.3f) scored %.3f", calib_index, detection.center_x, detection.center_y, score)

        # Return the highest scoring detection
        best_detection = max(scored_detections, key=lambda x: x[1])[0]
        logger.info(
            "Selected calibration point %s at (%.3f, %.3f) with confidence %.3f",
            calib_index,
            best_detection.center_x,
            best_detection.center_y,
            best_detection.confidence,
        )

        return best_detection

    @staticmethod
    def __create_invalid_calibration_point(calib_index: int, reason: str) -> CalibrationPoint:
        """Create an invalid calibration point placeholder."""
        return CalibrationPoint(
            x=-1.0,
            y=-1.0,
            confidence=0.0,
            point_type=f"{reason}_{calib_index}",
        )

    def __get_expected_calibration_position(self, calib_index: int) -> Optional[Tuple[float, float]]:
        """Get the expected normalized position for a calibration point on a standard dartboard."""
        # Dartboard calibration points (0-5) correspond to specific dartboard numbers
        # Assuming dartboard center at (0.5, 0.5) and standard dartboard layout

        # Map calibration indices to dartboard numbers and their angular positions
        calibration_mapping = {
            0: (20, 0),  # Top (12 o'clock)
            1: (6, 90),  # Right (3 o'clock)
            2: (3, 180),  # Bottom (6 o'clock)
            3: (11, 270),  # Left (9 o'clock)
            4: (14, 315),  # Top-left diagonal
            5: (9, 45),  # Top-right diagonal
        }

        if calib_index not in calibration_mapping:
            return None

        number, angle_deg = calibration_mapping[calib_index]

        # Convert to radians and calculate position
        # Calibration points are typically on the outer ring
        angle_rad = math.radians(angle_deg)
        radius = 0.35  # Approximate radius for outer dartboard numbers

        center_x, center_y = 0.5, 0.5
        expected_x = center_x + radius * math.cos(angle_rad)
        expected_y = center_y + radius * math.sin(angle_rad)

        return (expected_x, expected_y)

    def __calculate_calibration_score(self, detection: YoloDetection, expected_pos: Tuple[float, float], calib_index: int) -> float:
        """Calculate a score for how likely this detection is the correct calibration point."""
        expected_x, expected_y = expected_pos

        # Calculate distance from expected position
        distance = math.sqrt((detection.center_x - expected_x) ** 2 + (detection.center_y - expected_y) ** 2)

        # Normalize distance score (closer is better)
        max_distance = self.__config.calibration_position_tolerance
        distance_score = max(0, 1 - (distance / max_distance))

        # Confidence score (higher confidence is better)
        confidence_score = detection.confidence

        # Apply specific geometric constraints based on calibration index
        geometric_score = self.__apply_geometric_constraints(detection, calib_index)

        # Weighted combination of scores
        # Distance is most important, then confidence, then geometric constraints
        total_score = (0.5 * distance_score + 0.3 * confidence_score + 0.2 * geometric_score)

        return total_score

    def __apply_geometric_constraints(self, detection: YoloDetection, calib_index: int) -> float:
        """Apply specific geometric constraints based on dartboard knowledge."""
        x, y = detection.center_x, detection.center_y
        center_x, center_y = 0.5, 0.5

        # Calculate angle from center
        angle = math.atan2(y - center_y, x - center_x)
        angle_deg = math.degrees(angle) % 360

        # Define expected angle ranges for each calibration point
        expected_angles = {
            0: (350, 10),  # Top (20)
            1: (80, 100),  # Right (6)
            2: (170, 190),  # Bottom (3)
            3: (260, 280),  # Left (11)
            4: (305, 325),  # Top-left (14)
            5: (35, 55),  # Top-right (9)
        }

        if calib_index not in expected_angles:
            return 0.5  # Neutral score

        min_angle, max_angle = expected_angles[calib_index]

        # Handle angle wrapping around 0/360
        if min_angle > max_angle:  # Wraps around 0
            if angle_deg >= min_angle or angle_deg <= max_angle:
                return 1.0
        elif min_angle <= angle_deg <= max_angle:
            return 1.0

        # Calculate how far off the angle is
        if min_angle > max_angle:  # Wraps around 0
            dist_to_range = min(
                abs(angle_deg - min_angle) if angle_deg > 180 else abs(angle_deg + 360 - min_angle),
                abs(angle_deg - max_angle) if angle_deg < 180 else abs(angle_deg - 360 - max_angle),
            )
        else:
            dist_to_range = min(abs(angle_deg - min_angle), abs(angle_deg - max_angle))
            if min_angle < angle_deg < max_angle:
                dist_to_range = 0

        # Convert distance to score (max penalty of 45 degrees)
        return max(0, 1 - (dist_to_range / 45))

    def __create_calibration_point_from_detection(self, detection: YoloDetection) -> CalibrationPoint:
        """Create a calibration point from a YOLO detection."""
        point_type = YoloDartClassMapping.get_class_name(detection.class_id)

        calibration_point = CalibrationPoint(
            x=detection.center_x,
            y=detection.center_y,
            confidence=detection.confidence,
            point_type=point_type,
        )

        logger.debug("Created calibration point %s with confidence %s",
                     point_type, f"{detection.confidence:.2f}")
        return calibration_point

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
