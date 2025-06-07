"""Contains the DetectionResultCode enum for error codes and messages."""

from enum import Enum


class ResultCode(Enum):
    """Enum containing error codes and their corresponding messages."""

    SUCCESS = (0, "Successful dart detection")
    YOLO_ERROR = (1, "Yolo model inference failed")
    HOMOGRAPHY = (2, "Homography matrix calculation failed")
    MISSING_CALIBRATION_POINTS = (3, "Not enough calibration points detected")
    INVALID_INPUT = (4, "Invalid input data provided")
    UNKNOWN = (100, "Unknown error")

    def __init__(self, code: int, message: str) -> None:
        self.code = code
        self.message = message
