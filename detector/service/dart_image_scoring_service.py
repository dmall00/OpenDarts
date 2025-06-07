"""Service to calibrate, detect and score darts in images using YOLO and custom processing."""

import logging
import time
from typing import Optional

import numpy as np

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import (
    CalibrationResult,
    DetectionResult,
    ScoringResult,
)
from detector.model.detection_result_code import ResultCode
from detector.model.exception import DartDetectionError
from detector.service.calibration.board_calibration_service import DartBoardCalibrationService
from detector.service.parser.yolo_result_parser import YoloResultParser
from detector.service.scoring.dart_scoring_service import DartScoringService
from detector.yolo.dart_detector import YoloDartImageProcessor


class DartInImageScoringService:
    """Service responsible for orchestrating the dart detection pipeline with calibration and scoring."""

    logger = logging.getLogger(__name__)

    def __init__(
        self,
        config: Optional[ProcessingConfig] = None,
        yolo_image_processor: Optional[YoloDartImageProcessor] = None,
        yolo_result_parser: Optional[YoloResultParser] = None,
        calibration_service: Optional[DartBoardCalibrationService] = None,
        dart_scoring_service: Optional[DartScoringService] = None,
    ) -> None:
        self.__config = config or ProcessingConfig()
        self.__yolo_image_processor = yolo_image_processor or YoloDartImageProcessor(self.__config)
        self.__yolo_result_parser = yolo_result_parser or YoloResultParser(self.__config)
        self.__calibration_service = calibration_service or DartBoardCalibrationService(
            self.__config, yolo_image_processor=self.__yolo_image_processor, yolo_result_parser=self.__yolo_result_parser
        )
        self.__dart_scoring_service = dart_scoring_service or DartScoringService(
            self.__config, yolo_image_processor=self.__yolo_image_processor, yolo_result_parser=self.__yolo_result_parser
        )

    def detect_and_score(self, image: np.ndarray) -> DetectionResult:
        """Execute the complete detection and scoring pipeline."""
        try:
            start_time = time.time()
            results = self.__yolo_image_processor.detect(image)
            detections = self.__yolo_result_parser.extract_detections(results)
            calibration_result = self.__calibration_service.calibrate_board(detections.calibration_points)
            scoring_result = self.__dart_scoring_service.calculate_scores(calibration_result, detections.original_positions)
            processing_time = round(time.time() - start_time, 3)
            self.logger.info("Full detection pipeline took %s seconds", processing_time)
            return self.__create_success_result(scoring_result, calibration_result, processing_time)
        except DartDetectionError as e:
            self.logger.exception("Dart detection failed")
            return self.__create_error_result(e.error_code, e.message)
        except Exception as e:
            self.logger.exception("Unknown error during detection pipeline")
            return self.__create_error_result(ResultCode.UNKNOWN, f"Unknown error occurred: {e}")

    @staticmethod
    def __create_success_result(
        scoring_result: ScoringResult,
        calibration_result: CalibrationResult,
        processing_time: float,
    ) -> DetectionResult:
        return DetectionResult(
            calibration_result=calibration_result,
            scoring_result=scoring_result,
            processing_time=processing_time,
            result_code=ResultCode.SUCCESS,
            message=f"Successfully detected {len(scoring_result.dart_detections)} darts",
        )

    @staticmethod
    def __create_error_result(code: ResultCode, message: str) -> DetectionResult:
        return DetectionResult(
            processing_time=0.0,
            result_code=code,
            message=message,
        )
