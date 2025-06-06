"""Contains a  class for YOLO-based dart detection."""

import logging

import numpy as np
import torch
from ultralytics import YOLO
from ultralytics.engine.results import Results

from detector.model.configuration import ImmutableConfig, ProcessingConfig
from detector.model.detection_result_code import DetectionResultCode
from detector.model.exception import DartDetectionError

logger = logging.getLogger(__name__)


class YoloDartImageProcessor:
    """Processor for running YOLO inference and extracting dart positions and calibration points."""

    def __init__(self, config: ProcessingConfig) -> None:
        self.__config = config
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Loading YOLO model from: %s to device %s", ImmutableConfig.dart_scorer_model_path, device)
        self._model = YOLO(ImmutableConfig.dart_scorer_model_path)
        self._model.to(device)

    def detect(self, image: np.ndarray) -> Results:
        """Run YOLO inference on image."""
        logger.info("Running YOLO inference...")
        try:
            results = list(self._model(image, verbose=False))
            result = results[0]
            logger.info("YOLO inference complete. Detected %s objects", len(result.boxes))
            return result  # noqa: TRY300
        except Exception as e:
            error_msg = f"YOLO inference failed: {e!s}"
            raise DartDetectionError(DetectionResultCode.YOLO_ERROR, e, error_msg) from e
