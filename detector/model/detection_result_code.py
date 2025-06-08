"""Contains the DetectionResultCode enum for error codes and messages."""

from enum import Enum

from pydantic import field_validator, validator


class ResultCode(Enum):
    """Enum containing error codes and their corresponding messages."""

    SUCCESS = 0
    YOLO_ERROR = 1
    HOMOGRAPHY = 2
    MISSING_CALIBRATION_POINTS = 3
    INVALID_INPUT = 4
    UNKNOWN = 100

    @property
    def message(self) -> str:
        messages = {
            0: "Successful dart detection",
            1: "Yolo model inference failed",
            2: "Homography matrix calculation failed",
            3: "Not enough calibration points detected",
            4: "Invalid input data provided",
            100: "Unknown error",
        }
        return messages[self.value]
