"""Dart imager scorer."""

from pathlib import Path
from typing import Union

from detector.model.detection_models import DetectionResult
from detector.service.detection_service import DartDetectionService
from detector.service.image_preprocessor import ImagePreprocessor
from detector.util.file_utils import load_image


class DartImageScorer:
    """Entrypoint for dart detection and scoring from a given image path."""

    def __init__(self) -> None:
        self._detection_service = DartDetectionService()
        self.preprocessor = ImagePreprocessor()

    def detect_darts(self, image_path: Union[str, Path]) -> DetectionResult:
        """Detect darts in the image at the given path and return detection results."""
        loaded_image = load_image(image_path)
        preprocess_image = self.preprocessor.preprocess_image(loaded_image)

        return self._detection_service.detect_and_score(
            preprocess_image,
        )
