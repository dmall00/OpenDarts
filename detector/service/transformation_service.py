"""Service to transform dart coordinates to real board dimensions."""

import logging
from typing import List

import numpy as np

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import DartDetection, DartPosition, HomoGraphyMatrix

logger = logging.getLogger(__name__)


class TransformationService:
    """Service for coordinate transformations and adjustments."""

    def __init__(self, config: ProcessingConfig) -> None:
        self.__config = config

    def transform_to_board_dimensions(self, homography_matrix: HomoGraphyMatrix, dart_detections: List[DartDetection]) -> None:
        """Transform dart coordinates to board coordinate system and map to dart_position."""
        logger.debug("Transforming %s dart coordinates to board space", len(dart_detections))

        for detection in dart_detections:
            # Convert original dart position to pixel coordinates
            image_shape = self.__config.target_image_size[0]
            pixel_coords = np.array([detection.original_dart_position.x, detection.original_dart_position.y]) * image_shape

            # Create homogeneous coordinates
            homogeneous_coords = np.append(pixel_coords, 1)

            # Apply homography transformation
            transformed_coords = homography_matrix.matrix @ homogeneous_coords

            # Normalize homogeneous coordinates
            normalized_coords = transformed_coords / transformed_coords[-1]

            # Normalize to image shape (remove homogeneous coordinate)
            final_coords = normalized_coords[:-1] / image_shape

            new_position = DartPosition(x=float(final_coords[0]), y=float(final_coords[1]))

            detection.dart_position = new_position

        logger.debug("Transformation to board dimensions completed for %s dart detections", len(dart_detections))
