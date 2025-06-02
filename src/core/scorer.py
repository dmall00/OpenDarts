import logging

import numpy as np

from src.geometry.board import DartBoard

logger = logging.getLogger(__name__)


class DartScorer:
    def __init__(self):
        self.board = DartBoard()

    def calculate_scores(self, dart_positions):
        if len(dart_positions) == 0:
            logger.debug("No dart positions to score")
            return [], 0

        logger.debug(f"Calculating scores for {len(dart_positions)} darts")
        dart_scores = ['' for _ in range(len(dart_positions))]
        total_score = 0

        adjusted_positions = self._adjust_center_positions(dart_positions)
        angles = self._calculate_angles(adjusted_positions)

        for i, (position, angle) in enumerate(zip(dart_positions, angles)):
            segment_number = self.board.get_segment_number(angle, position)
            scoring_region = self.board.get_scoring_region(position)
            score_string, score_value = self.board.calculate_final_score(segment_number, scoring_region)

            dart_scores[i] = score_string
            total_score += score_value
            logger.debug(f"Dart {i}: Position {position} -> {score_string} ({score_value} points)")

        logger.info(f"Final scoring: {dart_scores} = {total_score} points")
        return dart_scores, total_score

    def _adjust_center_positions(self, dart_positions):
        adjusted_positions = dart_positions.copy()
        center_mask = adjusted_positions[:, 0] == 0.5
        adjusted_positions[center_mask, 0] += 0.00001
        return adjusted_positions

    def _calculate_angles(self, dart_positions):
        angles_rad = np.arctan((dart_positions[:, 1] - 0.5) / (dart_positions[:, 0] - 0.5))
        angles_deg = np.rad2deg(angles_rad)
        return np.where(angles_deg > 0, np.floor(angles_deg), np.ceil(angles_deg))
