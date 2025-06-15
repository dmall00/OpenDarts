"""Request models for the autoscore application."""

from abc import ABC
from enum import Enum
from typing import TypeVar

from detector.model.detection_models import CalibrationResult
from pydantic import BaseModel, ConfigDict


class RequestType(Enum):
    """Enumeration of available request types."""

    CALIBRATION = "calibration"
    SCORING = "SCORING"
    PING = "PING"
    FULL = "FULL"
    NONE = "NONE"


class BaseRequest(ABC, BaseModel):
    """Base class for all request models."""

    model_config = ConfigDict(arbitrary_types_allowed=True)
    request_type: RequestType
    id: str


class PingRequest(BaseRequest):
    """Request model for ping operations."""

    message: str = "ping"


class ScoringRequest(BaseRequest):
    """Request model for scoring operations."""

    image: str
    calibration_result: CalibrationResult


class CalibrationRequest(BaseRequest):
    """Request model for calibration operations."""

    image: str


class PipelineDetectionRequest(BaseRequest):
    """Request model for pipeline detection operations."""

    image: str


REQ = TypeVar("REQ", bound=BaseRequest)
