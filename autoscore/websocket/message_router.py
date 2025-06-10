import json
import logging
from typing import Any, Dict, Generic, Protocol, Type, TypeVar

import websockets.exceptions
from detector.service.calibration.board_calibration_service import (
    DartBoardCalibrationService,
)
from detector.service.scoring.dart_scoring_service import DartScoringService
from websockets.asyncio.client import ClientConnection

from autoscore.handler.base_handler import BaseHandler
from autoscore.handler.calibration_handler import CalibrationHandler
from autoscore.handler.ping_handler import PingHandler
from autoscore.handler.scoring_handler import ScoringHandler
from autoscore.model.request import BaseRequest, CalibrationRequest, PingRequest, RequestType, ScoringRequest
from autoscore.model.response import (
    BaseResponse,
    ErrorResponse,
    Status,
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

        self.handlers: Dict[RequestType, BaseHandler] = {
            RequestType.CALIBRATION: self.calibration_handler,
            RequestType.SCORING: self.scoring_handler,
            RequestType.PING: self.ping_handler,
        }

        self.request_types: Dict[RequestType, Type[BaseRequest]] = {
            RequestType.CALIBRATION: CalibrationRequest,
            RequestType.SCORING: ScoringRequest,
            RequestType.PING: PingRequest,
        }

    def _deserialize_request(self, data: Dict[str, Any]) -> BaseRequest:
        """Dynamically deserialize request based on request_type."""
        request_type_str = data.get("request_type")
        if not request_type_str:
            raise ValueError("Missing request_type in message")

        try:
            request_type = RequestType(request_type_str)
        except ValueError:
            raise ValueError(f"Unknown request_type: {request_type_str}")

        request_class = self.request_types.get(request_type)
        if request_class is None:
            raise ValueError(f"No request class registered for request_type: {request_type}")

        return request_class(**data)

    async def handle_messages(self, websocket: ClientConnection) -> None:
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
                    self.logger.error(f"Error processing message: {e}")
                    request_id = data.get("id") if isinstance(data, dict) else None
                    await self._send_error(websocket, f"Server error: {str(e)}", request_id)
        except websockets.exceptions.ConnectionClosed:
            self.logger.info("Connection closed by client")

    async def _process_message(self, websocket: ClientConnection, request: BaseRequest) -> None:
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
        websocket: ClientConnection,
        error_message: str,
        request_id: str | None,
    ) -> None:
        try:
            response = ErrorResponse(
                request_type=RequestType.NONE,
                request_id=request_id or "unknown",
                status=Status.ERROR,
                message=error_message,
            )
            await websocket.send(response.model_dump_json())
        except Exception as e:
            self.logger.error(f"Failed to send error response: {e}")
