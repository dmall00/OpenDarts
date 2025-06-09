import base64
from abc import ABC
from enum import Enum
from typing import Any, Optional, TypeVar

from detector.model.detection_models import ScoringResult, CalibrationResult, AbstractResult
from pydantic import BaseModel, ConfigDict, field_serializer

from autoscore.model.request import RequestType


class Status(Enum):
    SUCCESS = 0
    ERROR = 1

    @property
    def message(self) -> str:
        messages = {
            0: "Success",
            1: "Error",
        }
        return messages[self.value]



class BaseResponse(ABC, BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    request_type: RequestType
    request_id: str
    status: Status


class ErrorResponse(BaseResponse):
    message: str


class PingResponse(BaseResponse):
    message: str = "pong"

class CalibrationResponse(BaseResponse):
    calibration_result: CalibrationResult


class ScoringResponse(BaseResponse):
    scoring_result: ScoringResult


RES = TypeVar("RES", bound=BaseResponse)
