"""Service that takes in existing homography matrix and dart detections, to calculate scores for the darts."""

import logging
import time
from typing import List, Optional

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import (
    CalibrationResult,
    DartDetection,
    DartScore,
    HomoGraphyMatrix,
    OriginalDartPosition,
    ScoringResult,
    TransformedDartPosition,
)
from detector.model.detection_result_code import ResultCode
from detector.model.exception import DartDetectionError
from detector.model.image_models import DartImage
from detector.service.calibration.coordinate_transformer import CoordinateTransformer
from detector.service.image_preprocessor import ImagePreprocessor
from detector.service.parser.yolo_result_parser import YoloResultParser
from detector.service.scoring.dart_point_score_calculator import DartPointScoreCalculator
from detector.yolo.dart_detector import YoloDartImageProcessor


class DartScoringService:
    """Service that takes in existing homography matrix and dart detections, to calculate scores for the darts."""

    logger = logging.getLogger(__qualname__)

    def __init__(
        self,
        config: Optional[ProcessingConfig] = None,
        coordinate_transformer: Optional[CoordinateTransformer] = None,
        score_calculator: Optional[DartPointScoreCalculator] = None,
        yolo_image_processor: Optional[YoloDartImageProcessor] = None,
        yolo_result_parser: Optional[YoloResultParser] = None,
        image_preprocessor: Optional[ImagePreprocessor] = None,
    ) -> None:
        self.__config = config or ProcessingConfig()
        self.__coordinate_transformer = coordinate_transformer or CoordinateTransformer(self.__config)
        self.__score_calculator = score_calculator or DartPointScoreCalculator()
        self.__yolo_image_processor = yolo_image_processor or YoloDartImageProcessor(self.__config)
        self.__yolo_result_parser = yolo_result_parser or YoloResultParser(self.__config)
        self.__image_preprocessor = image_preprocessor or ImagePreprocessor(self.__config)

    def calculate_scores_from_image(self, image: DartImage, calibration_result: CalibrationResult) -> ScoringResult:
        """Calculate scores for the darts based on the image and calibration result."""
        try:
            start_time = time.time()
            self.__validate_input(image, calibration_result)
            self.__image_preprocessor.preprocess_images_from_preprocessing_result(
                image=image, preprocessing_result=calibration_result.preprocessing_result
            )
            results = self.__yolo_image_processor.detect(image)
            detections = self.__yolo_result_parser.extract_detections(results)
            return self.__calculate_scores(calibration_result.homography_matrix, detections.original_positions, start_time)  # type: ignore
        except DartDetectionError as e:
            self.logger.exception("Dart scoring failed")
            return ScoringResult(processing_time=0.0, result_code=e.error_code, message=e.message, details=e.details)
        except Exception as e:
            msg = "Unknown error during dart scoring pipeline"
            self.logger.exception(msg)
            return ScoringResult(processing_time=0.0, result_code=ResultCode.UNKNOWN, message=msg, details=str(e))

    def calculate_scores(self, calibration_result: CalibrationResult, original_positions: List[OriginalDartPosition]) -> ScoringResult:
        """Calculate scores for the darts based on the image, calibration result, and original dart positions."""
        start_time = time.time()
        return self.__calculate_scores(calibration_result.homography_matrix, original_positions, start_time)  # type: ignore

    @staticmethod
    def __validate_input(image: Optional[DartImage], calibration_result: CalibrationResult) -> None:
        if image is None or image.raw_image is None:
            raise DartDetectionError(ResultCode.INVALID_INPUT, details="Image cannot be None")
        if calibration_result is None or calibration_result.preprocessing_result is None:
            raise DartDetectionError(ResultCode.INVALID_INPUT, details="Calibration result is invalid or missing preprocessing result")

    def __calculate_scores(
        self, homography_matrix: HomoGraphyMatrix, original_positions: List[OriginalDartPosition], start_time: float
    ) -> ScoringResult:
        transformed_positions = self.__coordinate_transformer.transform_to_board_dimensions(homography_matrix, original_positions)
        scores = self.__score_calculator.calculate_scores(transformed_positions)

        scoring_result = ScoringResult(
            dart_detections=self.__create_dart_detections(original_positions, transformed_positions, scores),
            processing_time=round(time.time() - start_time, 3),
            result_code=ResultCode.SUCCESS,
            message="Scores calculated successfully",
        )

        self.logger.info("Scoring completed in %s seconds: %s", scoring_result.processing_time, scoring_result)
        return scoring_result

    @staticmethod
    def __create_dart_detections(
        original_positions: List[OriginalDartPosition], transformed_positions: List[TransformedDartPosition], scores: List[DartScore]
    ) -> List[DartDetection]:
        if not (len(original_positions) == len(transformed_positions) == len(scores)):
            message = (
                f"All input lists must have the same length. "
                f"Got {len(original_positions)} original positions, "
                f"{len(transformed_positions)} transformed positions, "
                f"and {len(scores)} scores"
            )
            raise ValueError(message)

        dart_detections = []
        for original_pos, transformed_pos, dart_score in zip(original_positions, transformed_positions, scores, strict=False):
            dart_detection = DartDetection(original_position=original_pos, transformed_position=transformed_pos, dart_score=dart_score)
            dart_detections.append(dart_detection)

        return dart_detections
