"""Service to transform dart coordinates to real board dimensions."""

import logging

import numpy as np

from src.models.detection_models import DartPosition, DartPositions, ProcessingConfig

logger = logging.getLogger(__name__)


class TransformationService:
    """Service for coordinate transformations and adjustments."""

    def transform_to_board_dimensions(
        self,
        homography_matrix: np.ndarray,
        dart_coords: np.ndarray,
        image_shape: float = ProcessingConfig.target_image_size[0],
    ) -> DartPositions:
        """Transform dart coordinates to board coordinate system."""
        if len(dart_coords) == 0:
            logger.debug("No dart coordinates to transform")
            return []

        logger.debug("Transforming %s dart coordinates to board space", len(dart_coords))

        # Convert to pixel coordinates
        pixel_coords = dart_coords * image_shape

        # Create homogeneous coordinates
        homogeneous_coords = np.concatenate(
            (pixel_coords, np.ones((dart_coords.shape[0], 1))), axis=1,
        ).T

        # Apply homography transformation
        transformed_coords = homography_matrix @ homogeneous_coords
        transformed_coords /= transformed_coords[-1]  # Normalize

        # Convert back to normalized coordinates
        result_coords = transformed_coords[:-1].T
        result_coords /= image_shape

        # Convert to DartPosition objects
        dart_positions = [
            DartPosition(x=float(coord[0]), y=float(coord[1]))
            for coord in result_coords
        ]

        logger.debug("Transformation complete: %s positions", len(dart_positions))
        return DartPositions(dart_positions)
