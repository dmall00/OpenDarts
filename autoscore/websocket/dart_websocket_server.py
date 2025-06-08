import logging
from typing import Set

from websockets.asyncio.client import ClientConnection

from autoscore.websocket.connection_manager import ConnectionManager
from detector.service.calibration.board_calibration_service import (
    DartBoardCalibrationService,
)
from detector.service.scoring.dart_scoring_service import DartScoringService

from autoscore.websocket.message_router import MessageRouter


class DartWebSocketServer:
    """Main WebSocket server for dart calibration and scoring operations."""

    logger = logging.getLogger(__qualname__)

    def __init__(self) -> None:
        self.connections: Set[ClientConnection] = set()
        self.connection_manager = ConnectionManager(self.connections)
        self.message_router = MessageRouter(
            DartBoardCalibrationService(), DartScoringService()
        )

    async def register_connection(self, websocket: ClientConnection) -> None:
        """Register and handle a new WebSocket connection."""
        await self.connection_manager.add_connection(websocket)

        try:
            await self.message_router.handle_messages(websocket)
        except Exception:
            self.logger.exception("Error handling connection")
        finally:
            await self.connection_manager.remove_connection(websocket)
