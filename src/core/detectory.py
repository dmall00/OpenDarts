import logging

import numpy as np

from src.core.scorer import DartScorer
from src.core.transformer import CoordinateTransformer
from src.geometry.calibrator import BoardCalibrator
from src.processing.prediction_queue import PredictionQueue
from src.processing.yolo_processor import YoloProcessor

logger = logging.getLogger(__name__)


class DartDetector:
    def __init__(self, model_path: str = "../../weights.pt"):
        logger.info(f"Initializing DartDetector with model: {model_path}")
        self.yolo_processor = YoloProcessor(model_path)
        self.calibrator = BoardCalibrator()
        self.transformer = CoordinateTransformer()
        self.scorer = DartScorer()
        self.prediction_queue = PredictionQueue()
        self.dart_coords_in_visit = []
        self.darts_in_visit = [''] * 3
        self.user_calibration = -np.ones((6, 2))
        logger.info("DartDetector initialization complete")

    def reset_visit_state(self):
        logger.info("Resetting visit state")
        self.dart_coords_in_visit = []
        self.darts_in_visit = [''] * 3
        self.prediction_queue.reset()

    def process_frame(self, result, resolution, crop_start, crop_size, repeat_threshold=1):
        logger.debug("Processing new frame")

        calibration_coords, dart_coords = self.yolo_processor.extract_detections(result)

        if not self.calibrator.has_sufficient_points(calibration_coords):
            logger.warning("Insufficient calibration points detected")
            return None, calibration_coords, dart_coords, self.darts_in_visit, 0

        calibration_coords, dart_coords = self.transformer.adjust_for_crop(
            calibration_coords, dart_coords, resolution, crop_start, crop_size
        )

        calibration_coords = self._apply_user_calibration(calibration_coords)
        h_matrix = self.calibrator.calculate_homography(calibration_coords, crop_size)

        transformed_coords = self.transformer.transform_to_board(
            h_matrix[0], dart_coords, crop_size
        )

        self.prediction_queue.process_predictions(
            transformed_coords, repeat_threshold, self.dart_coords_in_visit
        )

        self.dart_coords_in_visit = self.prediction_queue.get_stable_darts()
        self.darts_in_visit, score = self.scorer.calculate_scores(
            np.array(self.dart_coords_in_visit)
        )

        while len(self.darts_in_visit) < 3:
            self.darts_in_visit.append('')

        return h_matrix, calibration_coords, dart_coords, self.darts_in_visit, score

    def _apply_user_calibration(self, calibration_coords):
        return np.where(
            self.user_calibration == -1, calibration_coords, self.user_calibration
        )
