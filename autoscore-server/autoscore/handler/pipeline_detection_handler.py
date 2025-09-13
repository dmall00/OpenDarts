"""Pipeline detection handler for processing dart detection and scoring requests."""

import logging

from detector.model.detection_models import ResultCode
from detector.model.image_models import DartImage
from detector.service.dart_image_scoring_service import DartInImageScoringService
from websockets.asyncio.server import ServerConnection

from autoscore.handler.base_handler import BaseHandler
from autoscore.model.request import PipelineDetectionRequest, RequestType
from autoscore.model.response import PipelineDetectionResponse, Status
from autoscore.util.file_util import base64_to_numpy, save_base64_as_png


class PipelineDetectionHandler(BaseHandler[PipelineDetectionRequest, PipelineDetectionResponse]):
    """Handles pipeline detection requests."""

    logger = logging.getLogger(__qualname__)

    def __init__(self, dart_detection_service: DartInImageScoringService) -> None:
        self.__dart_detection_service = dart_detection_service

    def get_request_type(self) -> RequestType:
        """Return the request type handled by this handler."""
        return RequestType.FULL

    async def handle(self, websocket: ServerConnection, request: PipelineDetectionRequest) -> None:
        """Handle pipeline detection requests."""
        try:
            detection_result = self.__dart_detection_service.detect_and_score(
                image=DartImage(raw_image=base64_to_numpy(request.image)))
            #save_base64_as_png(request.image)

            await self.send_response(
                websocket,
                PipelineDetectionResponse(
                    request_type=RequestType.FULL,
                    session_id=request.session_id,
                    status=Status.SUCCESS,
                    detection_result=detection_result,
                    player_id=request.player_id,
                ),
            )

        except Exception as e:
            self.logger.exception("Pipeline detection error")
            await self.send_error(websocket, f"Pipeline detection failed: {e!s}", request.session_id)
