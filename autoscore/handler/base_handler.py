"""Base handler for message processing."""

from abc import ABC, abstractmethod
from typing import Generic

from websockets.asyncio.server import ServerConnection

from autoscore.model.request import REQ, RequestType
from autoscore.model.response import (
    RES,
    ErrorResponse,
    Status,
)


class BaseHandler(Generic[REQ, RES], ABC):
    """Base class for message handlers."""

    @abstractmethod
    def get_request_type(self) -> RequestType:
        """Return the type of request this handler processes."""
        msg = "Get request type method must be implemented by subclasses."
        raise NotImplementedError(msg)

    @abstractmethod
    async def handle(self, websocket: ServerConnection, request: REQ) -> None:
        """Handle a specific message type."""
        msg = "Handle method must be implemented by subclasses."
        raise NotImplementedError(msg)

    async def send_response(self, websocket: ServerConnection, response: RES) -> None:
        """Send a response to the websocket."""
        await websocket.send(response.model_dump_json())

    async def send_error(
        self,
        websocket: ServerConnection,
        error_message: str,
        request_id: str,
    ) -> None:
        """Send an error response to the websocket."""
        response = ErrorResponse(request_type=self.get_request_type(), session_id=request_id, status=Status.ERROR, message=error_message,
                                 )
        await websocket.send(response.model_dump_json())
