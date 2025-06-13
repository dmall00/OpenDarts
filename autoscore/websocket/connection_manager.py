import logging
from typing import Set

from websockets.asyncio.client import ClientConnection


class ConnectionManager:
    """Manages WebSocket connections lifecycle."""

    logger = logging.getLogger(__qualname__)

    def __init__(self, connections: Set[ClientConnection]) -> None:
        self.connections = connections

    async def add_connection(self, websocket: ClientConnection) -> None:
        """Add a new WebSocket connection."""
        self.connections.add(websocket)
        self.logger.info(
            f"New connection registered. Total connections: {len(self.connections)}"
        )

    async def remove_connection(self, websocket: ClientConnection) -> None:
        """Remove a WebSocket connection."""
        self.connections.discard(websocket)
        self.logger.info(f"Connection removed. Total connections: {len(self.connections)}")
