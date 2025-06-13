import logging

from detector.model.image_models import DartImage
from detector.service.dart_image_scoring_service import DartInImageScoringService
from websockets import ClientConnection

from autoscore.handler.base_handler import BaseHandler
from autoscore.model.request import PipelineDetectionRequest, RequestType
from autoscore.model.response import PipelineDetectionResponse, Status
from autoscore.util.file_util import base64_to_numpy


class PipelineDetectionHandler(BaseHandler[PipelineDetectionRequest, PipelineDetectionResponse]):
    """Handles pipeline detection requests."""

    logger = logging.getLogger(__name__)

    def __init__(self, dart_detection_service: DartInImageScoringService) -> None:
        self.__dart_detection_service = dart_detection_service

    def get_request_type(self) -> RequestType:
        return RequestType.FULL

    async def handle(self, websocket: ClientConnection, request: PipelineDetectionRequest) -> None:
        try:
            detection_result = self.__dart_detection_service.detect_and_score(image=DartImage(raw_image=base64_to_numpy(request.image)))

            await self.send_response(
                websocket,
                PipelineDetectionResponse(
                    request_type=RequestType.FULL, id=request.id, status=Status.SUCCESS, detection_result=detection_result
                ),
            )

        except Exception as e:
            self.logger.exception(f"Pipeline detection error: {e}")
            await self.send_error(websocket, f"Pipeline detection failed: {e!s}", request.id)


