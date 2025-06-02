import logging

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class BoardCalibrator:
    def __init__(self):
        self.calibration_coords = self._calculate_calibration_coordinates()

    def _calculate_calibration_coordinates(self):
        calibration_coords = -np.ones((6, 2))
        outer_radius = 170.0 / 451.0
        calibration_angles = {'20_3': 81, '11_6': -9, '9_15': 27}

        coord_index = 0
        for segment_pair, angle_deg in calibration_angles.items():
            angle_rad = np.deg2rad(angle_deg)
            x_offset = outer_radius * np.cos(angle_rad)
            y_offset = outer_radius * np.sin(angle_rad)

            calibration_coords[coord_index] = [0.5 - x_offset, 0.5 - y_offset]
            calibration_coords[coord_index + 1] = [0.5 + x_offset, 0.5 + y_offset]
            coord_index += 2

        logger.debug(f"Calculated calibration coordinates: {calibration_coords}")
        return calibration_coords

    def has_sufficient_points(self, calibration_coords):
        missing_points = np.count_nonzero(calibration_coords == -1) // 2
        return missing_points <= 2

    def calculate_homography(self, calibration_coords, image_shape):
        logger.debug("Calculating homography transformation matrix")
        valid_mask = np.all(np.logical_and(calibration_coords >= 0, calibration_coords <= 1), axis=1)
        valid_count = np.count_nonzero(valid_mask)

        logger.debug(f"Using {valid_count} valid calibration points for homography")
        if valid_count < 4:
            logger.warning(f"Only {valid_count} calibration points available - homography may be unstable")

        homography_result = cv2.findHomography(
            calibration_coords[valid_mask] * image_shape,
            self.calibration_coords[valid_mask] * image_shape
        )

        logger.debug("Homography matrix calculated successfully")
        return homography_result
