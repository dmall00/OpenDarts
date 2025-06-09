from websockets.asyncio.client import ClientConnection

from autoscore.handler.base_handler import BaseHandler
from autoscore.model.response import (
    Status,
    PingResponse,
)
from autoscore.model.request import RequestType, PingRequest
from websockets.asyncio.client import ClientConnection

from autoscore.handler.base_handler import BaseHandler
from autoscore.model.request import RequestType, PingRequest
from autoscore.model.response import (
    Status,
    PingResponse,
)


class PingHandler(BaseHandler[PingRequest, PingResponse]):
    """Handles ping requests for connection health checks."""

    def get_request_type(self) -> RequestType:
        return RequestType.PING

    async def handle(
        self, websocket: ClientConnection, request: PingRequest
    ) -> None:
        """Handle ping requests."""
        response = PingResponse(request_type=RequestType.PING,
                                request_id=request.id,
                                status=Status.SUCCESS)
        await self.send_response(websocket, response)
