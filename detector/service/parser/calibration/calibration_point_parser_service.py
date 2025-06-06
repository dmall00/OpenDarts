"""Service for parsing calibration points from YOLO detections."""

import logging
from typing import Dict, List

from typing_extensions import override

from detector.model.configuration import ProcessingConfig
from detector.model.detection_models import CalibrationPoint, YoloDetection
from detector.model.yolo_dart_class_mapping import YoloDartClassMapping
from detector.service.parser.abstract_parser import AbstractYoloParser
from detector.service.parser.calibration.strategy.calibration_point_strategy_factory import CalibrationStrategyFactory

logger = logging.getLogger(__name__)


class CalibrationPointParserService(AbstractYoloParser):
    """Service for parsing calibration points from YOLO detections."""

    def __init__(self, config: ProcessingConfig) -> None:
        super().__init__(config)
        self._strategy = CalibrationStrategyFactory.create_strategy(config.calibration_detection_mode)

    @override
    def _get_threshold(self) -> float:
        return self._config.calibration_confidence_threshold

    @override
    def _is_correct_class(self, detection: YoloDetection) -> bool:
        return not detection.is_dart

    @override
    def parse(self, detections: List[YoloDetection]) -> List[CalibrationPoint]:
        """Create calibration points from calibration detections, handling duplicates and missing points."""
        calibration_detections = super()._filter_detections(detections)
        detections_by_index = self.__group_calibration_detections(calibration_detections)

        calibration_points = []

        for calib_index in range(6):
            if calib_index not in detections_by_index:
                calibration_points.append(self.__create_invalid_calibration_point(calib_index, "missing"))
                continue

            detections = detections_by_index[calib_index]
            selected_detection = self._strategy.select_calibration_point(calib_index, detections, self._config)

            if selected_detection is None:
                calibration_points.append(self.__create_invalid_calibration_point(calib_index, "duplicate"))
            else:
                calibration_points.append(self.__create_calibration_point_from_detection(selected_detection))

        return calibration_points

    @staticmethod
    def __create_invalid_calibration_point(calib_index: int, reason: str) -> CalibrationPoint:
        """Create an invalid calibration point placeholder."""
        return CalibrationPoint(
            x=-1.0,
            y=-1.0,
            confidence=0.0,
            point_type=f"{reason}_{calib_index}",
        )

    @staticmethod
    def __create_calibration_point_from_detection(detection: YoloDetection) -> CalibrationPoint:
        """Create a calibration point from a YOLO detection."""
        point_type = YoloDartClassMapping.get_class_name(detection.class_id)

        calibration_point = CalibrationPoint(
            x=detection.center_x,
            y=detection.center_y,
            confidence=detection.confidence,
            point_type=point_type,
        )

        logger.debug("Created calibration point %s with confidence %s", point_type, f"{detection.confidence:.2f}")
        return calibration_point

    @staticmethod
    def __group_calibration_detections(calibration_detections: List[YoloDetection]) -> Dict[int, List[YoloDetection]]:
        """Group calibration detections by their calibration index."""
        detections_by_index: Dict[int, List[YoloDetection]] = {}

        for detection in calibration_detections:
            calib_index = detection.class_id if detection.class_id < YoloDartClassMapping.dart_class else detection.class_id - 1

            if calib_index not in detections_by_index:
                detections_by_index[calib_index] = []
            detections_by_index[calib_index].append(detection)

        return detections_by_index
