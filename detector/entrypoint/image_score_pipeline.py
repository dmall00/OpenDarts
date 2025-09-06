"""Dart imager scorer."""

import logging
from pathlib import Path
from typing import Optional, Union

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import DetectionResult
from detector.service.dart_image_scoring_service import DartInImageScoringService
from detector.util.file_utils import load_image


class DartBoardImageToScorePipeline:
    """Entrypoint for dart detection and scoring from a given image path."""

    logger = logging.getLogger(__qualname__)

    def __init__(self, config: Optional[ProcessingConfig] = None) -> None:
        self.__config = config or ProcessingConfig()
        self._detection_service = DartInImageScoringService(self.__config)

    def detect_darts(self, image_path: Union[str, Path]) -> DetectionResult:
        """Detect darts in the image at the given path and return detection results."""
        self.logger.info("Scoring image: %s", image_path)
        loaded_image = load_image(image_path)

        return self._detection_service.detect_and_score(
            loaded_image,
        )
