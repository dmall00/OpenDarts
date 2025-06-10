import logging

from detector.model.configuration import ProcessingConfig
from detector.model.image_models import DartImage
from detector.service.calibration.board_calibration_service import (
    DartBoardCalibrationService,
)
from detector.service.image_preprocessor import ImagePreprocessor
from websockets.asyncio.client import ClientConnection

from autoscore.handler.base_handler import BaseHandler
from autoscore.model.response import (
    BaseResponse,
    Status,
    CalibrationResponse,
)
from autoscore.model.request import BaseRequest, RequestType, CalibrationRequest
from autoscore.util.file_util import base64_to_numpy

logger = logging.getLogger(__name__)


class CalibrationHandler(BaseHandler[CalibrationRequest, CalibrationResponse]):
    """Handles calibration requests."""

    def __init__(self, calibration_service: DartBoardCalibrationService) -> None:
        self.calibration_service = calibration_service
        self.__preprocessor = ImagePreprocessor(ProcessingConfig())

    def get_request_type(self) -> RequestType:
        return RequestType.CALIBRATION

    async def handle(
        self, websocket: ClientConnection, calibration_request: CalibrationRequest
    ) -> None:
        """Handle calibration requests."""
        request_id = calibration_request.id
        try:
            logger.info(f"Received calibration request with ID: {request_id}")

            calibration_result = self.calibration_service.calibrate_board_from_image(
                image=DartImage(raw_image=base64_to_numpy(calibration_request.image))
            )
            response = CalibrationResponse(
                request_type=RequestType.CALIBRATION,
                id=request_id,
                status=Status.SUCCESS,
                calibration_result=calibration_result,
            )
            await self.send_response(websocket, response)
            logger.info(f"Calibration completed for request {request_id}")

        except Exception as e:
            logger.error(f"Calibration error: {e}")
            await self.send_error(
                websocket, f"Calibration failed: {str(e)}", request_id
            )
