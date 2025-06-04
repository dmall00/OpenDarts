"""Executable interface for dart detection and scoring for a given image path."""
import logging
from pathlib import Path
from typing import Union

from src.models.detection_models import DetectionResult, ProcessingConfig
from src.services.detection_service import DartDetectionService
from src.utils.file_utils import load_and_preprocess_image

logger = logging.getLogger(__name__)


class DartDetection:
    """High-level interface for dart detection and scoring from a given image path."""

    def __init__(self) -> None:
        self._detection_service = DartDetectionService()

        logger.info("DartDetectionInterface initialized with model: %s", ProcessingConfig.model_path)

    def detect_darts(self, image_path: Union[str, Path]) -> DetectionResult | None:
        """Detect darts in the image at the given path and return detection results."""
        try:
            processed_image = load_and_preprocess_image(image_path)

            return self._detection_service.detect_and_score(
                processed_image,
            )
        except Exception as e:
            error_msg = f"Detection failed: {e!s}"
            logger.exception(error_msg)
            return None
