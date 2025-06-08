import base64
from enum import Enum
from typing import Any, Optional

from detector.model.detection_models import CalibrationResult
from pydantic import BaseModel, ConfigDict, field_serializer


class RequestType(Enum):
    CALIBRATION = "calibration"
    SCORING = "scoring"
    PING = "ping"
    NONE = "none"

class ScoringRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    image: bytearray | str
    calibration_result: CalibrationResult

    @field_serializer("image")
    def serialize_data(self, value):
        if isinstance(value, (bytes, bytearray)):
            return base64.b64encode(value).decode("utf-8")
        return value


class WebsocketRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    request_type: RequestType
    id: str
    data: Optional[Any] = None

    @field_serializer("data")
    def serialize_data(self, value):
        if isinstance(value, (bytes, bytearray)):
            return base64.b64encode(value).decode("utf-8")
        return value

class Status(Enum):
    SUCCESS = "success"
    ERROR = "error"

class ErrorResponse(BaseModel):
    message: str

class PingResponse(BaseModel):
    message: str = "pong"

class ResponseResult(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    request_type: RequestType
    request_id: str
    status: Status
    data: Optional[Any] = None

    @field_serializer("data")
    def serialize_data(self, value):
        if isinstance(value, (bytes, bytearray)):
            return base64.b64encode(value).decode("utf-8")
        return value
