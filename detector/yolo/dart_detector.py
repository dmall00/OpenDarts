"""Contains a  class for YOLO-based dart detection."""

import logging
import time

import torch
from ultralytics import YOLO
from ultralytics.engine.results import Results

from detector.model.configuration import ImmutableConfig, ProcessingConfig
from detector.model.detection_result_code import ResultCode
from detector.model.exception import DartDetectionError
from detector.model.image_models import DartImage


class YoloDartImageProcessor:
    """Processor for running YOLO inference and extracting dart positions and calibration points."""

    logger = logging.getLogger(__name__)

    def __init__(self, config: ProcessingConfig) -> None:
        self.__config = config
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.logger.info("Loading YOLO model from: %s to device %s", ImmutableConfig.dart_scorer_model_path, device)
        self._model = YOLO(ImmutableConfig.dart_scorer_model_path)
        self._model.to(device)

    def detect(self, image: DartImage) -> Results:
        """Run YOLO inference on image."""
        start_time = time.time()
        try:
            results = list(self._model(image.raw_image, verbose=False))
            result = results[0]
            self.logger.info(
                "YOLO inference complete in %s seconds. Detected %s objects", round(time.time() - start_time, 3), len(result.boxes)
            )
            return result  # noqa: TRY300
        except Exception as e:
            error_msg = f"YOLO inference failed: {e!s}"
            raise DartDetectionError(ResultCode.YOLO_ERROR, e, error_msg) from e
