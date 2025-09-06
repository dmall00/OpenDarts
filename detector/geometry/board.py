"""Geometry and scoring model for a dartboard."""

from typing import Dict

import numpy as np

from detector.model.geometry_models import (
    BOARD_CENTER_COORDINATE,
    BOARD_DIAMETER,
    BULLSEYE_WIRE_WIDTH,
    DARTBOARD_SEGMENT_ANGLES,
    DARTBOARD_SEGMENT_NUMBERS,
    DOUBLE_BULL_RADIUS,
    DOUBLE_RING_INNER_RADIUS,
    DOUBLE_RING_OUTER_RADIUS,
    OUTER_RADIUS_RATIO,
    SCORING_REGION_NAMES,
    SEGMENT_9_15_ANGLE,
    SEGMENT_11_6_ANGLE,
    SEGMENT_20_3_ANGLE_THRESHOLD,
    SINGLE_BULL_RADIUS,
    TRIPLE_RING_INNER_RADIUS,
    TRIPLE_RING_OUTER_RADIUS,
)


class DartBoard:
    """Domain model representing a dartboard with its geometry and scoring rules."""

    def __init__(self) -> None:
        self.__setup_scoring_regions()
        self.__setup_segments()
        self.__setup_calibration_points()

    def get_calibration_reference_coordinates(self) -> np.ndarray:
        """Get the reference calibration coordinates for homography calculation."""
        return self._calibration_reference_coords.copy()

    def get_segment_number(self, angle: float, position: np.ndarray) -> int:
        """Determine the dartboard segment number for a given angle and position."""
        if abs(angle) >= SEGMENT_20_3_ANGLE_THRESHOLD:
            possible_numbers = np.array([3, 20])
        else:
            segment_index = self.__find_segment_index(angle)
            possible_numbers = self._segment_numbers[segment_index]

        coordinate_index = 0 if np.array_equal(possible_numbers, [6, 11]) else 1
        return int(possible_numbers[0] if position[coordinate_index] > BOARD_CENTER_COORDINATE else possible_numbers[1])

    def get_scoring_region(self, position: np.ndarray) -> str:
        """Determine the scoring region (single, double, triple, etc.) for a position."""
        distance_from_center = self.__calculate_distance_from_center(position)
        region_index = np.argmax(self.scoring_radii[distance_from_center > self.scoring_radii])
        return str(self._scoring_names[region_index])

    def __setup_scoring_regions(self) -> None:
        """Initialize scoring regions and their radii."""
        self._scoring_names = np.array(SCORING_REGION_NAMES)
        self.scoring_radii = np.array(
            [
                0,
                DOUBLE_BULL_RADIUS,
                SINGLE_BULL_RADIUS,
                TRIPLE_RING_INNER_RADIUS,
                TRIPLE_RING_OUTER_RADIUS,
                DOUBLE_RING_INNER_RADIUS,
                DOUBLE_RING_OUTER_RADIUS,
            ],
        )

        # Adjust for wire width
        self.scoring_radii[1:3] += BULLSEYE_WIRE_WIDTH / 2
        self.scoring_radii /= BOARD_DIAMETER

    def __setup_segments(self) -> None:
        """Initialize dartboard segments and their number mappings."""
        self.segment_angles = np.array(DARTBOARD_SEGMENT_ANGLES)
        self._segment_numbers = np.array(DARTBOARD_SEGMENT_NUMBERS)

    def __calculate_calibration_reference_coordinates(self) -> np.ndarray:
        """Calculate the reference calibration coordinates on the dartboard."""
        calibration_coords = -np.ones((6, 2))
        outer_radius = OUTER_RADIUS_RATIO

        calibration_angles = self.__get_calibration_angles()

        coord_index = 0
        for angle_deg in calibration_angles.values():
            coords_pair = self.__calculate_coordinate_pair(angle_deg, outer_radius)
            calibration_coords[coord_index : coord_index + 2] = coords_pair
            coord_index += 2

        return calibration_coords

    def __setup_calibration_points(self) -> None:
        """Initialize reference calibration coordinates for homography calculation."""
        self._calibration_reference_coords = self.__calculate_calibration_reference_coordinates()

    @staticmethod
    def __get_calibration_angles() -> Dict[str, int]:
        """Get the calibration angles for specific dartboard segments."""
        return {
            "20_3": SEGMENT_20_3_ANGLE_THRESHOLD,
            "11_6": SEGMENT_11_6_ANGLE,
            "9_15": SEGMENT_9_15_ANGLE,
        }

    @staticmethod
    def __calculate_coordinate_pair(angle_deg: float, outer_radius: float) -> np.ndarray:
        angle_rad = np.deg2rad(angle_deg)
        x_offset = outer_radius * np.cos(angle_rad)
        y_offset = outer_radius * np.sin(angle_rad)

        return np.array(
            [
                [BOARD_CENTER_COORDINATE - x_offset, BOARD_CENTER_COORDINATE - y_offset],
                [BOARD_CENTER_COORDINATE + x_offset, BOARD_CENTER_COORDINATE + y_offset],
            ],
        )

    def __find_segment_index(self, angle: float) -> int:
        """Find the segment index for a given angle."""
        valid_angles = self.segment_angles[self.segment_angles <= angle]
        if len(valid_angles) == 0:
            return 0

        max_valid_angle = max(valid_angles)
        return int(np.where(self.segment_angles == max_valid_angle)[0][0])

    @staticmethod
    def __calculate_distance_from_center(position: np.ndarray) -> float:
        """Calculate Euclidean distance from board center."""
        return float(np.sqrt((position[0] - BOARD_CENTER_COORDINATE) ** 2 + (position[1] - BOARD_CENTER_COORDINATE) ** 2))
