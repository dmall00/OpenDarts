from abc import ABC, abstractmethod
from typing import Generic

from detector.model.detection_models import AbstractResult
from websockets.asyncio.client import ClientConnection

from autoscore.model.request import RequestType, REQ
from autoscore.model.response import (
    ErrorResponse,
    BaseResponse,
    Status,
    RES,
    PingResponse,
)


class BaseHandler(Generic[REQ, RES], ABC):
    """Base class for message handlers."""

    @abstractmethod
    def get_request_type(self) -> RequestType:
        """Return the type of request this handler processes."""
        msg = "Get request type method must be implemented by subclasses."
        raise NotImplementedError(msg)

    @abstractmethod
    async def handle(
        self, websocket: ClientConnection, request: REQ
    ) -> None:
        """Handle a specific message type."""
        msg = "Handle method must be implemented by subclasses."
        raise NotImplementedError(msg)

    async def send_response(self, websocket: ClientConnection, response: RES) -> None:
        await websocket.send(response.model_dump_json())

    async def send_error(
        self,
        websocket: ClientConnection,
        error_message: str,
        request_id: str | None,
    ) -> None:
        response = ErrorResponse(request_type=self.get_request_type(),
                                request_id=request_id,
                                status=Status.ERROR,
                                message=error_message)
        await websocket.send(response.model_dump_json())