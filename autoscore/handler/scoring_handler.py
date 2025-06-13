"""Scoring handler for processing dart scoring requests."""

import logging
from typing import TYPE_CHECKING

from detector.model.image_models import DartImage
from detector.service.scoring.dart_scoring_service import DartScoringService
from websockets.asyncio.server import ServerConnection

from autoscore.handler.base_handler import BaseHandler
from autoscore.model.request import RequestType, ScoringRequest
from autoscore.model.response import (
    ScoringResponse,
    Status,
)
from autoscore.util.file_util import base64_to_numpy

if TYPE_CHECKING:
    from detector.model.detection_models import (
        ScoringResult,
    )

logger = logging.getLogger(__name__)


class ScoringHandler(BaseHandler[ScoringRequest, ScoringResponse]):
    """Handles scoring requests."""

    def __init__(self, scoring_service: DartScoringService) -> None:
        self.scoring_service = scoring_service

    def get_request_type(self) -> RequestType:
        """Return the request type handled by this handler."""
        return RequestType.SCORING

    async def handle(self, websocket: ServerConnection, scoring_request: ScoringRequest) -> None:
        """Handle scoring requests."""
        try:
            logger.info("Received scoring request: %s", scoring_request.id)
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
            logger.info("Scoring completed for request %s", scoring_request.id)

        except Exception as e:
            logger.exception("Scoring error")
            await self.send_error(websocket, f"Scoring failed: {e!s}", scoring_request.id)
