import logging
import time
from typing import List

from ultralytics.engine.results import Results

from src.infrastructure.yolo_detector import YoloDartImageProcessor
from src.models.detection_models import DetectionResult, DartResult, YoloDartParseResult, DartPositions, \
    DartScore, CalibrationPoints
from src.models.geometry_models import HomoGraphyMatrix
from src.services.calibration_service import CalibrationService
from src.services.coordinate_service import TransformationService
from src.services.prediction_service import ScoringStabilizingService
from src.services.scoring_service import ScoringService

logger = logging.getLogger(__name__)


class DartDetectionService:
    """Service responsible for orchestrating the dart detection pipeline."""

    def __init__(self):
        self.__yolo_image_processor = YoloDartImageProcessor()
        self.__calibration_service = CalibrationService()
        self.__coordinate_service = TransformationService()
        self.__stabilization_service = ScoringStabilizingService()
        self.__scoring_service = ScoringService()

    def detect_and_score(self, image) -> DetectionResult:
        """
        Execute the complete detection and scoring pipeline.
        """
        try:
            start_time = time.time()
            
            yolo_result: Results = self.__yolo_image_processor.detect(image)
            yolo_dart_result: YoloDartParseResult = self.__yolo_image_processor.extract_detections(yolo_result)

            homography_matrix: HomoGraphyMatrix = self.__calibration_service.calculate_homography(
                yolo_dart_result.calibration_points.to_ndarray())

            original_dart_positions = yolo_dart_result.dart_positions

            dart_positions: DartPositions = self.__coordinate_service.transform_to_board_dimensions(
                homography_matrix.matrix, yolo_dart_result.dart_positions.to_ndarray()
            )

            stable_darts: DartPositions = self.__stabilization_service.get_stable_darts(dart_positions.positions)
            dart_scores: List[DartScore] = self.__scoring_service.calculate_scores(stable_darts.positions)

            processing_time = round(time.time() - start_time, 2)
            logger.info(f"Detection took {processing_time} seconds")

            return self.__create_success_result(
                dart_result=DartResult(stable_darts, dart_scores, original_dart_positions),
                calibration_points=yolo_dart_result.calibration_points,
                homography_matrix=homography_matrix,
                processing_time=processing_time)
        except Exception as e:
            logger.error(f"Detection pipeline failed: {str(e)}", exc_info=True)  # TODO
            raise

    def __create_success_result(self, dart_result: DartResult, calibration_points: CalibrationPoints,
                                homography_matrix: HomoGraphyMatrix, processing_time: float) -> DetectionResult:
        return DetectionResult(
            dart_result=dart_result,
            processing_time=processing_time,
            homography_matrix=homography_matrix,
            calibration_points=calibration_points,
            success=True,
            message=f"Successfully detected {len(dart_result.dart_positions.positions)} darts"
        )
