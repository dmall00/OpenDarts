"""Factory for creating calibration detection strategies."""

from detector.model.configuration import CalibrationPointDetectionMode
from detector.service.parser.calibration.strategy.calibration_detection_strategy import CalibrationDetectionStrategy
from detector.service.parser.calibration.strategy.strategy_implementation import (
    FilterDuplicatesStrategy,
    GeometricDetectionStrategy,
    HighestConfidenceStrategy,
)


class CalibrationStrategyFactory:
    """Factory for creating calibration detection strategies."""

    @staticmethod
    def create_strategy(mode: CalibrationPointDetectionMode) -> CalibrationDetectionStrategy:
        """Create a strategy based on the detection mode."""
        strategy_map = {
            CalibrationPointDetectionMode.HIGHEST_CONFIDENCE: HighestConfidenceStrategy(),
            CalibrationPointDetectionMode.GEOMETRIC: GeometricDetectionStrategy(),
            CalibrationPointDetectionMode.FILTER_DUPLICATES: FilterDuplicatesStrategy(),
        }

        if mode not in strategy_map:
            msg = f"Unknown calibration detection mode: {mode}"
            raise ValueError(msg)

        return strategy_map[mode]
