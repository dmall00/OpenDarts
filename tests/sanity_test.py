"""Sanity test for dart detection system."""

import json
import logging
from pathlib import Path
from typing import Dict, List

from detector.entrypoint.dart_image_scorer import DartImageScorer
from detector.script import IMAGE_PATH

MINIMUM_MATCH_PERCENTAGE = 0.7


def load_ground_truth() -> Dict[str, List[str]]:
    ground_truth_path = Path(__file__).parent / "resources" / "ground_truth.json"

    with Path.open(ground_truth_path) as f:
        data = json.load(f)

    ground_truth = {}
    for i in range(0, len(data), 2):
        filename = data[i]
        dart_data = data[i + 1]
        ground_truth[filename] = dart_data["darts"]

    return ground_truth


def extract_dart_scores_from_result(detection_result) -> List[str]:
    if not detection_result.is_success():
        return []

    return [
        dart_detection.dart_score.score_string
        for dart_detection in detection_result.dart_detections
        if dart_detection.dart_score is not None
    ]


def compare_dart_scores(predicted_scores: List[str], ground_truth_scores: List[str]) -> float:
    if not ground_truth_scores:
        return 1.0 if not predicted_scores else 0.0

    matches = 0
    total_ground_truth = len(ground_truth_scores)

    predicted_copy = predicted_scores.copy()

    for gt_score in ground_truth_scores:
        if gt_score in predicted_copy:
            matches += 1
            predicted_copy.remove(gt_score)

    return matches / total_ground_truth if total_ground_truth > 0 else 0.0


def test_dart_detection_sanity() -> None:
    """Sanity test for dart detection system.Tests all images against ground truth and asserts minimum match percentage."""
    scorer = DartImageScorer()
    logger = logging.getLogger(__name__)
    ground_truth = load_ground_truth()

    total_images = 0
    successful_detections = 0
    match_scores = []
    failed_images = []

    logger.info("Running sanity test on %s images...", len(ground_truth))
    logger.info("Minimum required match percentage: %s%%", MINIMUM_MATCH_PERCENTAGE * 100)
    logger.info("-" * 60)

    for filename, expected_scores in ground_truth.items():
        total_images += 1
        result = scorer.detect_darts(str(IMAGE_PATH / filename))

        if result.is_success():
            successful_detections += 1
            predicted_scores = extract_dart_scores_from_result(result)

            match_percentage = compare_dart_scores(predicted_scores, expected_scores)
            match_scores.append(match_percentage)

            logger.info("%s: %.2f%% match", filename, match_percentage * 100)
            logger.info("  Expected: %s", expected_scores)
            logger.info("  Predicted: %s", predicted_scores)

        else:
            logger.info("%s: DETECTION FAILED - %s", filename, result.message)
            failed_images.append(filename)
            match_scores.append(0.0)
        logger.info("")

    overall_match_percentage = sum(match_scores) / len(match_scores) if match_scores else 0.0
    success_rate = successful_detections / total_images if total_images > 0 else 0.0

    logger.info("=" * 60)
    logger.info("SANITY TEST RESULTS")
    logger.info("=" * 60)
    logger.info("Total images tested: %s", total_images)
    logger.info("Successful detections: %s (%.2f%%)", successful_detections, success_rate * 100)
    logger.info("Failed detections: %s", len(failed_images))
    logger.info("Overall match percentage: %.2f%%", overall_match_percentage * 100)
    logger.info("Required minimum: %s%%", MINIMUM_MATCH_PERCENTAGE * 100)

    if failed_images:
        logger.info("\nFailed images: %s", ", ".join(failed_images))

    assert overall_match_percentage >= MINIMUM_MATCH_PERCENTAGE, (
        f"Sanity test failed! Overall match percentage ({overall_match_percentage:.2%}) "
        f"is below minimum required ({MINIMUM_MATCH_PERCENTAGE * 100}%)"
    )

    logger.info(
        "\n✅ SANITY TEST PASSED! Match percentage (%.2f%%) meets minimum requirement (%.2f%%)",
        overall_match_percentage * 100,
        MINIMUM_MATCH_PERCENTAGE * 100,
    )
