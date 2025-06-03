import logging
from pathlib import Path
from typing import Union

from src.models.detection_models import ProcessingConfig, DetectionResult
from src.services.detection_service import DartDetectionService
from src.utils.file_utils import load_and_preprocess_image

logger = logging.getLogger(__name__)


class DartDetection:
    """
    High-level interface for dart detection and scoring from a given image path
    """

    def __init__(self):
        self._detection_service = DartDetectionService()

        logger.info(f"DartDetectionInterface initialized with model: {ProcessingConfig.model_path}")

    def detect_darts(self, image_path: Union[str, Path]) -> DetectionResult | None:
        try:
            processed_image = load_and_preprocess_image(image_path)

            detection_result = self._detection_service.detect_and_score(
                processed_image
            )
            return detection_result
        except Exception as e:
            error_msg = f"Detection failed: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return None
