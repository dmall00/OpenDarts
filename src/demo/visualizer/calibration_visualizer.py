import logging
from typing import Tuple, List

import cv2
import numpy as np
from numpy import ndarray

from src.domain.board import DartBoard
from src.models.detection_models import DetectionResult, DartScore
from src.models.geometry_models import HomoGraphyMatrix
from src.services.detection_service import DartDetectionService
from src.utils.file_utils import resize_image

logger = logging.getLogger(__name__)


class CalibrationVisualizer:

    def __init__(self) -> None:
        self.window_name: str = "Calibration Visualization"
        self.dart_board: DartBoard = DartBoard()
        self.detection_service: DartDetectionService = DartDetectionService()

    def show_transformation_result(
            self,
            original_image: np.ndarray,
            calibration_coords: np.ndarray,
            homography_matrix: HomoGraphyMatrix,
            dart_coords: np.ndarray,
            dart_scores: List[DartScore]
    ) -> None:
        if not self.__is_valid_homography_matrix(homography_matrix):
            logger.warning("Invalid homography matrix - cannot show transformation")
            return

        h_matrix = self.__prepare_homography_matrix(homography_matrix.matrix)
        original_viz = self.__create_original_visualization(original_image, calibration_coords, dart_coords)
        transformed_image = self.__apply_transformation(original_image, h_matrix)

        if transformed_image is None:
            return

        transformed_viz = self.__create_transformed_visualization(
            transformed_image, dart_coords, dart_scores, h_matrix, original_image.shape
        )

        comparison = self.__create_side_by_side_view(original_viz, transformed_viz)
        self.__display_result(comparison)

    def show_simple_transformation(self, image_path: str) -> None:
        try:
            image = self.__load_and_prepare_image(image_path)
            if image is None:
                return

            result = self.detection_service.detect_and_score(image)

            if not self.__is_valid_detection_result(result):
                print("Could not find sufficient calibration points for visualization")
                return

            self.show_transformation_result(
                image,
                result.calibration_points.to_ndarray(),
                result.homography_matrix,
                result.dart_result.original_dart_positions.to_ndarray(),
                result.dart_result.dart_scores
            )

            self.__print_results(result)

        except Exception as e:
            logger.error(f"Error in visualization: {str(e)}", exc_info=True)
            print(f"Visualization error: {str(e)}")

    def __is_valid_homography_matrix(self, homography_matrix: HomoGraphyMatrix) -> bool:
        return (homography_matrix is not None and
                homography_matrix.matrix is not None and
                isinstance(homography_matrix.matrix, np.ndarray) and
                homography_matrix.matrix.shape == (3, 3))

    def __prepare_homography_matrix(self, h_matrix: np.ndarray) -> np.ndarray:
        if h_matrix.dtype not in [np.float32, np.float64]:
            h_matrix = h_matrix.astype(np.float32)
        return h_matrix

    def __create_original_visualization(
            self, original_image: np.ndarray, calibration_coords: np.ndarray, dart_coords: np.ndarray
    ) -> np.ndarray:
        viz = self.__draw_calibration_points(original_image.copy(), calibration_coords)
        if dart_coords is not None and len(dart_coords) > 0:
            viz = self.__draw_dart_points(viz, dart_coords)
        return viz

    def __apply_transformation(self, original_image: np.ndarray, h_matrix: np.ndarray) -> np.ndarray:
        try:
            return cv2.warpPerspective(
                original_image,
                h_matrix,
                (original_image.shape[1], original_image.shape[0])
            )
        except cv2.error as e:
            logger.error(f"Error applying homography transformation: {e}")
            return None

    def __create_transformed_visualization(
            self,
            transformed_image: np.ndarray,
            dart_coords: np.ndarray,
            dart_scores: List[DartScore],
            h_matrix: np.ndarray,
            original_shape: Tuple[int, ...]
    ) -> np.ndarray:
        viz = self.__draw_accurate_dart_board(transformed_image.copy())

        if dart_coords is not None and len(dart_coords) > 0:
            transformed_dart_coords = self.__transform_dart_coords(dart_coords, h_matrix, original_shape)
            viz = self.__draw_dart_points_with_scores(viz, transformed_dart_coords, dart_scores)

        return viz

    def __draw_calibration_points(self, image: np.ndarray, calibration_coords: np.ndarray) -> np.ndarray:
        if len(calibration_coords) == 0:
            return image

        height, width = image.shape[:2]
        pixel_coords = calibration_coords * np.array([width, height])

        for i, (x, y) in enumerate(pixel_coords):
            if x >= 0 and y >= 0:
                cv2.circle(image, (int(x), int(y)), 8, (0, 255, 0), 2)
                cv2.putText(
                    image, str(i + 1), (int(x + 10), int(y - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2
                )
        return image

    def __draw_dart_points(self, image: np.ndarray, dart_coords: np.ndarray) -> np.ndarray:
        if len(dart_coords) == 0:
            return image

        height, width = image.shape[:2]
        pixel_coords = dart_coords * np.array([width, height])

        for i, (x, y) in enumerate(pixel_coords):
            cv2.circle(image, (int(x), int(y)), 6, (0, 0, 255), 2)
            cv2.putText(
                image, f"D{i + 1}", (int(x + 10), int(y + 10)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2
            )
        return image

    def __draw_dart_points_with_scores(
            self, image: np.ndarray, dart_coords: np.ndarray, dart_scores: List[DartScore]
    ) -> np.ndarray:
        if len(dart_coords) == 0 or len(dart_scores) == 0:
            return image

        height, width = image.shape[:2]
        pixel_coords = dart_coords * np.array([width, height])

        for i, ((x, y), score) in enumerate(zip(pixel_coords, dart_scores)):
            cv2.circle(image, (int(x), int(y)), 6, (0, 0, 255), 2)
            score_text = score.score_string if hasattr(score, 'score_string') else str(score)
            cv2.putText(
                image, score_text, (int(x + 10), int(y - 10)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 3
            )
        return image

    def __transform_dart_coords(
            self, dart_coords: np.ndarray, homography_matrix: np.ndarray, image_shape: Tuple[int, ...]
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
        scoring_radii_pixels = self.dart_board._scoring_radii * max_radius * 2
        ring_colors = [
            (128, 128, 128), (255, 0, 0), (0, 255, 0),
            (255, 255, 0), (0, 255, 0), (0, 255, 255), (255, 255, 0)
        ]

        for i in range(len(scoring_radii_pixels) - 1, 0, -1):
            radius = int(scoring_radii_pixels[i])
            if radius > 0:
                color = ring_colors[min(i, len(ring_colors) - 1)]
                cv2.circle(image, center, radius, color, 2)

    def __draw_segment_numbers(self, image: np.ndarray, center: Tuple[int, int], max_radius: int) -> None:
        text_radius = max_radius * 0.8
        num_samples = 40

        for i in range(0, num_samples, 2):  # Draw every other sample to avoid clutter
            angle_deg = (i * 360 / num_samples) - 90
            angle_rad = np.deg2rad(angle_deg)

            sample_position = self.__calculate_sample_position(angle_rad)
            segment_number = self.__get_segment_number_for_angle(sample_position, angle_rad)

            text_x = int(center[0] + text_radius * np.cos(angle_rad))
            text_y = int(center[1] + text_radius * np.sin(angle_rad))

            cv2.putText(
                image, str(segment_number), (text_x - 8, text_y + 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2
            )

    def __calculate_sample_position(self, angle_rad: float) -> np.ndarray:
        return np.array([
            0.5 + 0.4 * np.cos(angle_rad),
            0.5 + 0.4 * np.sin(angle_rad)
        ])

    def __get_segment_number_for_angle(self, sample_position: np.ndarray, angle_rad: float) -> int:
        adjusted_position = sample_position.copy()
        if adjusted_position[0] == 0.5:
            adjusted_position[0] += 0.00001

        angle_for_scoring = np.arctan((adjusted_position[1] - 0.5) / (adjusted_position[0] - 0.5))
        angle_deg_for_scoring = np.rad2deg(angle_for_scoring)

        if angle_deg_for_scoring > 0:
            angle_deg_for_scoring = np.floor(angle_deg_for_scoring)
        else:
            angle_deg_for_scoring = np.ceil(angle_deg_for_scoring)

        return self.dart_board.get_segment_number(float(angle_deg_for_scoring), sample_position)

    def __create_side_by_side_view(self, original: np.ndarray, transformed: np.ndarray) -> np.ndarray:
        target_height = min(original.shape[0], transformed.shape[0], 600)

        original_resized = self.__resize_to_height(original, target_height)
        transformed_resized = self.__resize_to_height(transformed, target_height)

        total_width = original_resized.shape[1] + transformed_resized.shape[1] + 20
        comparison = np.zeros((target_height, total_width, 3), dtype=np.uint8)

        comparison[:, :original_resized.shape[1]] = original_resized
        comparison[:, original_resized.shape[1] + 20:] = transformed_resized

        self.__add_labels(comparison, original_resized.shape[1])
        return comparison

    def __resize_to_height(self, image: np.ndarray, target_height: int) -> np.ndarray:
        h, w = image.shape[:2]
        scale = target_height / h
        new_width = int(w * scale)
        return cv2.resize(image, (new_width, target_height))

    def __add_labels(self, comparison: np.ndarray, split_point: int) -> None:
        cv2.putText(comparison, "Original", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(comparison, "Transformed", (split_point + 30, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255),
                    2)

    def __display_result(self, comparison: np.ndarray) -> None:
        cv2.imshow(self.window_name, comparison)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

    def __load_and_prepare_image(self, image_path: str) -> ndarray | None:
        image = cv2.imread(image_path)
        if image is None:
            logger.error(f"Could not load image: {image_path}")
            return None
        return resize_image(image=image)

    def __is_valid_detection_result(self, result: DetectionResult) -> bool:
        return (result.homography_matrix is not None and
                result.homography_matrix.matrix is not None)

    def __print_results(self, result: DetectionResult) -> None:
        print(f"Detected darts: {result.dart_result.dart_scores}")
        print(f"Total score: {result.dart_result.get_total_score()}")
