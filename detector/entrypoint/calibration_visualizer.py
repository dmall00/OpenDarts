"""
Demo script to visualize calibration and homography transformations.

This script shows how the dart board image looks after calibration points are detected
and homography matrix transformations are applied.
"""

import logging
from pathlib import Path
from typing import List, Optional, Tuple

import cv2
import numpy as np
from numpy import ndarray

from detector.entrypoint.detection_service import DartDetectionService
from detector.geometry.board import DartBoard
from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import DartScore, DetectionResult, HomoGraphyMatrix, Point2D
from detector.model.geometry_models import (
    ANGLE_CALCULATION_EPSILON,
    BOARD_CENTER_COORDINATE,
    VISUALIZATION_CIRCLE_RADIUS,
    VISUALIZATION_DART_CIRCLE_RADIUS,
    VISUALIZATION_SAMPLE_POSITION_RADIUS,
    VISUALIZATION_TARGET_HEIGHT,
    VISUALIZATION_TEXT_OFFSET,
    VISUALIZATION_TEXT_RADIUS_RATIO,
)
from detector.service.image_preprocessor import ImagePreprocessor
from detector.util.file_utils import load_image

logger = logging.getLogger(__name__)


class CalibrationVisualizer:
    """Class for visualizing the calibration transformation results."""

    def __init__(self, config: Optional[ProcessingConfig] = None) -> None:
        self.__config = config or ProcessingConfig()
        self.window_name: str = "Calibration Visualization"
        self.dart_board: DartBoard = DartBoard()
        self.detection_service: DartDetectionService = DartDetectionService(self.__config)
        self.preprocessor = ImagePreprocessor(self.__config)

    def visualize(self, image_path: Path) -> None:
        """Visualize the transformation result for a given image path."""
        try:
            image = self.__load_and_prepare_image(image_path)
            if image is None:
                return

            result = self.detection_service.detect_and_score(image)

            if not result.is_success():
                print(f"Detection failed: {result.result_code.message}")
                return

            self.__show_transformation_result(image, result)

            print(f"Detected darts: {len(result.dart_detections)}")
            print(f"Total score: {result.get_total_score()}")

        except Exception as e:
            logger.exception("Error in visualization")
            print(f"Visualization error: {e!s}")

    def __show_transformation_result(self, original_image: np.ndarray, result: DetectionResult) -> None:
        h_matrix: HomoGraphyMatrix = result.homography_matrix.matrix  # type: ignore
        calibration_coords: np.ndarray = Point2D.to_ndarray(result.calibration_points)
        dart_coords: np.ndarray = Point2D.to_ndarray([d.original_dart_position for d in result.dart_detections])
        dart_scores: List[DartScore] = [d.dart_score for d in result.dart_detections]  # type: ignore

        original_viz = self.__create_original_visualization(original_image, calibration_coords, dart_coords)
        transformed_image = self.__apply_transformation(original_image, h_matrix)  # type: ignore

        if transformed_image is None:
            return

        transformed_viz = self.__create_transformed_visualization(
            transformed_image,
            dart_coords,
            dart_scores,
            h_matrix,  # type: ignore
            original_image.shape,
        )

        comparison = self.__create_side_by_side_view(original_viz, transformed_viz)
        self.__display_result(comparison)

    def __create_original_visualization(
        self,
        original_image: np.ndarray,
        calibration_coords: np.ndarray,
        dart_coords: np.ndarray,
    ) -> np.ndarray:
        viz = self.__draw_calibration_points(original_image.copy(), calibration_coords)
        if dart_coords is not None and len(dart_coords) > 0:
            viz = self.__draw_dart_points(viz, dart_coords)
        return viz

    @staticmethod
    def __apply_transformation(original_image: np.ndarray, h_matrix: np.ndarray) -> ndarray | None:
        try:
            return cv2.warpPerspective(
                original_image,
                h_matrix,
                (original_image.shape[1], original_image.shape[0]),
            )
        except cv2.error as e:  # noqa: F841
            logger.exception("Error applying homography transformation")
            return None

    def __create_transformed_visualization(
        self,
        transformed_image: np.ndarray,
        dart_coords: np.ndarray,
        dart_scores: List[DartScore],
        h_matrix: np.ndarray,
        original_shape: Tuple[int, ...],
    ) -> np.ndarray:
        viz = self.__draw_accurate_dart_board(transformed_image.copy())

        if dart_coords is not None and len(dart_coords) > 0:
            transformed_dart_coords = self.__transform_dart_coords(dart_coords, h_matrix, original_shape)
            viz = self.__draw_dart_points_with_scores(viz, transformed_dart_coords, dart_scores)

        return viz

    @staticmethod
    def __draw_calibration_points(image: np.ndarray, calibration_coords: np.ndarray) -> np.ndarray:
        if len(calibration_coords) == 0:
            return image

        height, width = image.shape[:2]
        pixel_coords = calibration_coords * np.array([width, height])

        for i, (x, y) in enumerate(pixel_coords):
            if x >= 0 and y >= 0:
                cv2.circle(image, (int(x), int(y)), VISUALIZATION_CIRCLE_RADIUS, (0, 255, 0), 2)
                cv2.putText(
                    image,
                    str(i + 1),
                    (int(x + VISUALIZATION_TEXT_OFFSET), int(y - VISUALIZATION_TEXT_OFFSET)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 255, 0),
                    2,
                )
        return image

    @staticmethod
    def __draw_dart_points(image: np.ndarray, dart_coords: np.ndarray) -> np.ndarray:
        if len(dart_coords) == 0:
            return image

        height, width = image.shape[:2]
        pixel_coords = dart_coords * np.array([width, height])

        for i, (x, y) in enumerate(pixel_coords):
            cv2.circle(image, (int(x), int(y)), VISUALIZATION_DART_CIRCLE_RADIUS, (0, 0, 255), 2)
            cv2.putText(
                image,
                f"D{i + 1}",
                (int(x + VISUALIZATION_TEXT_OFFSET), int(y + VISUALIZATION_TEXT_OFFSET)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 255),
                2,
            )
        return image

    @staticmethod
    def __draw_dart_points_with_scores(
        image: np.ndarray,
        dart_coords: np.ndarray,
        dart_scores: List[DartScore],
    ) -> np.ndarray:
        if len(dart_coords) == 0 or len(dart_scores) == 0:
            return image

        height, width = image.shape[:2]
        pixel_coords = dart_coords * np.array([width, height])

        for _i, ((x, y), score) in enumerate(zip(pixel_coords, dart_scores, strict=False)):
            cv2.circle(image, (int(x), int(y)), VISUALIZATION_DART_CIRCLE_RADIUS, (0, 0, 255), 2)
            score_text = score.score_string if hasattr(score, "score_string") else str(score)
            cv2.putText(
                image,
                score_text,
                (int(x + VISUALIZATION_TEXT_OFFSET), int(y - VISUALIZATION_TEXT_OFFSET)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (0, 0, 255),
                3,
            )
        return image

    @staticmethod
    def __transform_dart_coords(
        dart_coords: np.ndarray,
        homography_matrix: np.ndarray,
        image_shape: Tuple[int, ...],
    ) -> np.ndarray:
        if len(dart_coords) == 0:
            return dart_coords

        height, width = image_shape[:2]
        pixel_coords = dart_coords * np.array([width, height])
        homogeneous_coords = np.column_stack([pixel_coords, np.ones(len(pixel_coords))])

        transformed_coords = homography_matrix @ homogeneous_coords.T
        transformed_coords = transformed_coords / transformed_coords[2, :]
        transformed_pixel_coords = transformed_coords[:2, :].T

        return transformed_pixel_coords / np.array([width, height])

    def __draw_accurate_dart_board(self, image: np.ndarray) -> np.ndarray:
        height, width = image.shape[:2]
        center = (width // 2, height // 2)
        max_radius = min(width, height) // 2

        self.__draw_scoring_rings(image, center, max_radius)
        self.__draw_segment_numbers(image, center, max_radius)
        return image

    def __draw_scoring_rings(self, image: np.ndarray, center: Tuple[int, int], max_radius: int) -> None:
        scoring_radii_pixels = self.dart_board.scoring_radii * max_radius * 2
        ring_colors = [
            (128, 128, 128),
            (255, 0, 0),
            (0, 255, 0),
            (255, 255, 0),
            (0, 255, 0),
            (0, 255, 255),
            (255, 255, 0),
        ]

        for i in range(len(scoring_radii_pixels) - 1, 0, -1):
            radius = int(scoring_radii_pixels[i])
            if radius > 0:
                color = ring_colors[min(i, len(ring_colors) - 1)]
                cv2.circle(image, center, radius, color, 2)

    def __draw_segment_numbers(self, image: np.ndarray, center: Tuple[int, int], max_radius: int) -> None:
        text_radius = max_radius * VISUALIZATION_TEXT_RADIUS_RATIO
        num_samples = 40

        for i in range(0, num_samples, 2):  # Draw every other sample to avoid clutter
            angle_deg = (i * 360 / num_samples) - 90
            angle_rad = np.deg2rad(angle_deg)

            sample_position = self.__calculate_sample_position(angle_rad)
            segment_number = self.__get_segment_number_for_angle(sample_position)

            text_x = int(center[0] + text_radius * np.cos(angle_rad))
            text_y = int(center[1] + text_radius * np.sin(angle_rad))

            cv2.putText(
                image,
                str(segment_number),
                (text_x - 8, text_y + 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                2,
            )

    @staticmethod
    def __calculate_sample_position(angle_rad: float) -> np.ndarray:
        return np.array(
            [
                BOARD_CENTER_COORDINATE + VISUALIZATION_SAMPLE_POSITION_RADIUS * np.cos(angle_rad),
                BOARD_CENTER_COORDINATE + VISUALIZATION_SAMPLE_POSITION_RADIUS * np.sin(angle_rad),
            ],
        )

    def __get_segment_number_for_angle(self, sample_position: np.ndarray) -> int:
        adjusted_position = sample_position.copy()
        if adjusted_position[0] == BOARD_CENTER_COORDINATE:
            adjusted_position[0] += ANGLE_CALCULATION_EPSILON

        angle_for_scoring = np.arctan((adjusted_position[1] - BOARD_CENTER_COORDINATE) / (adjusted_position[0] - BOARD_CENTER_COORDINATE))
        angle_deg_for_scoring = np.rad2deg(angle_for_scoring)
        angle_deg_for_scoring = self.__normalize_angle_for_segment_boundary(angle_deg_for_scoring)
        return self.dart_board.get_segment_number(float(angle_deg_for_scoring), sample_position)

    @staticmethod
    def __normalize_angle_for_segment_boundary(angle_deg_for_scoring: np.ndarray) -> np.ndarray:
        return np.floor(angle_deg_for_scoring) if angle_deg_for_scoring > 0 else np.ceil(angle_deg_for_scoring)

    def __create_side_by_side_view(self, original: np.ndarray, transformed: np.ndarray) -> np.ndarray:
        target_height = min(original.shape[0], transformed.shape[0], VISUALIZATION_TARGET_HEIGHT)

        original_resized = self.__resize_to_height(original, target_height)
        transformed_resized = self.__resize_to_height(transformed, target_height)

        total_width = original_resized.shape[1] + transformed_resized.shape[1] + 20
        comparison = np.zeros((target_height, total_width, 3), dtype=np.uint8)

        comparison[:, : original_resized.shape[1]] = original_resized
        comparison[:, original_resized.shape[1] + 20 :] = transformed_resized

        self.__add_labels(comparison, original_resized.shape[1])
        return comparison

    @staticmethod
    def __resize_to_height(image: np.ndarray, target_height: int) -> np.ndarray:
        h, w = image.shape[:2]
        scale = target_height / h
        new_width = int(w * scale)
        return cv2.resize(image, (new_width, target_height))

    @staticmethod
    def __add_labels(comparison: np.ndarray, split_point: int) -> None:
        cv2.putText(comparison, "Original", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(comparison, "Transformed", (split_point + 30, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    def __display_result(self, comparison: np.ndarray) -> None:
        cv2.imshow(self.window_name, comparison)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

    def __load_and_prepare_image(self, image_path: Path) -> ndarray | None:
        image = load_image(image_path)
        if image is None:
            logger.error("Could not load image: %s", image_path)
            return None
        return self.preprocessor.preprocess_image(image)
