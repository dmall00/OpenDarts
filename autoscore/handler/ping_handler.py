import json
from typing import Any, Dict

from websockets.asyncio.client import ClientConnection

from autoscore.handler.base_handler import BaseHandler
from autoscore.model.models import (
    RequestType,
    ResponseResult,
    Status,
    PingResponse,
    WebsocketRequest,
)


class PingHandler(BaseHandler):
    """Handles ping requests for connection health checks."""

    def get_request_type(self) -> RequestType:
        return RequestType.PING

    async def handle(
        self, websocket: ClientConnection, request: WebsocketRequest
    ) -> None:
        """Handle ping requests."""
        response = ResponseResult(request_type=RequestType.PING,
                                  request_id=request.id,
                                  status=Status.SUCCESS,
                                  data=PingResponse())
        await websocket.send(response.model_dump_json())
