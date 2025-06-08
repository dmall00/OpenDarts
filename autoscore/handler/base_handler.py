from abc import ABC, abstractmethod

from websockets.asyncio.client import ClientConnection

from autoscore.model.models import (
    ErrorResponse,
    RequestType,
    ResponseResult,
    Status,
    WebsocketRequest,
)


class BaseHandler(ABC):
    """Base class for message handlers."""

    @abstractmethod
    def get_request_type(self) -> RequestType:
        """Return the type of request this handler processes."""
        raise NotImplementedError("Subclasses must implement this method.")

    @abstractmethod
    async def handle(
        self, websocket: ClientConnection, request: WebsocketRequest
    ) -> None:
        """Handle a specific message type."""
        pass

    async def send_error(
        self,
        websocket: ClientConnection,
        error_message: str,
        request_id: str | None,
    ) -> None:
        response = ResponseResult(request_type=self.get_request_type(),
                                  request_id=request_id,
                                  status=Status.ERROR,
                                  data=ErrorResponse(
                                      message=error_message
                                  ))
        await websocket.send(response.model_dump_json())