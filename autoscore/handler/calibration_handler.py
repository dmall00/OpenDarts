import logging

from detector.model.configuration import ProcessingConfig
from detector.model.image_models import DartImage
from detector.service.calibration.board_calibration_service import (
    DartBoardCalibrationService,
)
from detector.service.image_preprocessor import ImagePreprocessor
from websockets.asyncio.client import ClientConnection

from autoscore.handler.base_handler import BaseHandler
from autoscore.model.models import (
    ResponseResult,
    RequestType,
    Status,
    WebsocketRequest,
)
from autoscore.util.file_util import base64_to_numpy

logger = logging.getLogger(__name__)


class CalibrationHandler(BaseHandler):
    """Handles calibration requests."""

    def __init__(self, calibration_service: DartBoardCalibrationService) -> None:
        self.calibration_service = calibration_service
        self.__preprocessor = ImagePreprocessor(ProcessingConfig())

    def get_request_type(self) -> RequestType:
        return RequestType.CALIBRATION

    async def handle(
        self, websocket: ClientConnection, request: WebsocketRequest
    ) -> None:
        """Handle calibration requests."""
        request_id = request.id
        try:
            logger.info(f"Received calibration request with ID: {request_id}")
            image = base64_to_numpy(request.data)
            preprocessing_result = self.__preprocessor.preprocess_image(
                DartImage(raw_image=image)
            )
            calibration_result = self.calibration_service.calibrate_board_from_image(
                image=preprocessing_result.dart_image
            )

            response = ResponseResult(
                request_type=RequestType.CALIBRATION,
                request_id=request_id,
                status=Status.SUCCESS,
                data=calibration_result,
            )
            await websocket.send(response.model_dump_json())
            logger.info(f"Calibration completed for request {request_id}")

        except Exception as e:
            logger.error(f"Calibration error: {e}")
            await self.send_error(
                websocket, f"Calibration failed: {str(e)}", request_id
            )
