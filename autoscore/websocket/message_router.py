import json
import logging
from typing import TYPE_CHECKING, Any, Dict, Generic, Protocol, Type, TypeVar

import websockets.exceptions
from detector.model.configuration import ProcessingConfig
from detector.service.calibration.board_calibration_service import (
    DartBoardCalibrationService,
)
from detector.service.dart_image_scoring_service import DartInImageScoringService
from detector.service.image_preprocessor import ImagePreprocessor
from detector.service.scoring.dart_scoring_service import DartScoringService
from detector.yolo.dart_detector import YoloDartImageProcessor
from websockets.asyncio.server import ServerConnection

from autoscore.handler.calibration_handler import CalibrationHandler
from autoscore.handler.ping_handler import PingHandler
from autoscore.handler.pipeline_detection_handler import PipelineDetectionHandler
from autoscore.handler.scoring_handler import ScoringHandler
from autoscore.model.request import BaseRequest, CalibrationRequest, PingRequest, PipelineDetectionRequest, RequestType, ScoringRequest
from autoscore.model.response import (
    BaseResponse,
    ErrorResponse,
    Status,
)

if TYPE_CHECKING:
    from autoscore.handler.base_handler import BaseHandler


class MessageRouter:
    """Routes incoming WebSocket messages to appropriate handlers."""

    logger = logging.getLogger(__qualname__)

    def __init__(
        self,
    ) -> None:
        yolo_dart_image_processor = YoloDartImageProcessor(ProcessingConfig())
        image_preprocessor = ImagePreprocessor(ProcessingConfig())
        calibration_service = DartBoardCalibrationService(
            yolo_image_processor=yolo_dart_image_processor, image_preprocessor=image_preprocessor
        )
        scoring_service = DartScoringService(yolo_image_processor=yolo_dart_image_processor, image_preprocessor=image_preprocessor)
        self.calibration_handler = CalibrationHandler(calibration_service=calibration_service)
        self.scoring_handler = ScoringHandler(scoring_service=scoring_service)
        self.ping_handler = PingHandler()
        self.detection_handler = PipelineDetectionHandler(
            DartInImageScoringService(
                yolo_image_processor=yolo_dart_image_processor,
                calibration_service=calibration_service,
                dart_scoring_service=scoring_service,
            )
        )

        self.handlers: Dict[RequestType, BaseHandler] = {
            RequestType.CALIBRATION: self.calibration_handler,
            RequestType.SCORING: self.scoring_handler,
            RequestType.PING: self.ping_handler,
            RequestType.FULL: self.detection_handler
        }

        self.request_types: Dict[RequestType, Type[BaseRequest]] = {
            RequestType.CALIBRATION: CalibrationRequest,
            RequestType.SCORING: ScoringRequest,
            RequestType.PING: PingRequest,
            RequestType.FULL: PipelineDetectionRequest,
        }

    def _deserialize_request(self, data: Dict[str, Any]) -> BaseRequest:
        """Dynamically deserialize request based on request_type."""
        request_type_str = data.get("request_type")
        if not request_type_str:
            msg = "Missing request_type in message"
            raise ValueError(msg)

        try:
            request_type = RequestType(request_type_str)
        except ValueError:
            msg = f"Unknown request_type: {request_type_str}"
            raise ValueError(msg)

        request_class = self.request_types.get(request_type)
        if request_class is None:
            msg = f"No request class registered for request_type: {request_type}"
            raise ValueError(msg)

        return request_class(**data)

    async def handle_messages(self, websocket: ServerConnection) -> None:
        """Handle incoming messages from a WebSocket connection."""
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    self.logger.debug(f"Received message: {data}")
                    request = self._deserialize_request(data)
                    await self._process_message(websocket, request)
                except json.JSONDecodeError:
                    await self._send_error(websocket, "Invalid JSON format", None)
                except ValueError as e:
                    request_id = data.get("id") if isinstance(data, dict) else None
                    await self._send_error(websocket, str(e), request_id)
                except Exception as e:
                    self.logger.exception(f"Error processing message: {e}")
                    request_id = data.get("id") if isinstance(data, dict) else None
                    await self._send_error(websocket, f"Server error: {e!s}", request_id)
        except websockets.exceptions.ConnectionClosed:
            self.logger.info("Connection closed by client")

    async def _process_message(self, websocket: ServerConnection, request: BaseRequest) -> None:
        """Process a parsed message and route it to the appropriate handler."""
        message_type = request.request_type
        request_id = request.id

        if not message_type:
            await self._send_error(websocket, "Missing message type", request_id)
            return

        handler = self.handlers.get(message_type)
        if not handler:
            await self._send_error(websocket, f"Unknown message type: {message_type}", request_id)
            return

        await handler.handle(websocket, request)

    async def _send_error(
        self,
        websocket: ServerConnection,
        error_message: str,
        request_id: str | None,
    ) -> None:
        try:
            response = ErrorResponse(
                request_type=RequestType.NONE,
                id=request_id or "unknown",
                status=Status.ERROR,
                message=error_message,
            )
            await websocket.send(response.model_dump_json())
        except Exception as e:
            self.logger.exception(f"Failed to send error response: {e}")
