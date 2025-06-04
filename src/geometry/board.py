"""Geometry and scoring model for a dartboard."""

from typing import Tuple

import numpy as np

from src.models.geometry_models import BoardGeometry


class DartBoard:
    """Domain model representing a dartboard with its geometry and scoring rules."""

    def __init__(self) -> None:
        self._geometry = BoardGeometry()
        self._setup_scoring_regions()
        self._setup_segments()
        self._setup_calibration_points()

    def _setup_scoring_regions(self) -> None:
        """Initialize scoring regions and their radii."""
        self._scoring_names = np.array(["DB", "SB", "S", "T", "S", "D", "miss"])
        self.scoring_radii = np.array([
            0, 6.35, 15.9,
            107.4 - self._geometry.ring_width, 107.4,
            170.0 - self._geometry.ring_width, 170.0,
        ])

        # Adjust for wire width
        self.scoring_radii[1:3] += (self._geometry.bullseye_wire_width / 2)
        self.scoring_radii /= self._geometry.board_diameter

    def _setup_segments(self) -> None:
        """Initialize dartboard segments and their number mappings."""
        self.segment_angles = np.array([-9, 9, 27, 45, 63, -81, -63, -45, -27])
        self._segment_numbers = np.array([
            [6, 11], [10, 14], [15, 9], [2, 12], [17, 5],
            [19, 1], [7, 18], [16, 4], [8, 13],
        ])

    def _setup_calibration_points(self) -> None:
        """Initialize reference calibration coordinates for homography calculation."""
        self._calibration_reference_coords = self._calculate_calibration_reference_coordinates()

    def _calculate_calibration_reference_coordinates(self) -> np.ndarray:
        """Calculate the reference calibration coordinates on the dartboard."""
        calibration_coords = -np.ones((6, 2))
        outer_radius = self._geometry.outer_radius_ratio

        calibration_angles = self._get_calibration_angles()

        coord_index = 0
        for angle_deg in calibration_angles.values():
            coords_pair = self._calculate_coordinate_pair(angle_deg, outer_radius)
            calibration_coords[coord_index:coord_index + 2] = coords_pair
            coord_index += 2

        return calibration_coords

    def _get_calibration_angles(self) -> dict:
        """Get the calibration angles for specific dartboard segments."""
        return {
            "20_3": 81,  # Between segments 20 and 3
            "11_6": -9,  # Between segments 11 and 6
            "9_15": 27,  # Between segments 9 and 15
        }

    def _calculate_coordinate_pair(self, angle_deg: float, outer_radius: float) -> np.ndarray:
        """Calculate a pair of coordinates for the given angle."""
        angle_rad = np.deg2rad(angle_deg)
        x_offset = outer_radius * np.cos(angle_rad)
        y_offset = outer_radius * np.sin(angle_rad)

        return np.array([
            [0.5 - x_offset, 0.5 - y_offset],
            [0.5 + x_offset, 0.5 + y_offset],
        ])

    def get_calibration_reference_coordinates(self) -> np.ndarray:
        """Get the reference calibration coordinates for homography calculation."""
        return self._calibration_reference_coords.copy()

    def get_segment_number(self, angle: float, position: np.ndarray) -> int:
        """Determine the dartboard segment number for a given angle and position."""
        if abs(angle) >= 81:
            possible_numbers = np.array([3, 20])
        else:
            segment_index = self._find_segment_index(angle)
            possible_numbers = self._segment_numbers[segment_index]

        coordinate_index = 0 if np.array_equal(possible_numbers, [6, 11]) else 1
        return int(possible_numbers[0] if position[coordinate_index] > 0.5 else possible_numbers[1])

    def get_scoring_region(self, position: np.ndarray) -> str:
        """Determine the scoring region (single, double, triple, etc.) for a position."""
        distance_from_center = self._calculate_distance_from_center(position)
        region_index = np.argmax(self.scoring_radii[distance_from_center > self.scoring_radii])
        return str(self._scoring_names[region_index])

    def calculate_score(self, segment_number: int, scoring_region: str) -> Tuple[str, int]:
        """Calculate the final score for a dart."""
        scoring_rules = {
            "DB": ("DB", 50),
            "SB": ("SB", 25),
            "S": (f"S{segment_number}", segment_number),
            "T": (f"T{segment_number}", segment_number * 3),
            "D": (f"D{segment_number}", segment_number * 2),
            "miss": ("miss", 0),
        }
        return scoring_rules[scoring_region]

    def _find_segment_index(self, angle: float) -> int:
        """Find the segment index for a given angle."""
        valid_angles = self.segment_angles[self.segment_angles <= angle]
        if len(valid_angles) == 0:
            return 0

        max_valid_angle = max(valid_angles)
        return int(np.where(self.segment_angles == max_valid_angle)[0][0])

    def _calculate_distance_from_center(self, position: np.ndarray) -> float:
        """Calculate Euclidean distance from board center."""
        return float(np.sqrt((position[0] - 0.5) ** 2 + (position[1] - 0.5) ** 2))
