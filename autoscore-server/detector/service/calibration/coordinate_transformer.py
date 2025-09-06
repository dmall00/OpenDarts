"""Service to transform dart coordinates to real board dimensions."""

import logging
from typing import List

import numpy as np

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import HomoGraphyMatrix, OriginalDartPosition, TransformedDartPosition


class CoordinateTransformer:
    """Service for coordinate transformations and adjustments."""

    logger = logging.getLogger(__qualname__)

    def __init__(self, config: ProcessingConfig) -> None:
        self.__config = config

    def transform_to_board_dimensions(
        self, homography_matrix: HomoGraphyMatrix, dart_positions: List[OriginalDartPosition]
    ) -> List[TransformedDartPosition]:
        """Transform dart coordinates to board coordinate system and map to dart_position."""
        self.logger.debug("Transforming %s dart coordinates to board space", len(dart_positions))

        transformed_positions = []

        for position in dart_positions:
            # Convert original dart position to pixel coordinates
            image_shape = self.__config.target_image_size[0]
            pixel_coords = np.array([position.x, position.y]) * image_shape

            # Create homogeneous coordinates
            homogeneous_coords = np.append(pixel_coords, 1)

            # Apply homography transformation
            transformed_coords = homography_matrix.matrix @ homogeneous_coords

            # Normalize homogeneous coordinates
            normalized_coords = transformed_coords / transformed_coords[-1]

            # Normalize to image shape (remove homogeneous coordinate)
            final_coords = normalized_coords[:-1] / image_shape

            transformed_position = TransformedDartPosition(x=float(final_coords[0]), y=float(final_coords[1]))
            transformed_positions.append(transformed_position)

        self.logger.debug("Transformation to board dimensions completed for %s dart detections", len(dart_positions))
        return transformed_positions
