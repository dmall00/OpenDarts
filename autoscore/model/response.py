"""Response models for the autoscore application."""

from abc import ABC
from enum import Enum
from typing import Optional, TypeVar

from detector.model.detection_models import CalibrationResult, DetectionResult, ScoringResult
from pydantic import BaseModel, ConfigDict

from autoscore.model.request import RequestType


class Status(Enum):
    """Enumeration of response status values."""

    SUCCESS = 0
    ERROR = 1

    @property
    def message(self) -> str:
        """Get the message string for this status."""
        messages = {
            0: "Success",
            1: "Error",
        }
        return messages[self.value]


class BaseResponse(ABC, BaseModel):
    """Base class for all response models."""

    model_config = ConfigDict(arbitrary_types_allowed=True)
    request_type: RequestType
    session_id: str
    status: Status
    message: Optional[str] = None
    player_id: str | None = None

class ErrorResponse(BaseResponse):
    """Response model for error responses."""



class PingResponse(BaseResponse):
    """Response model for ping responses."""
    message: str = "pong"


class CalibrationResponse(BaseResponse):
    """Response model for calibration responses."""

    calibration_result: CalibrationResult


class ScoringResponse(BaseResponse):
    """Response model for scoring responses."""

    scoring_result: ScoringResult


class PipelineDetectionResponse(BaseResponse):
    """Response model for pipeline detection responses."""

    detection_result: DetectionResult


RES = TypeVar("RES", bound=BaseResponse)
