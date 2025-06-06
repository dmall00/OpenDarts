"""Implementations of calibration detection strategies."""

import logging
import math
from typing import List, Optional, Tuple, override

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import YoloDetection
from detector.model.geometry_models import BOARD_CENTER_COORDINATE
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


class GeometricDetectionStrategy(CalibrationDetectionStrategy):
    """Strategy that uses geometric constraints and confidence to select the best calibration point."""

    logger = logging.getLogger(__name__)

    @override
    def select_calibration_point(
        self, calib_index: int, detections: List[YoloDetection], config: ProcessingConfig
    ) -> Optional[YoloDetection]:
        """
        Filter multiple detections for a calibration point using geometric validation,.

        Select the most likely calibration point from multiple detections using a geometric validation approach.
        First filters detections based on expected angular positions on the dartboard, then scores remaining
        candidates using a weighted combination (70% position accuracy, 30% detection confidence).
        """
        if not detections:
            return None

        valid_detections = self._filter_geometrically_valid_detections(calib_index, detections)

        if not valid_detections:
            self.logger.warning("No geometrically valid detections for calibration point %s, using highest confidence", calib_index)
            return max(detections, key=lambda d: d.confidence)

        # Score remaining valid detections
        best_detection = self._select_best_detection(calib_index, valid_detections)

        self.logger.info(
            "Selected calibration point %s at (%.3f, %.3f) with confidence %.3f",
            calib_index,
            best_detection.center_x,
            best_detection.center_y,
            best_detection.confidence,
        )

        return best_detection

    def _filter_geometrically_valid_detections(self, calib_index: int, detections: List[YoloDetection]) -> List[YoloDetection]:
        """Filter out detections that are in geometrically impossible positions."""
        valid_detections = []

        for detection in detections:
            if self._is_geometrically_valid(calib_index, detection):
                valid_detections.append(detection)
            else:
                self.logger.info(
                    "Filtered out geometrically invalid detection for point %s at (%.3f, %.3f)",
                    calib_index,
                    detection.center_x,
                    detection.center_y,
                )

        return valid_detections

    def _is_geometrically_valid(self, calib_index: int, detection: YoloDetection) -> bool:
        """Check if a detection is in a geometrically plausible position for the calibration point."""
        angle = self._calculate_angle_from_center(detection)
        expected_angle_range = self._get_expected_angle_range(calib_index)

        if not expected_angle_range:
            return True  # No constraints for unknown calibration points

        return self._is_angle_in_range(angle, expected_angle_range)

    def _select_best_detection(self, calib_index: int, detections: List[YoloDetection]) -> YoloDetection:
        """Select the best detection from geometrically valid candidates."""
        expected_position = self._get_expected_position(calib_index)

        if not expected_position:
            # No position constraints, use the highest confidence
            return max(detections, key=lambda d: d.confidence)

        # Score based on distance to expected position and confidence
        scored_detections = []
        for detection in detections:
            distance_score = self._calculate_distance_score(detection, expected_position)
            confidence_score = detection.confidence

            # Simple weighted average: 70% distance, 30% confidence
            total_score = 0.7 * distance_score + 0.3 * confidence_score
            scored_detections.append((detection, total_score))

            self.logger.debug(
                "Calibration point %s at (%.3f, %.3f): distance_score=%.3f, confidence=%.3f, total=%.3f",
                calib_index,
                detection.center_x,
                detection.center_y,
                distance_score,
                confidence_score,
                total_score,
            )

        return max(scored_detections, key=lambda x: x[1])[0]

    @staticmethod
    def _calculate_angle_from_center(detection: YoloDetection) -> float:
        """Calculate angle in degrees from dartboard center (0° = right, 90° = up)."""
        dx = detection.center_x - BOARD_CENTER_COORDINATE
        dy = detection.center_y - BOARD_CENTER_COORDINATE

        angle_rad = math.atan2(dy, dx)
        angle_deg = math.degrees(angle_rad)

        # Normalize to 0-360 range
        return (angle_deg + 360) % 360

    @staticmethod
    def _get_expected_angle_range(calib_index: int) -> Optional[Tuple[float, float]]:
        """Get the expected angle range (min, max) for a calibration point in degrees."""
        # Based on standard dartboard layout with some tolerance
        angle_ranges = {
            0: (350, 30),  # 20: top area, crosses 0°
            1: (75, 105),  # 6: right side
            2: (165, 195),  # 3: bottom
            3: (255, 285),  # 11: left side
            4: (300, 330),  # 14: top-left
            5: (30, 60),  # 9: top-right
        }
        return angle_ranges.get(calib_index)

    @staticmethod
    def _is_angle_in_range(angle: float, angle_range: Tuple[float, float]) -> bool:
        """Check if angle is within the expected range, handling wraparound at 0°/360°."""
        min_angle, max_angle = angle_range

        if min_angle > max_angle:  # Range crosses 0° (e.g., 350° to 30°)
            return angle >= min_angle or angle <= max_angle
        # Normal range
        return min_angle <= angle <= max_angle

    @staticmethod
    def _get_expected_position(calib_index: int) -> Optional[Tuple[float, float]]:
        """Get the expected normalized (x, y) position for a calibration point."""
        # Positions based on standard dartboard layout
        positions = {
            0: (0.5, 0.15),  # 20: top
            1: (0.85, 0.5),  # 6: right
            2: (0.5, 0.85),  # 3: bottom
            3: (0.15, 0.5),  # 11: left
            4: (0.25, 0.25),  # 14: top-left
            5: (0.75, 0.25),  # 9: top-right
        }
        return positions.get(calib_index)

    @staticmethod
    def _calculate_distance_score(detection: YoloDetection, expected_pos: Tuple[float, float]) -> float:
        """Calculate a score (0-1) based on distance to expected position. Closer = higher score."""
        expected_x, expected_y = expected_pos

        distance = math.sqrt((detection.center_x - expected_x) ** 2 + (detection.center_y - expected_y) ** 2)

        # Maximum reasonable distance for a calibration point to still be valid
        max_distance = 0.3  # 30% of image width/height

        # Convert distance to score (closer = higher score)
        return max(0.0, 1.0 - (distance / max_distance))


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
