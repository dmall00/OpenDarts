"""Preprocess images for further processing."""

import logging

import numpy as np

from detector.model.configuration import ProcessingConfig
from detector.model.detection_result_code import DetectionResultCode
from detector.model.exception import DartDetectionError
from detector.util.file_utils import resize_image
from detector.yolo.dartboard_cropper import YoloDartBoardImageCropper

logger = logging.getLogger(__name__)


class ImagePreprocessor:
    """Service to preprocess images for further processing."""

    def __init__(self, config: ProcessingConfig) -> None:
        self.__config = config
        if config.enable_cropping_model:
            self.__image_cropper = YoloDartBoardImageCropper()

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess the input image by resizing it and applying other transformations."""
        if image is None:
            raise DartDetectionError(DetectionResultCode.UNKNOWN, details="Input image is None")
        if self.__config.enable_cropping_model:
            image = self.__image_cropper.crop_image(image)
        else:
            logger.info("Cropping model is disabled, skipping image cropping")
        return resize_image(image, self.__config.target_image_size)
