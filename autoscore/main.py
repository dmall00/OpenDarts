import asyncio
import logging

import websockets

from autoscore.websocket.dart_websocket_server import DartWebSocketServer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("Main")


async def main() -> None:
    """Start the WebSocket server."""
    server = DartWebSocketServer()

    logger.info("Starting dart WebSocket server on localhost:8765")

    async with websockets.serve(
        server.register_connection, "localhost", 8765, max_size=20 * 1024 * 1024
    ) as websocket_server:
        logger.info("WebSocket server is running on ws://localhost:8765")
        await websocket_server.serve_forever()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
    except Exception:
        logger.exception("Server error")
