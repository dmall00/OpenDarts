"""Service to detect and score darts in images using YOLO and custom processing."""

import logging
import time
from typing import TYPE_CHECKING, List

import numpy as np

from src.infrastructure.yolo_model_darts_processor import YoloDartImageProcessor
from src.models.detection_models import (
    CalibrationPoints,
    DartPositions,
    DartResult,
    DartScore,
    DetectionResult,
    HomoGraphyMatrix,
    YoloDartParseResult,
)
from src.models.exception import Code, DartDetectionError
from src.services.calibration_service import CalibrationService
from src.services.coordinate_service import TransformationService
from src.services.scoring_service import ScoringService
from src.services.scoring_stabilization_service import ScoringStabilizingService

if TYPE_CHECKING:
    from ultralytics.engine.results import Results

logger = logging.getLogger(__name__)


class DartDetectionService:
    """Service responsible for orchestrating the dart detection pipeline."""

    def __init__(self) -> None:
        self.__yolo_image_processor = YoloDartImageProcessor()
        self.__calibration_service = CalibrationService()
        self.__coordinate_service = TransformationService()
        self.__stabilization_service = ScoringStabilizingService()
        self.__scoring_service = ScoringService()

    def detect_and_score(self, image: np.ndarray) -> DetectionResult:
        """Execute the complete detection and scoring pipeline."""
        try:
            start_time = time.time()

            yolo_result: Results = self.__yolo_image_processor.detect(image)
            yolo_dart_result: YoloDartParseResult = self.__yolo_image_processor.extract_detections(yolo_result)

            homography_matrix: HomoGraphyMatrix = self.__calibration_service.calculate_homography(
                yolo_dart_result.calibration_points.to_ndarray())

            original_dart_positions = yolo_dart_result.dart_positions

            dart_positions: DartPositions = self.__coordinate_service.transform_to_board_dimensions(
                homography_matrix.matrix, yolo_dart_result.dart_positions.to_ndarray(),
            )

            stable_darts: DartPositions = self.__stabilization_service.get_stable_darts(dart_positions.positions)
            dart_scores: List[DartScore] = self.__scoring_service.calculate_scores(stable_darts.positions)

            processing_time = round(time.time() - start_time, 2)
            logger.info("Detection took %s seconds", processing_time)

            return self.__create_success_result(
                dart_result=DartResult(stable_darts, dart_scores, original_dart_positions),
                calibration_points=yolo_dart_result.calibration_points,
                homography_matrix=homography_matrix,
                processing_time=processing_time)
        except DartDetectionError as e:
            logger.exception("Dart detection failed")
            return self.__create_error_result(e.error_code, e.message)
        except Exception as e:
            logger.exception("Unknown error during detection pipeline")
            return self.__create_error_result(Code.UNKNOWN, f"Unknown error occurred: {e}")

    @staticmethod
    def __create_success_result(dart_result: DartResult, calibration_points: CalibrationPoints,
                                homography_matrix: HomoGraphyMatrix, processing_time: float) -> DetectionResult:
        return DetectionResult(
            dart_result=dart_result,
            processing_time=processing_time,
            homography_matrix=homography_matrix,
            calibration_points=calibration_points,
            code=Code.SUCCESS,
            message=f"Successfully detected {len(dart_result.dart_positions.positions)} darts",
        )

    @staticmethod
    def __create_error_result(code: Code, message: str) -> DetectionResult:
        return DetectionResult(
            dart_result=None,
            processing_time=0.0,
            homography_matrix=None,
            calibration_points=CalibrationPoints(points=[]),
            code=code,
            message=message,
        )
