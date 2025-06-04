"""Exceptions and error codes for dart detection."""
from enum import Enum
from typing import Optional


class Code(Enum):
    """Enum containing error codes and their corresponding messages."""

    SUCCESS = (0, "Successful dart detection")
    YOLO_ERROR = (1, "Yolo model inference failed")
    HOMOGRAPHY = (2, "Homography matrix calculation failed")
    MISSING_CALIBRATION_POINTS = (3, "Not enough calibration points detected")
    UNKNOWN = (4, "Unknown error")

    def __init__(self, code: int, message: str) -> None:
        self.code = code
        self.message = message


class DartDetectionError(Exception):
    """Exception raised when dart detection fails."""

    def __init__(self, error_code: Code, cause: Optional[BaseException] = None, details: Optional[str] = None) -> None:
        self.error_code = error_code
        self.message = error_code.message
        self.details = details
        message = f"[Error {self.error_code.code}] {self.message}"
        if details:
            message += f": {details}"
        if cause:
            self.__cause__ = cause
        super().__init__(message)

    def __str__(self) -> str:
        if self.details:
            return f"[Error {self.error_code.code}] {self.message}: {self.details}"
        return f"[Error {self.error_code.code}] {self.message}"
