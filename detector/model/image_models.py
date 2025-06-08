"""Models for image related operations in dart detection."""

from typing import Optional

import numpy as np
from pydantic import BaseModel, ConfigDict, field_serializer


class DartImage(BaseModel):
    """Represents an image to be processed for dart detection."""

    model_config = ConfigDict(arbitrary_types_allowed=True)
    raw_image: np.ndarray

    @field_serializer("raw_image")
    def serialize_matrix(self, _: np.ndarray) -> list:
        """Convert the numpy matrix to a regular nested list for serialization."""
        return self.raw_image.tolist()


class CropInformation(BaseModel):
    """Information about the cropping applied to an image."""

    x_offset: int
    y_offset: int
    width: int
    height: int


class PreprocessingResult(BaseModel):
    """Result of preprocessing an image."""

    crop_info: Optional[CropInformation] = None


class DartImagePreprocessed(BaseModel):
    """Represents a preprocessed dart image ready for detection."""

    dart_image: DartImage
    preprocessing_result: PreprocessingResult
