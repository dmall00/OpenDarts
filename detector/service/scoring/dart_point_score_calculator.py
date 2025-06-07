"""Service for scoring darts based on their positions."""

import logging
from typing import List, Tuple

import numpy as np

from detector.geometry.board import DartBoard
from detector.model.detection_models import DartPosition, DartScore, TransformedDartPosition
from detector.model.geometry_models import (
    ANGLE_CALCULATION_EPSILON,
    BOARD_CENTER_COORDINATE,
    DOUBLE_BULL_SCORE,
    MISS_SCORE,
    SINGLE_BULL_SCORE,
)


class DartPointScoreCalculator:
    """Domain service for calculating dart scores."""

    logger = logging.getLogger(__name__)

    def __init__(self) -> None:
        self._board = DartBoard()

    def calculate_scores(self, dart_positions: List[TransformedDartPosition]) -> List[DartScore]:
        """Calculate scores for all darts."""
        self.logger.debug("Calculating scores for %s darts", len(dart_positions))

        dart_score_result = []

        for position in dart_positions:
            score = self.__calculate_single_dart_score(position)  # type: ignore
            dart_score_result.append(score)
        return dart_score_result

    def __calculate_single_dart_score(self, position: DartPosition) -> DartScore:
        """Calculate score for a single dart."""
        position_array = self.__adjust_center_position(position.to_array())
        angle = self.__calculate_angle(position_array)

        segment_number = self._board.get_segment_number(angle, position_array)
        scoring_region = self._board.get_scoring_region(position_array)

        score_string, score_value = self.__calculate_score(segment_number, scoring_region)

        return DartScore(score_string=score_string, score_value=score_value)

    @staticmethod
    def __calculate_score(segment_number: int, scoring_region: str) -> Tuple[str, int]:
        """Calculate the final score for a dart."""
        scoring_rules = {
            "DB": ("DB", DOUBLE_BULL_SCORE),
            "SB": ("SB", SINGLE_BULL_SCORE),
            "S": (f"S{segment_number}", segment_number),
            "T": (f"T{segment_number}", segment_number * 3),
            "D": (f"D{segment_number}", segment_number * 2),
            "miss": ("miss", MISS_SCORE),
        }
        return scoring_rules[scoring_region]

    @staticmethod
    def __adjust_center_position(position: np.ndarray) -> np.ndarray:
        """Adjust positions that are exactly at center to avoid division by zero."""
        adjusted = position.copy()
        if adjusted[0] == BOARD_CENTER_COORDINATE:
            adjusted[0] += ANGLE_CALCULATION_EPSILON
        return adjusted

    @staticmethod
    def __calculate_angle(position: np.ndarray) -> float:
        """Calculate angle from center for dartboard segment determination."""
        angle_rad = np.arctan((position[1] - BOARD_CENTER_COORDINATE) / (position[0] - BOARD_CENTER_COORDINATE))
        angle_deg = np.rad2deg(angle_rad)
        return float(np.floor(angle_deg) if angle_deg > 0 else np.ceil(angle_deg))
