import json
import logging
from typing import Any, Dict

from detector.model.detection_models import (
    CalibrationPoint,
    CalibrationResult,
    ScoringResult,
)
from detector.model.image_models import DartImage
from detector.service.scoring.dart_scoring_service import DartScoringService
from websockets.asyncio.client import ClientConnection

from autoscore.handler.base_handler import BaseHandler
from autoscore.model.response import (
    BaseResponse,
    Status,
    ScoringResponse,
)
from autoscore.model.request import BaseRequest, RequestType, ScoringRequest
from autoscore.util.file_util import base64_to_numpy

logger = logging.getLogger(__name__)


class ScoringHandler(BaseHandler[ScoringRequest, ScoringResponse]):
    """Handles scoring requests."""

    def __init__(self, scoring_service: DartScoringService) -> None:
        self.scoring_service = scoring_service

    def get_request_type(self) -> RequestType:
        return RequestType.SCORING

    async def handle(self, websocket: ClientConnection, scoring_request: ScoringRequest) -> None:
        """Handle scoring requests."""
        try:
            logger.info(f"Received scoring request: {scoring_request.id}")
            scoring_result: ScoringResult = self.scoring_service.calculate_scores_from_image(
                calibration_result=scoring_request.calibration_result,
                image=DartImage(raw_image=base64_to_numpy(scoring_request.image)),
            )

            response = ScoringResponse(
                request_type=RequestType.SCORING,
                id=scoring_request.id,
                status=Status.SUCCESS,
                scoring_result=scoring_result,
            )
            await self.send_response(websocket, response)
            logger.info(f"Scoring completed for request {scoring_request.id}")

        except Exception as e:
            logger.error(f"Scoring error: {e}")
            await self.send_error(websocket, f"Scoring failed: {str(e)}", scoring_request.id)
