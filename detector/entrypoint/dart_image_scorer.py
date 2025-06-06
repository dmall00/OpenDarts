"""Dart imager scorer."""

import logging
from pathlib import Path
from typing import Optional, Union

from detector.entrypoint.detection_service import DartDetectionService
from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import DetectionResult
from detector.service.image_preprocessor import ImagePreprocessor
from detector.util.file_utils import load_image

logger = logging.getLogger(__name__)


class DartImageScorer:
    """Entrypoint for dart detection and scoring from a given image path."""

    def __init__(self, config: Optional[ProcessingConfig] = None) -> None:
        self.__config = config or ProcessingConfig()
        self._detection_service = DartDetectionService(self.__config)
        self.preprocessor = ImagePreprocessor(self.__config)

    def detect_darts(self, image_path: Union[str, Path]) -> DetectionResult:
        """Detect darts in the image at the given path and return detection results."""
        logger.info("Scoring image: %s", image_path)
        loaded_image = load_image(image_path)
        preprocess_image = self.preprocessor.preprocess_image(loaded_image)

        return self._detection_service.detect_and_score(
            preprocess_image,
        )
