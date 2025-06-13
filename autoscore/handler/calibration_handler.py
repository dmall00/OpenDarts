"""Calibration handler for dart board calibration requests."""

import logging

from detector.model.configuration import ProcessingConfig
from detector.model.image_models import DartImage
from detector.service.calibration.board_calibration_service import (
    DartBoardCalibrationService,
)
from detector.service.image_preprocessor import ImagePreprocessor
from websockets.asyncio.server import ServerConnection

from autoscore.handler.base_handler import BaseHandler
from autoscore.model.request import CalibrationRequest, RequestType
from autoscore.model.response import (
    CalibrationResponse,
    Status,
)
from autoscore.util.file_util import base64_to_numpy

logger = logging.getLogger(__name__)


class CalibrationHandler(BaseHandler[CalibrationRequest, CalibrationResponse]):
    """Handles calibration requests."""

    def __init__(self, calibration_service: DartBoardCalibrationService) -> None:
        self.calibration_service = calibration_service
        self.__preprocessor = ImagePreprocessor(ProcessingConfig())

    def get_request_type(self) -> RequestType:
        """Return the request type this handler processes."""
        return RequestType.CALIBRATION

    async def handle(self, websocket: ServerConnection, calibration_request: CalibrationRequest) -> None:
        """Handle calibration requests."""
        request_id = calibration_request.id
        try:
            logger.info("Received calibration request with ID: %s", request_id)

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
            logger.info("Calibration completed for request %s", request_id)

        except Exception as e:
            logger.exception("Calibration error")
            await self.send_error(websocket, f"Calibration failed: {e!s}", request_id)
