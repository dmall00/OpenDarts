import logging
from pathlib import Path

from src.demo.basic.detection_interface import DartDetection
from src.models.exception import Code


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )


def main():
    setup_logging()
    detector = DartDetection()
    image_path = Path("../data/img_3.png")
    result = detector.detect_darts(image_path)

    if result and result.code is Code.SUCCESS:
        print(f"\n🎯 Dart Detection Results (Processing time: {result.processing_time:.2f}s)")
        print(f"Darts detected: {len(result.dart_result.dart_positions.positions)}")

        if result.dart_result.dart_positions.positions:
            for i, (pos, score) in enumerate(zip(
                    result.dart_result.dart_positions.positions,
                    result.dart_result.dart_scores)):
                print(f"  Dart {i + 1}: {score.score_string} at ({pos.x:.2f}, {pos.y:.2f})")
            print(f"Total Score: {result.dart_result.get_total_score()}")

        print(f"Calibration points: {len(result.calibration_points.points)}")
        print(f"Homography matrix: {'Available' if result.homography_matrix is not None else 'Not available'}")
    else:
        print(f"\n❌ Dart detection failed: {result.message if result else 'No result returned'}")


if __name__ == "__main__":
    main()
