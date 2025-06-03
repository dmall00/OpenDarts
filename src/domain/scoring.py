import logging
from typing import List

import numpy as np

from src.domain.board import DartBoard
from src.models.detection_models import DartPosition, DartScore

logger = logging.getLogger(__name__)


class DartScorer:
    """Domain service for calculating dart scores."""

    def __init__(self):
        self._board = DartBoard()

    def calculate_scores(self, dart_positions: List[DartPosition]) -> List[DartScore]:
        """
        Calculate scores for all darts.
        """
        if not dart_positions:
            logger.debug("No dart positions to score")
            return [], 0

        logger.debug(f"Calculating scores for {len(dart_positions)} darts")

        dart_scores = []
        total_score = 0

        for i, position in enumerate(dart_positions):
            score = self.__calculate_single_dart_score(position)
            dart_scores.append(score)
            total_score += score.score_value

            logger.info(f"Dart {i}: Position {position} -> {score.score_string} ({score.score_value} points)")

        logger.info(f"Final scoring: Total {total_score} points")
        return dart_scores

    def __calculate_single_dart_score(self, position: DartPosition) -> DartScore:
        """Calculate score for a single dart."""
        position_array = self.__adjust_center_position(position.to_array())
        angle = self.__calculate_angle(position_array)

        segment_number = self._board.get_segment_number(angle, position_array)
        scoring_region = self._board.get_scoring_region(position_array)

        score_string, score_value = self._board.calculate_score(segment_number, scoring_region)

        return DartScore(score_string=score_string, score_value=score_value)

    def __adjust_center_position(self, position: np.ndarray) -> np.ndarray:
        """Adjust positions that are exactly at center to avoid division by zero."""
        adjusted = position.copy()
        if adjusted[0] == 0.5:
            adjusted[0] += 0.00001
        return adjusted

    def __calculate_angle(self, position: np.ndarray) -> float:
        """Calculate angle from center for dartboard segment determination."""
        angle_rad = np.arctan((position[1] - 0.5) / (position[0] - 0.5))
        angle_deg = np.rad2deg(angle_rad)
        return float(np.floor(angle_deg) if angle_deg > 0 else np.ceil(angle_deg))
