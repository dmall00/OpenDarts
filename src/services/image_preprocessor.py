"""Preprocess images for further processing."""
import numpy as np

from src.models.exception import Code, DartDetectionError
from src.utils.file_utils import resize_image


class ImagePreprocessor:
    """Service to preprocess images for further processing."""

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess the input image by resizing it and applying other transformations."""
        if image is None:
            raise DartDetectionError(Code.UNKNOWN, details="Input image is None")

        return resize_image(image)
