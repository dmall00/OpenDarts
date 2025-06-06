"""Service to calibrate, detect and score darts in images using YOLO and custom processing."""

import logging
import time
from typing import TYPE_CHECKING, List, Optional

import numpy as np

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import (
    CalibrationPoint,
    DartDetection,
    DetectionResult,
    HomoGraphyMatrix,
    YoloDartParseResult,
)
from detector.model.detection_result_code import DetectionResultCode
from detector.model.exception import DartDetectionError
from detector.service.calibration_matrix_calculator import CalibrationMatrixCalculator
from detector.service.coordinate_transformer import CoordinateTransformer
from detector.service.dart_point_score_calculator import DartPointScoreCalculator
from detector.service.parser.yolo_result_parser import YoloResultParser
from detector.yolo.dart_detector import YoloDartImageProcessor

if TYPE_CHECKING:
    from ultralytics.engine.results import Results

logger = logging.getLogger(__name__)


class CompleteDartScoringService:
    """Service responsible for orchestrating the dart detection pipeline with calibration and scoring."""

    def __init__(self, config: Optional[ProcessingConfig] = None) -> None:
        self.__config = config or ProcessingConfig()
        self.__yolo_image_processor = YoloDartImageProcessor(self.__config)
        self.__yolo_result_parser = YoloResultParser(self.__config)
        self.__calibration_service = CalibrationMatrixCalculator(self.__config)
        self.__coordinate_service = CoordinateTransformer(self.__config)
        self.__scoring_service = DartPointScoreCalculator()

    def detect_and_score(self, image: np.ndarray) -> DetectionResult:
        """Execute the complete detection and scoring pipeline."""
        try:
            start_time = time.time()
            yolo_result: Results = self.__yolo_image_processor.detect(image)
            yolo_dart_result: YoloDartParseResult = self.__yolo_result_parser.extract_detections(yolo_result)
            dart_detections: List[DartDetection] = yolo_dart_result.dart_detections

            homography_matrix: HomoGraphyMatrix = self.__calibration_service.calculate_homography(yolo_dart_result.calibration_points)
            self.__coordinate_service.transform_to_board_dimensions(
                homography_matrix,
                dart_detections,
            )
            self.__scoring_service.calculate_scores(dart_detections)

            processing_time = round(time.time() - start_time, 2)
            logger.info("Detection took %s seconds", processing_time)

            return self.__create_success_result(
                dart_detections=dart_detections,
                calibration_points=yolo_dart_result.calibration_points,
                homography_matrix=homography_matrix,
                processing_time=processing_time,
            )
        except DartDetectionError as e:
            logger.exception("Dart detection failed")
            return self.__create_error_result(e.error_code, e.message)
        except Exception as e:
            logger.exception("Unknown error during detection pipeline")
            return self.__create_error_result(DetectionResultCode.UNKNOWN, f"Unknown error occurred: {e}")

    @staticmethod
    def __create_success_result(
        dart_detections: List[DartDetection],
        calibration_points: List[CalibrationPoint],
        homography_matrix: HomoGraphyMatrix,
        processing_time: float,
    ) -> DetectionResult:
        return DetectionResult(
            dart_detections=dart_detections,
            processing_time=processing_time,
            homography_matrix=homography_matrix,
            calibration_points=calibration_points,
            result_code=DetectionResultCode.SUCCESS,
            message=f"Successfully detected {len(dart_detections)} darts",
        )

    @staticmethod
    def __create_error_result(code: DetectionResultCode, message: str) -> DetectionResult:
        return DetectionResult(
            dart_detections=[],
            processing_time=0.0,
            homography_matrix=None,
            calibration_points=[],
            result_code=code,
            message=message,
        )
