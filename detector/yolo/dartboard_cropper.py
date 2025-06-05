"""Crops dartboard images using YOLO object detection."""

import logging
import time
from typing import Tuple

import numpy as np
import torch
from ultralytics import YOLO
from ultralytics.engine.results import Results

from detector.model.configuration import ImmutableConfig
from detector.model.detection_result_code import DetectionResultCode
from detector.model.exception import DartDetectionError

logger = logging.getLogger(__name__)


class YoloDartBoardImageCropper:
    """Crops dartboard images using YOLO object detection."""

    def __init__(self) -> None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Loading YOLO model from: %s to device ", ImmutableConfig.dartboard_model_path)
        self._model = YOLO(ImmutableConfig.dartboard_model_path)
        self._model.to(device)

    def crop_image(self, image: np.ndarray) -> np.ndarray:
        """Crop the image to focus on the detected dartboard."""
        start = time.time()
        detection_result = self.__detect_dartboard(image)
        bounding_box = self.__extract_bounding_box(detection_result, image.shape)
        cropped_image = self.__crop_with_bounding_box(image, bounding_box)

        self.__log_cropping_info(bounding_box, detection_result.boxes.conf[0], cropped_image.shape, start)

        return cropped_image

    def __detect_dartboard(self, image: np.ndarray) -> Results:
        results = self._model(image, verbose=False)
        result = results[0]
        self.__validate_dartboard_detection_output(result)
        return result

    def __extract_bounding_box(self, result: Results, image_shape: Tuple[int, ...]) -> Tuple[int, int, int, int]:
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

    @staticmethod
    def __calculate_bounding_box_corners(
        pixel_coords: Tuple[int, int, int, int],
        img_width: int,
        img_height: int,
    ) -> Tuple[int, int, int, int]:
        x_center_px, y_center_px, width_px, height_px = pixel_coords

        # Calculate corners from center point
        x_start = max(0, x_center_px - width_px // 2)
        y_start = max(0, y_center_px - height_px // 2)
        x_end = min(img_width, x_center_px + width_px // 2)
        y_end = min(img_height, y_center_px + height_px // 2)

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
        logger.info(
            "Cropped dartboard in %s seconds from (%d,%d) with confidence %s to (%d,%d), size: %dx%d",
            round(end - start, 2),
            x_start,
            y_start,
            f"{confidence:.3f}",
            x_end,
            y_end,
            cropped_shape[1],  # width
            cropped_shape[0],  # height
        )

    @staticmethod
    def __validate_dartboard_detection_output(result: Results) -> None:
        if not result:
            raise DartDetectionError(DetectionResultCode.YOLO_ERROR, details="No result from YOLO dartboard model")
        if not result.boxes:
            raise DartDetectionError(DetectionResultCode.YOLO_ERROR, details="No boxes detected by YOLO dartboard model")
