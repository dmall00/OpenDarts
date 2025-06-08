"""Utility functions for file and image handling in the application."""

import logging
from pathlib import Path
from typing import Tuple, Union

import cv2

from detector.model.image_models import DartImage

logger = logging.getLogger("FileUtils")


def load_image(image_path: Union[str, Path]) -> DartImage:
    """Load an image from the specified path and return it as a NumPy array."""
    __validate_image_path(str(image_path))

    image = cv2.imread(str(image_path))
    if image is None:
        msg = f"Could not load image: {image_path}"
        raise ValueError(msg)

    logger.debug("Image loaded successfully. Shape: %s", image.shape)
    return DartImage(raw_image=image)


def resize_image(image: DartImage, target_size: Tuple[int, int] = (800, 800)) -> DartImage:
    """Resize the image to the target size."""
    logger.debug("Resizing image to target size: %s", target_size)
    return DartImage(raw_image=cv2.resize(image.raw_image, target_size, interpolation=cv2.INTER_AREA))


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

    logger.debug("Image file validated: %s", image_path)
