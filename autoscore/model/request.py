import base64
from abc import ABC
from enum import Enum
from typing import TypeVar

from detector.model.detection_models import CalibrationResult
from detector.model.image_models import DartImage
from pydantic import BaseModel, ConfigDict, field_serializer


class RequestType(Enum):
    CALIBRATION = "calibration"
    SCORING = "scoring"
    PING = "ping"
    FULL = "full"
    NONE = "none"


class BaseRequest(ABC, BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    request_type: RequestType
    id: str


class PingRequest(BaseRequest):
    message: str = "ping"


class ScoringRequest(BaseRequest):
    image: str
    calibration_result: CalibrationResult


class CalibrationRequest(BaseRequest):
    image: str

class PipelineDetectionRequest(BaseRequest):
    image: str

REQ = TypeVar("REQ", bound=BaseRequest)
