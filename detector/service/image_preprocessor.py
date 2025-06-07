"""Preprocess images for further processing."""

import logging

from detector.model.configuration import ProcessingConfig
from detector.model.detection_result_code import ResultCode
from detector.model.exception import DartDetectionError
from detector.model.image_models import DartImage, DartImagePreprocessed
from detector.util.file_utils import resize_image
from detector.yolo.dartboard_cropper import YoloDartBoardImageCropper


class ImagePreprocessor:
    """Service to preprocess images for further processing."""

    logger = logging.getLogger(__qualname__)

    def __init__(self, config: ProcessingConfig) -> None:
        self.__config = config
        if config.enable_cropping_model:
            self.__image_cropper = YoloDartBoardImageCropper()

    def preprocess_image(self, image: DartImage) -> DartImagePreprocessed:
        """Preprocess the input image by resizing it and applying other transformations."""
        if image is None:
            raise DartDetectionError(ResultCode.UNKNOWN, details="Input image is None")

        crop_info = None
        if self.__config.enable_cropping_model:
            image, crop_info = self.__image_cropper.crop_image(image)
        else:
            self.logger.info("Cropping model is disabled, skipping image cropping")

        resized_image = resize_image(image, self.__config.target_image_size)
        return DartImagePreprocessed(resized_image, crop_info)
