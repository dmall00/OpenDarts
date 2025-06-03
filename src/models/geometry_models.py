from dataclasses import dataclass

import numpy as np


@dataclass
class BoardGeometry:
    ring_width: float = 10.0
    bullseye_wire_width: float = 1.6
    board_diameter: float = 451.0
    outer_radius_ratio: float = 170.0 / 451.0


@dataclass
class CropParameters:
    crop_start: np.ndarray
    crop_size: float
    resolution: np.ndarray


@dataclass
class HomoGraphyMatrix:
    matrix: np.ndarray
    calibration_point_count: int
