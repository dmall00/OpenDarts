"""Utility geometry models for dartboard calibration and scoring."""

from dataclasses import dataclass

import numpy as np


@dataclass
class BoardGeometry:
    """Represents real world geometry of a dartboard for calibration and scoring."""

    ring_width: float = 10.0
    bullseye_wire_width: float = 1.6
    board_diameter: float = 451.0
    outer_radius_ratio: float = 170.0 / 451.0


@dataclass
class HomoGraphyMatrix:
    """Represents a homography transformation matrix for dartboard calibration."""

    matrix: np.ndarray
    calibration_point_count: int
