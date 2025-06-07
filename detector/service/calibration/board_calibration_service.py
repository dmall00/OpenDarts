"""Service to receive an image and return the homography matrix for dartboard calibration."""

import logging
import time
from typing import List, Optional

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import CalibrationPoint, CalibrationResult, HomoGraphyMatrix
from detector.model.detection_result_code import ResultCode
from detector.model.exception import DartDetectionError
from detector.model.image_models import DartImage
from detector.service.calibration.calibration_matrix_calculator import CalibrationMatrixCalculator
from detector.service.parser.yolo_result_parser import YoloResultParser
from detector.yolo.dart_detector import YoloDartImageProcessor


class DartBoardCalibrationService:
    """Service to receive an image and return the homography matrix for dartboard calibration."""

    logger = logging.getLogger(__qualname__)

    def __init__(
        self,
        config: Optional[ProcessingConfig] = None,
        yolo_image_processor: Optional[YoloDartImageProcessor] = None,
        yolo_result_parser: Optional[YoloResultParser] = None,
    ) -> None:
        self.__config = config or ProcessingConfig()
        self.__calibration_matrix_calculator = CalibrationMatrixCalculator(self.__config)
        self.__yolo_image_processor = yolo_image_processor or YoloDartImageProcessor(self.__config)
        self.__yolo_result_parser = yolo_result_parser or YoloResultParser(self.__config)

    def calibrate_board_from_image(self, image: DartImage) -> CalibrationResult:
        """Calculate the homography matrix based on provided calibration points."""
        try:
            start_time = time.time()
            self.__validate_image(image)

            results = self.__yolo_image_processor.detect(image)
            detections = self.__yolo_result_parser.extract_detections(results)
            homography = self.__calibration_matrix_calculator.calculate_homography(detections.calibration_points)
            return self.__create_calibration_result(homography, detections.calibration_points, start_time)
        except DartDetectionError as e:
            self.logger.exception("Dartboard calibration failed")
            return CalibrationResult(0.0, e.error_code, e.message, e.details)
        except Exception as e:
            msg = "Unknown error during dartboard calibration"
            self.logger.exception(msg)
            return CalibrationResult(0.0, ResultCode.UNKNOWN, msg, str(e))

    def calibrate_board(self, calibration_points: List[CalibrationPoint]) -> CalibrationResult:
        """Calculate the homography matrix based on provided calibration points."""
        start_time = time.time()

        homography = self.__calibration_matrix_calculator.calculate_homography(calibration_points)
        return self.__create_calibration_result(homography, calibration_points, start_time)

    @staticmethod
    def __validate_image(image: Optional[DartImage]) -> None:
        if image is None or image.raw_image is None:
            raise DartDetectionError(ResultCode.INVALID_INPUT, details="Image cannot be None")

    @staticmethod
    def __create_calibration_result(
        homography: HomoGraphyMatrix, calibration_points: List[CalibrationPoint], start_time: float
    ) -> CalibrationResult:
        calibration_result = CalibrationResult(
            processing_time=round(time.time() - start_time, 3),
            result_code=ResultCode.SUCCESS,
            message="Calibration successful",
            homography_matrix=homography,
            calibration_points=calibration_points,
        )
        DartBoardCalibrationService.logger.info("Calibration completed in %s seconds", calibration_result.processing_time)
        return calibration_result
