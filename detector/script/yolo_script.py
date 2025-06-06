"""Basic YOLO inference script."""

from typing import List, Optional

import cv2
from ultralytics import YOLO
from ultralytics.engine.results import Results

from detector.model import MODEL_PATH
from detector.model.configuration import ProcessingConfig
from detector.script import IMAGE_PATH
from detector.service.image_preprocessor import ImagePreprocessor
from detector.util.file_utils import resize_image


class YoloScript:
    """Basic YOLO inference script."""

    def __init__(self, model_path: Optional[str] = None) -> None:
        if model_path is None:
            model_path = str(MODEL_PATH / "dart_scorer.pt")
        self.model = YOLO(model_path)
        self.preprocessor = ImagePreprocessor(ProcessingConfig())

    def detect(self, image_path: Optional[str] = None) -> List[Results]:
        """Detect dartboards in an image.an image."""
        if image_path is None:
            image_path = str(IMAGE_PATH / "img_28.png")

        image = cv2.imread(image_path)
        return self.model(resize_image(image=self.preprocessor.preprocess_image(image)))

    def show_results(self, results: List[Results]) -> None:
        """Display detection results."""
        results[0].show()


def main() -> None:
    """Run the YOLO detection script."""
    detector = YoloScript()
    results = detector.detect()
    detector.show_results(results)


if __name__ == "__main__":
    main()
