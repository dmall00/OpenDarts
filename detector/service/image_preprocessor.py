"""Preprocess images for further processing."""

import numpy as np

from detector.model.detection_models import Code, DartDetectionError
from detector.util.file_utils import resize_image
from detector.yolo.dartboard_cropper import YoloDartBoardImageCropper


class ImagePreprocessor:
    """Service to preprocess images for further processing."""

    def __init__(self) -> None:
        self.__image_cropper = YoloDartBoardImageCropper()

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess the input image by resizing it and applying other transformations."""
        if image is None:
            raise DartDetectionError(Code.UNKNOWN, details="Input image is None")
        cropped_image = self.__image_cropper.crop_image(image)
        return resize_image(cropped_image)
