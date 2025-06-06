"""Implementations of calibration detection strategies."""
import logging
import math
from typing import List, Optional, Tuple, override

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import YoloDetection
from detector.service.parser.calibration.strategy.calibration_detection_strategy import CalibrationDetectionStrategy


class HighestConfidenceStrategy(CalibrationDetectionStrategy):
    """Strategy that selects calibration point with the highest confidence."""

    @override
    def select_calibration_point(
        self, calib_index: int, detections: List[YoloDetection], config: ProcessingConfig
    ) -> Optional[YoloDetection]:
        if not detections:
            return None
        return max(detections, key=lambda d: d.confidence)


class SmartDetectionStrategy(CalibrationDetectionStrategy):
    """Strategy that uses smart filtering based on confidence and geometric position."""

    logger = logging.getLogger(__name__)

    @override
    def select_calibration_point(
        self, calib_index: int, detections: List[YoloDetection], config: ProcessingConfig
    ) -> Optional[YoloDetection]:
        if not detections:
            return None

        expected_pos = self._get_expected_calibration_position(calib_index)
        if not expected_pos:
            return max(detections, key=lambda d: d.confidence)

        scored_detections = []
        for detection in detections:
            score = self._calculate_calibration_score(detection, expected_pos, calib_index, config)
            scored_detections.append((detection, score))
            self.logger.debug(
                "Calibration point %s at (%.3f, %.3f) scored %.3f", calib_index, detection.center_x, detection.center_y, score
            )

        best_detection = max(scored_detections, key=lambda x: x[1])[0]
        self.logger.info(
            "Selected calibration point %s at (%.3f, %.3f) with confidence %.3f",
            calib_index,
            best_detection.center_x,
            best_detection.center_y,
            best_detection.confidence,
        )

        return best_detection

    @staticmethod
    def _get_expected_calibration_position(calib_index: int) -> Optional[Tuple[float, float]]:
        """Get the expected normalized position for a calibration point on a standard dartboard."""
        calibration_mapping = {
            0: (20, 0),
            1: (6, 90),
            2: (3, 180),
            3: (11, 270),
            4: (14, 315),
            5: (9, 45),
        }

        if calib_index not in calibration_mapping:
            return None

        number, angle_deg = calibration_mapping[calib_index]
        angle_rad = math.radians(angle_deg)
        radius = 0.35

        center_x, center_y = 0.5, 0.5
        expected_x = center_x + radius * math.cos(angle_rad)
        expected_y = center_y + radius * math.sin(angle_rad)

        return (expected_x, expected_y)

    def _calculate_calibration_score(self, detection: YoloDetection, expected_pos: Tuple[float, float],
                                     calib_index: int, config: ProcessingConfig) -> float:
        """Calculate a score for how likely this detection is the correct calibration point."""
        expected_x, expected_y = expected_pos

        distance = math.sqrt((detection.center_x - expected_x) ** 2 + (detection.center_y - expected_y) ** 2)
        max_distance = config.calibration_position_tolerance
        distance_score = max(0.0, 1 - (distance / max_distance))

        confidence_score = detection.confidence
        geometric_score = self._apply_geometric_constraints(detection, calib_index)

        return 0.5 * distance_score + 0.3 * confidence_score + 0.2 * geometric_score

    @staticmethod
    def _apply_geometric_constraints(detection: YoloDetection, calib_index: int) -> float:
        """Apply specific geometric constraints based on dartboard knowledge."""
        x, y = detection.center_x, detection.center_y
        center_x, center_y = 0.5, 0.5

        angle = math.atan2(y - center_y, x - center_x)
        angle_deg = math.degrees(angle) % 360

        expected_angles = {
            0: (350, 10),
            1: (80, 100),
            2: (170, 190),
            3: (260, 280),
            4: (305, 325),
            5: (35, 55),
        }

        if calib_index not in expected_angles:
            return 0.5

        min_angle, max_angle = expected_angles[calib_index]

        if min_angle > max_angle:
            if angle_deg >= min_angle or angle_deg <= max_angle:
                return 1.0
        elif min_angle <= angle_deg <= max_angle:
            return 1.0

        if min_angle > max_angle:
            dist_to_range = min(
                abs(angle_deg - min_angle) if angle_deg > 180 else abs(angle_deg + 360 - min_angle),  # noqa: PLR2004
                abs(angle_deg - max_angle) if angle_deg < 180 else abs(angle_deg - 360 - max_angle),  # noqa: PLR2004
            )
        else:
            dist_to_range = min(abs(angle_deg - min_angle), abs(angle_deg - max_angle))
            if min_angle < angle_deg < max_angle:
                dist_to_range = 0

        return max(0.0, 1 - (dist_to_range / 45))


class FilterDuplicatesStrategy(CalibrationDetectionStrategy):
    """Strategy that filters out duplicate calibration points."""

    @override
    def select_calibration_point(
        self, calib_index: int, detections: List[YoloDetection], config: ProcessingConfig
    ) -> Optional[YoloDetection]:
        if not detections:
            return None
        if len(detections) > 1:
            return None
        return detections[0]
