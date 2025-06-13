"""WebSocket server for handling dart autoscore operations."""

import logging
from typing import Set

from websockets.asyncio.server import ServerConnection

from autoscore.websocket.connection_manager import ConnectionManager
from autoscore.websocket.message_router import MessageRouter


class DartWebSocketServer:
    """Main WebSocket server for dart calibration and scoring operations."""

    logger = logging.getLogger(__qualname__)

    def __init__(self) -> None:
        self.connections: Set[ServerConnection] = set()
        self.connection_manager = ConnectionManager(self.connections)
        self.message_router = MessageRouter()

    async def register_connection(self, websocket: ServerConnection) -> None:
        """Register and handle a new WebSocket connection."""
        await self.connection_manager.add_connection(websocket)

        try:
            await self.message_router.handle_messages(websocket)
        except Exception:
            self.logger.exception("Error handling connection")
        finally:
            await self.connection_manager.remove_connection(websocket)
