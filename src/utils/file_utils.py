import logging
from pathlib import Path
from typing import Union, Optional, Tuple

import cv2
import numpy as np

from src.models.detection_models import ProcessingConfig

logger = logging.getLogger(__name__)


def validate_model_path(model_path: Union[str, Path]) -> None:
    path = Path(model_path)

    if not path.exists():
        error_msg = f"Model file not found: {model_path}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    if not path.is_file():
        error_msg = f"Model path is not a file: {model_path}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    # Check file extension (optional validation)
    if not str(path).endswith(('.pt', '.pth', '.onnx')):
        logger.warning(f"Unexpected model file extension: {path.suffix}")

    logger.debug(f"Model file validated: {model_path}")


def validate_image_path(image_path: Union[str, Path]) -> None:
    path = Path(image_path)

    if not path.exists():
        error_msg = f"Image file not found: {image_path}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    if not path.is_file():
        error_msg = f"Image path is not a file: {image_path}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
    if path.suffix.lower() not in valid_extensions:
        error_msg = f"Unsupported image format: {path.suffix}. Supported: {valid_extensions}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    logger.debug(f"Image file validated: {image_path}")


def validate_directory_path(directory_path: Union[str, Path]) -> None:
    path = Path(directory_path)

    if not path.exists():
        error_msg = f"Directory not found: {directory_path}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    if not path.is_dir():
        error_msg = f"Path is not a directory: {directory_path}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    logger.debug(f"Directory validated: {directory_path}")


def load_and_preprocess_image(image_path: Union[str, Path]) -> np.ndarray:
    """
    Load image from path and apply preprocessing.

    Args:
        image_path: Path to the image file

    Returns:
        Tuple of (processed_image, crop_parameters)
    """
    image = load_image(image_path)
    resized_image = resize_image(image)
    return resized_image


def load_image(image_path: Union[str, Path]) -> np.ndarray:
    validate_image_path(str(image_path))

    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError(f"Could not load image: {image_path}")

    logger.debug(f"Image loaded successfully. Shape: {image.shape}")
    return image


def resize_image(image: np.ndarray) -> np.ndarray:
    return cv2.resize(image, ProcessingConfig.target_image_size, interpolation=cv2.INTER_AREA)


def crop_image(image: np.ndarray, resolution: np.ndarray,
               crop_size: Optional[float] = None) -> Tuple[np.ndarray, np.ndarray, float]:
    if crop_size is None:
        crop_size = min(resolution)
    crop_start = resolution / 2 - crop_size / 2
    cropped_image = image[
                    int(crop_start[1]):int(crop_start[1] + crop_size),
                    int(crop_start[0]):int(crop_start[0] + crop_size)
                    ]
    return cropped_image, crop_start, crop_size
