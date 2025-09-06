"""WebSocket connection manager for handling client connections."""

import logging
from typing import Set

from websockets.asyncio.server import ServerConnection


class ConnectionManager:
    """Manages WebSocket connections lifecycle."""

    logger = logging.getLogger(__qualname__)

    def __init__(self, connections: Set[ServerConnection]) -> None:
        self.connections = connections

    async def add_connection(self, websocket: ServerConnection) -> None:
        """Add a new WebSocket connection."""
        self.connections.add(websocket)
        self.logger.info("New connection registered. Total connections: %d", len(self.connections))

    async def remove_connection(self, websocket: ServerConnection) -> None:
        """Remove a WebSocket connection."""
        self.connections.discard(websocket)
        self.logger.info("Connection removed. Total connections: %d", len(self.connections))
