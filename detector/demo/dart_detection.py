"""Basic dart detection demo."""

import logging
from pathlib import Path
from typing import TYPE_CHECKING

from detector.demo.basic.dart_detection_demo import DartDetection
from detector.models.exception import Code

if TYPE_CHECKING:
    from detector.models.detection_models import DetectionResult


def setup_logging() -> None:  # noqa: D103
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )


def main(image_path: Path = Path("../../images/img_3.png")) -> None:
    """Run the Dart Detection demo with a single image."""
    setup_logging()
    detector = DartDetection()
    result: DetectionResult | None = detector.detect_darts(image_path)

    if result and result.code is Code.SUCCESS:
        print(f"\n🎯 Dart Detection Results (Processing time: {result.processing_time:.2f}s)")

        if result.dart_result is not None and result.dart_result.dart_positions is not None:
            print(f"Darts detected: {len(result.dart_result.dart_positions.positions)}")

            if result.dart_result.dart_positions.positions:
                for i, (pos, score) in enumerate(
                    zip(result.dart_result.dart_positions.positions, result.dart_result.dart_scores, strict=False),
                ):
                    print(f"  Dart {i + 1}: {score.score_string} at ({pos.x:.2f}, {pos.y:.2f})")
                print(f"Total Score: {result.dart_result.get_total_score()}")

        if result.calibration_points is not None:
            print(f"Calibration points: {len(result.calibration_points.points)}")
        print(f"Homography matrix: {'Available' if result.homography_matrix is not None else 'Not available'}")
    else:
        print(f"\n❌ Dart detection failed: {result.message if result else 'No result returned'}")


if __name__ == "__main__":
    main()
