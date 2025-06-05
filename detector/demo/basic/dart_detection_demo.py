"""Executable interface for dart detection and scoring for a given image path."""

import logging
from pathlib import Path
from typing import Union

from detector.models.detection_models import DetectionResult, ProcessingConfig
from detector.services.detection_service import DartDetectionService
from detector.services.image_preprocessor import ImagePreprocessor
from detector.utils.file_utils import load_image

logger = logging.getLogger(__name__)


class DartDetection:
    """High-level interface for dart detection and scoring from a given image path."""

    def __init__(self) -> None:
        self._detection_service = DartDetectionService()
        self.preprocessor = ImagePreprocessor()

        logger.info("DartDetectionInterface initialized with model: %s", ProcessingConfig.dart_scorer_model_path)

    def detect_darts(self, image_path: Union[str, Path]) -> DetectionResult | None:
        """Detect darts in the image at the given path and return detection results."""
        try:
            loaded_image = load_image(image_path)
            preprocess_image = self.preprocessor.preprocess_image(loaded_image)

            return self._detection_service.detect_and_score(
                preprocess_image,
            )
        except Exception as e:
            error_msg = f"Detection failed: {e!s}"
            logger.exception(error_msg)
            return None
