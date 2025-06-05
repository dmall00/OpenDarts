"""Contains the DetectionResultCode enum for error codes and messages."""

from enum import Enum


class DetectionResultCode(Enum):
    """Enum containing error codes and their corresponding messages."""

    SUCCESS = (0, "Successful dart detection")
    YOLO_ERROR = (1, "Yolo model inference failed")
    HOMOGRAPHY = (2, "Homography matrix calculation failed")
    MISSING_CALIBRATION_POINTS = (3, "Not enough calibration points detected")
    NO_DARTS = (4, "No darts detected")
    UNKNOWN = (100, "Unknown error")

    def __init__(self, code: int, message: str) -> None:
        self.code = code
        self.message = message
