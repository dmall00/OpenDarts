import json
import logging
from typing import Any, Dict
import websockets.exceptions

from detector.service.calibration.board_calibration_service import (
    DartBoardCalibrationService,
)
from detector.service.scoring.dart_scoring_service import DartScoringService
from websockets.asyncio.client import ClientConnection

from autoscore.handler.calibration_handler import CalibrationHandler
from autoscore.handler.ping_handler import PingHandler
from autoscore.handler.scoring_handler import ScoringHandler
from autoscore.model.models import (
    RequestType,
    ResponseResult,
    Status,
    ErrorResponse,
    WebsocketRequest,
)


class MessageRouter:
    """Routes incoming WebSocket messages to appropriate handlers."""

    logger = logging.getLogger(__qualname__)

    def __init__(
        self,
        calibration_service: DartBoardCalibrationService,
        scoring_service: DartScoringService,
    ) -> None:
        self.calibration_handler = CalibrationHandler(calibration_service)
        self.scoring_handler = ScoringHandler(scoring_service)
        self.ping_handler = PingHandler()

        self.handlers = {
            RequestType.CALIBRATION: self.calibration_handler.handle,
            RequestType.SCORING: self.scoring_handler.handle,
            RequestType.PING: self.ping_handler.handle,
        }

    async def handle_messages(self, websocket: ClientConnection) -> None:
        """Handle incoming messages from a WebSocket connection."""
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    request = WebsocketRequest(**data)
                    await self._process_message(websocket, request)
                except json.JSONDecodeError:
                    await self._send_error(websocket, "Invalid JSON format", None)
                except Exception as e:
                    self.logger.error(f"Error processing message: {e}")
                    await self._send_error(websocket, f"Server error: {str(e)}", None)
        except websockets.exceptions.ConnectionClosed:
            self.logger.info("Connection closed by client")

    async def _process_message(
        self, websocket: ClientConnection, request: WebsocketRequest
    ) -> None:
        """Process a parsed message and route it to the appropriate handler."""
        message_type = request.request_type
        request_id = request.id

        if not message_type:
            await self._send_error(websocket, "Missing message type", request_id)
            return

        handler = self.handlers.get(message_type)
        if not handler:
            await self._send_error(
                websocket, f"Unknown message type: {message_type}", request_id
            )
            return

        await handler(websocket, request)

    async def _send_error(
        self,
        websocket: ClientConnection,
        error_message: str,
        request_id: str | None,
    ) -> None:
        try:
            response = ResponseResult(
                request_type=RequestType.NONE,
                request_id=request_id,
                status=Status.ERROR,
                data=ErrorResponse(message=error_message),
            )
            await websocket.send(response.model_dump_json())
        except Exception as e:
            self.logger.error(f"Failed to send error response: {e}")
