"""Demo running dart detection with an image scorer."""

import argparse
import logging
from pathlib import Path
from typing import TYPE_CHECKING

from dart_detection import IMAGE_PATH
from detector.entrypoint.dart_image_scorer import DartImageScorer

if TYPE_CHECKING:
    from detector.model.detection_models import DetectionResult

logger = logging.getLogger(__name__)


def setup_logging() -> None:  # noqa: D103
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )


def main() -> None:
    """Run the Dart Detection demo with a single image."""
    parser = argparse.ArgumentParser(description="Run Dart Detection with an image scorer.")
    parser.add_argument("--image_path", type=str, default=str(IMAGE_PATH / "img_3.png"), help="Path to the image file for dart detection")

    args = parser.parse_args()
    image_path = Path(args.image_path)

    setup_logging()
    detector = DartImageScorer()
    result: DetectionResult = detector.detect_darts(image_path)

    if result.is_success():
        print("\n🎯 Dart Detection Results")
        print(f"⏱️  Processing time: {result.processing_time:.2f}s")
        print("-" * 50)

        if result.dart_detections:
            print(f"🎯 Darts detected: {len(result.dart_detections)}")

            total_score = 0
            for i, detection in enumerate(result.dart_detections):
                if detection.dart_score:
                    # Use transformed position if available, otherwise original
                    pos = detection.dart_position or detection.original_dart_position
                    print(
                        f"  🎯 Dart {i + 1}: {detection.dart_score.score_string} "
                        f"({detection.dart_score.score_value} pts) "
                        f"at ({pos.x:.2f}, {pos.y:.2f}) "
                        f"[Confidence: {detection.confidence:.1%}]",
                    )
                    total_score += detection.dart_score.score_value
                else:
                    pos = detection.dart_position or detection.original_dart_position
                    print(f"  ❓ Dart {i + 1}: Score pending at ({pos.x:.2f}, {pos.y:.2f}) [Confidence: {detection.confidence:.1%}]")

            print("-" * 50)
            print(f"🏆 Total Score: {total_score} points")
        else:
            print("❌ No darts detected")

        if result.calibration_points:
            print(f"\n🔧 Calibration points detected: {len(result.calibration_points)}")

    else:
        error_msg = result.result_code.message
        print(f"\n❌ Dart detection failed: {error_msg}")
        if result.message:
            print(f"   Details: {result.message}")


if __name__ == "__main__":
    main()
