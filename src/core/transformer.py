import logging

import numpy as np

logger = logging.getLogger(__name__)


class CoordinateTransformer:
    def adjust_for_crop(self, calibration_coords, dart_coords, resolution, crop_start, crop_size):
        logger.debug(
            f"Adjusting coordinates - Resolution: {resolution}, Crop start: {crop_start}, Crop size: {crop_size}")

        calibration_coords *= resolution
        calibration_coords -= crop_start
        calibration_coords /= crop_size

        if dart_coords.shape != (0,):
            dart_coords *= resolution
            dart_coords -= crop_start
            dart_coords /= crop_size
            dart_coords = dart_coords[np.all(np.logical_and(dart_coords >= 0, dart_coords <= 1), axis=1)]

        return calibration_coords, dart_coords

    def transform_to_board(self, homography_matrix, dart_coords, image_shape):
        if len(dart_coords) == 0:
            logger.debug("No dart coordinates to transform")
            return dart_coords

        logger.debug(f"Transforming {len(dart_coords)} dart coordinates to board plane")

        pixel_coords = dart_coords * image_shape
        homogeneous_coords = np.concatenate(
            (pixel_coords, np.ones((dart_coords.shape[0], 1))), axis=1
        ).T

        transformed_coords = homography_matrix @ homogeneous_coords
        transformed_coords /= transformed_coords[-1]
        result_coords = transformed_coords[:-1].T
        result_coords /= image_shape

        logger.debug(f"Transformation complete: {len(result_coords)} coordinates")
        return result_coords
