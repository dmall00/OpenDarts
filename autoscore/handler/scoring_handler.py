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
from autoscore.model.models import (
    RequestType,
    WebsocketRequest,
    ScoringRequest,
    ResponseResult,
    Status,
)
from autoscore.util.file_util import base64_to_numpy

logger = logging.getLogger(__name__)


class ScoringHandler(BaseHandler):
    """Handles scoring requests."""

    def __init__(self, scoring_service: DartScoringService) -> None:
        self.scoring_service = scoring_service

    def get_request_type(self) -> RequestType:
        return RequestType.SCORING

    async def handle(
        self, websocket: ClientConnection, request: WebsocketRequest
    ) -> None:
        """Handle scoring requests."""
        try:
            logger.info(f"Received scoring request: {request.id}")
            scoring_request = ScoringRequest(**json.loads(request.data))
            scoring_result: ScoringResult = (
                self.scoring_service.calculate_scores_from_image(
                    calibration_result=scoring_request.calibration_result,
                    image=DartImage(raw_image=base64_to_numpy(scoring_request.image)),
                )
            )

            response = ResponseResult(
                request_type=RequestType.CALIBRATION,
                request_id=request.id,
                status=Status.SUCCESS,
                data=scoring_result,
            )
            await websocket.send(response.model_dump_json())
            logger.info(f"Scoring completed for request {request.id}")

        except Exception as e:
            logger.error(f"Scoring error: {e}")
            await self.send_error(websocket, f"Scoring failed: {str(e)}", request.id)
