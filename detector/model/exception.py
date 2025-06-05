"""Contains exception classes for handling errors during dart detection."""

from typing import Optional

from detector.model.detection_result_code import DetectionResultCode


class DartDetectionError(Exception):
    """Exception raised when dart detection fails."""

    def __init__(self, error_code: DetectionResultCode, cause: Optional[BaseException] = None, details: Optional[str] = None) -> None:
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
