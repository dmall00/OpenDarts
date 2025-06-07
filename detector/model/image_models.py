"""Models for image related operations in dart detection."""

from dataclasses import dataclass
from typing import Optional

import numpy as np


@dataclass
class DartImage:
    """Represents an image to be processed for dart detection."""

    raw_image: np.ndarray


@dataclass
class CropInformation:
    """Information about the cropping applied to an image."""

    x_offset: int
    y_offset: int
    width: int
    height: int


@dataclass
class DartImagePreprocessed:
    """Represents a preprocessed dart image ready for detection."""

    image: DartImage
    crop_info: Optional[CropInformation] = None
