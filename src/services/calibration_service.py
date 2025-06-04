"""Service for calculating homography for dartboard calibration."""

import logging

import cv2
import numpy as np

from src.geometry.board import DartBoard
from src.models.detection_models import HomoGraphyMatrix, ProcessingConfig
from src.models.exception import Code, DartDetectionError

logger = logging.getLogger(__name__)


class CalibrationService:
    """Service for dartboard calibration and homography calculation."""

    def __init__(self) -> None:
        self._dartboard = DartBoard()
        self._reference_coordinates = self._dartboard.get_calibration_reference_coordinates()
        self._user_calibration = -np.ones((6, 2))  # User manual calibration override

    def calculate_homography(
        self, calibration_coords: np.ndarray, image_shape: float = ProcessingConfig.target_image_size[0],
    ) -> HomoGraphyMatrix:
        """Calculate homography transformation matrix from calibration points."""
        logger.debug("Calculating homography transformation matrix")
        valid_points_info = self._get_valid_points_info(calibration_coords)
        self._ensure_minimum_points(valid_points_info["count"])

        homography_matrix = self._compute_homography_matrix(
            calibration_coords,
            valid_points_info["mask"],
            image_shape,
        )

        return self.__create_homography_result(homography_matrix, valid_points_info["count"])

    def _get_valid_points_info(self, calibration_coords: np.ndarray) -> dict:
        """Get information about valid calibration points."""
        valid_mask = self._get_valid_points_mask(calibration_coords)
        valid_count = np.count_nonzero(valid_mask)

        logger.debug("Found %s valid calibration points", valid_count)

        return {
            "mask": valid_mask,
            "count": valid_count,
        }

    def _ensure_minimum_points(self, valid_count: int) -> None:
        """Ensure we have the minimum required valid points."""
        if valid_count < ProcessingConfig.min_calibration_points:
            msg = f"Only {valid_count} valid calibration points found, minimum 4 required"
            raise DartDetectionError(Code.MISSING_CALIBRATION_POINTS, details=msg)

    def _compute_homography_matrix(self, calibration_coords: np.ndarray, valid_mask: np.ndarray, image_shape: float) -> np.ndarray:
        """Compute the homography matrix using OpenCV."""
        try:
            homography_matrix, _ = cv2.findHomography(
                calibration_coords[valid_mask] * image_shape,
                self._reference_coordinates[valid_mask] * image_shape,
                method=cv2.RANSAC,
            )

            self.__validate_homography_matrix(homography_matrix)

            return homography_matrix  # noqa: TRY300
        except DartDetectionError:
            raise
        except Exception as e:
            msg = "Homography calculation failed"
            raise DartDetectionError(Code.HOMOGRAPHY, e, msg) from e

    @staticmethod
    def __validate_homography_matrix(homography_matrix: np.ndarray) -> None:
        if homography_matrix is None:
            logger.error("OpenCV findHomography returned None")
            error_msg = "Failed to compute homography matrix - OpenCV returned None"
            raise DartDetectionError(Code.HOMOGRAPHY, details=error_msg)

    @staticmethod
    def __create_homography_result(homography_matrix: np.ndarray, valid_count: int) -> HomoGraphyMatrix:
        logger.info("Homography matrix calculated successfully using %s points", valid_count)
        return HomoGraphyMatrix(
            matrix=homography_matrix,
            calibration_point_count=valid_count,
        )

    def _get_valid_points_mask(self, calibration_coords: np.ndarray) -> np.ndarray:
        """Get mask for valid calibration points within image bounds."""
        from src.models.geometry_models import NORMALIZED_COORDINATE_MAX, NORMALIZED_COORDINATE_MIN

        return np.all(
            np.logical_and(calibration_coords >= NORMALIZED_COORDINATE_MIN, calibration_coords <= NORMALIZED_COORDINATE_MAX),
            axis=1,
        )
