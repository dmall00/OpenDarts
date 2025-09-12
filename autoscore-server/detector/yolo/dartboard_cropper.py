"""Crops dartboard images using YOLO object detection."""

import logging
import time
from typing import Optional, Tuple

import numpy as np
from ultralytics import YOLO
from ultralytics.engine.results import Results

from detector.model.configuration import ImmutableConfig, ProcessingConfig
from detector.model.detection_result_code import ResultCode
from detector.model.exception import DartDetectionError
from detector.model.image_models import CropInformation, DartImage


class YoloDartBoardImageCropper:
    """Crops dartboard images using YOLO object detection."""

    logger = logging.getLogger(__qualname__)

    def __init__(self, config: Optional[ProcessingConfig] = None) -> None:
        self.logger.info("Loading YOLO model from: %s", ImmutableConfig.dartboard_model_path)
        self._model = YOLO(ImmutableConfig.dartboard_model_path)
        self.__config = config or ProcessingConfig()

    def crop_image(self, dart_image: DartImage) -> Tuple[DartImage, CropInformation]:
        """Crop the image to focus on the detected dartboard."""
        image = dart_image.raw_image
        start = time.time()
        detection_result = self.__detect_dartboard(image)
        bounding_box = self.__extract_bounding_box(detection_result, image.shape)
        cropped_image = self.__crop_with_bounding_box(image, bounding_box)

        # boxes is guaranteed to exist after validation
        assert detection_result.boxes is not None
        self.__log_cropping_info(bounding_box, float(detection_result.boxes.conf[0]), cropped_image.shape, start)

        x_start, y_start, x_end, y_end = bounding_box
        crop_info = CropInformation(x_offset=x_start, y_offset=y_start, width=x_end - x_start, height=y_end - y_start)

        return DartImage(raw_image=cropped_image), crop_info

    @staticmethod
    def apply_crop(dart_image: DartImage, crop_info: CropInformation) -> DartImage:
        """Apply cropping information to a dart image."""
        image = dart_image.raw_image
        x_end = crop_info.x_offset + crop_info.width
        y_end = crop_info.y_offset + crop_info.height

        cropped_image = image[crop_info.y_offset : y_end, crop_info.x_offset : x_end]
        return DartImage(raw_image=cropped_image)

    def __detect_dartboard(self, image: np.ndarray) -> Results:
        results = self._model(image, verbose=False)
        result = results[0]
        self.__validate_dartboard_detection_output(result)
        return result

    def __extract_bounding_box(self, result: Results, image_shape: Tuple[int, ...]) -> Tuple[int, int, int, int]:
        # boxes is guaranteed to exist after validation
        assert result.boxes is not None
        xywh_normalized = result.boxes.xywhn[0]
        img_height, img_width = image_shape[:2]

        x_center_norm, y_center_norm, width_norm, height_norm = xywh_normalized

        pixel_coords = self.__normalize_to_pixel_coordinates(x_center_norm, y_center_norm, width_norm, height_norm, img_width, img_height)

        return self.__calculate_bounding_box_corners(pixel_coords, img_width, img_height)

    @staticmethod
    def __normalize_to_pixel_coordinates(  # noqa: PLR0913
        x_center_norm: float,
        y_center_norm: float,
        width_norm: float,
        height_norm: float,
        img_width: int,
        img_height: int,
    ) -> Tuple[int, int, int, int]:
        width_px = int(width_norm * img_width)
        height_px = int(height_norm * img_height)
        x_center_px = int(x_center_norm * img_width)
        y_center_px = int(y_center_norm * img_height)

        return x_center_px, y_center_px, width_px, height_px

    def __calculate_bounding_box_corners(
        self,
        pixel_coords: Tuple[int, int, int, int],
        img_width: int,
        img_height: int,
    ) -> Tuple[int, int, int, int]:
        x_center_px, y_center_px, width_px, height_px = pixel_coords

        padding_x = int(width_px * self.__config.crop_padding_ratio)
        padding_y = int(height_px * self.__config.crop_padding_ratio)

        x_start = max(0, x_center_px - width_px // 2 - padding_x)
        y_start = max(0, y_center_px - height_px // 2 - padding_y)
        x_end = min(img_width, x_center_px + width_px // 2 + padding_x)
        y_end = min(img_height, y_center_px + height_px // 2 + padding_y)

        return x_start, y_start, x_end, y_end

    @staticmethod
    def __crop_with_bounding_box(image: np.ndarray, bounding_box: Tuple[int, int, int, int]) -> np.ndarray:
        x_start, y_start, x_end, y_end = bounding_box
        return image[y_start:y_end, x_start:x_end]

    @staticmethod
    def __log_cropping_info(
        bounding_box: Tuple[int, int, int, int], confidence: float, cropped_shape: Tuple[int, ...], start: float
    ) -> None:
        end = time.time()
        x_start, y_start, x_end, y_end = bounding_box
        YoloDartBoardImageCropper.logger.debug(
            "Cropped dartboard in %s seconds from (%d,%d) with confidence %s to (%d,%d), size: %dx%d",
            round(end - start, 2),
            x_start,
            y_start,
            f"{confidence:.3f}",
            x_end,
            y_end,
            cropped_shape[1],
            cropped_shape[0],
        )

    @staticmethod
    def __validate_dartboard_detection_output(result: Results) -> None:
        if not result:
            raise DartDetectionError(ResultCode.YOLO_ERROR, details="No result from YOLO dartboard model")
        if not result.boxes:
            raise DartDetectionError(ResultCode.YOLO_ERROR, details="No boxes detected by YOLO dartboard model")
