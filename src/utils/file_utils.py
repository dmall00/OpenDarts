"""Utility functions for file and image handling in the application."""

import logging
from pathlib import Path
from typing import Union

import cv2
import numpy as np

from src.models.detection_models import ProcessingConfig

logger = logging.getLogger(__name__)

def __validate_image_path(image_path: Union[str, Path]) -> None:
    path = Path(image_path)

    if not path.exists():
        error_msg = f"Image file not found: {image_path}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    if not path.is_file():
        error_msg = f"Image path is not a file: {image_path}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    valid_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}
    if path.suffix.lower() not in valid_extensions:
        error_msg = f"Unsupported image format: {path.suffix}. Supported: {valid_extensions}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    logger.debug("Image file validated: %s", image_path)

def load_and_preprocess_image(image_path: Union[str, Path]) -> np.ndarray:
    """Load image from path and apply preprocessing."""
    image = load_image(image_path)
    return resize_image(image)


def load_image(image_path: Union[str, Path]) -> np.ndarray:
    """Load an image from the specified path and return it as a NumPy array."""
    __validate_image_path(str(image_path))

    image = cv2.imread(str(image_path))
    if image is None:
        msg = f"Could not load image: {image_path}"
        raise ValueError(msg)

    logger.debug("Image loaded successfully. Shape: %s", image.shape)
    return image


def resize_image(image: np.ndarray) -> np.ndarray:
    """Resize the image to the target size defined in ProcessingConfig."""
    return cv2.resize(image, ProcessingConfig.target_image_size, interpolation=cv2.INTER_AREA)
