import logging

import cv2
import numpy as np

from src.domain.board import DartBoard
from src.models.detection_models import ProcessingConfig
from src.models.geometry_models import HomoGraphyMatrix

logger = logging.getLogger(__name__)


class CalibrationService:
    """Service for dartboard calibration and homography calculation."""

    def __init__(self):
        self._dartboard = DartBoard()
        self._reference_coordinates = self._dartboard.get_calibration_reference_coordinates()
        self._user_calibration = -np.ones((6, 2))  # User manual calibration override

    def calculate_homography(self, calibration_coords: np.ndarray,
                             image_shape: float = ProcessingConfig.target_image_size[0]) -> HomoGraphyMatrix:
        """
        Calculate homography transformation matrix from calibration points.
        """
        logger.debug("Calculating homography transformation matrix")
        valid_points_info = self._get_valid_points_info(calibration_coords)
        self._ensure_minimum_points(valid_points_info['count'])

        homography_matrix = self._compute_homography_matrix(
            calibration_coords,
            valid_points_info['mask'],
            image_shape
        )

        return self._create_homography_result(homography_matrix, valid_points_info['count'])

    def _get_valid_points_info(self, calibration_coords: np.ndarray) -> dict:
        """Get information about valid calibration points."""
        valid_mask = self._get_valid_points_mask(calibration_coords)
        valid_count = np.count_nonzero(valid_mask)

        logger.debug(f"Found {valid_count} valid calibration points")

        return {
            'mask': valid_mask,
            'count': valid_count
        }

    def _ensure_minimum_points(self, valid_count: int) -> None:
        """Ensure we have the minimum required valid points."""
        if valid_count < 4:
            logger.warning(f"Insufficient valid calibration points: {valid_count}/4 minimum required")
            raise ValueError(f"Only {valid_count} valid calibration points found, minimum 4 required")

    def _compute_homography_matrix(self, calibration_coords: np.ndarray,
                                   valid_mask: np.ndarray,
                                   image_shape: float) -> np.ndarray:
        """Compute the homography matrix using OpenCV."""
        try:
            homography_matrix, _ = cv2.findHomography(
                calibration_coords[valid_mask] * image_shape,
                self._reference_coordinates[valid_mask] * image_shape,
                method=cv2.RANSAC
            )

            if homography_matrix is None:
                logger.error("OpenCV findHomography returned None")
                raise ValueError("Failed to compute homography matrix - OpenCV returned None")

            return homography_matrix

        except Exception as e:
            logger.error(f"Homography calculation failed: {str(e)}", exc_info=True)
            raise ValueError(f"Homography calculation failed: {str(e)}")

    def _create_homography_result(self, homography_matrix: np.ndarray,
                                  valid_count: int) -> HomoGraphyMatrix:
        """Create the final homography result object."""
        logger.info(f"Homography matrix calculated successfully using {valid_count} points")
        return HomoGraphyMatrix(
            matrix=homography_matrix,
            calibration_point_count=valid_count
        )


    def _get_valid_points_mask(self, calibration_coords: np.ndarray) -> np.ndarray:
        """Get mask for valid calibration points within image bounds."""
        return np.all(
            np.logical_and(calibration_coords >= 0, calibration_coords <= 1),
            axis=1
        )

