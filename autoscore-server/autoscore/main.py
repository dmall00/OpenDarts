"""Main module for starting the dart autoscore WebSocket server."""

import asyncio
import logging

import websockets

from autoscore.websocket.dart_websocket_server import DartWebSocketServer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("Main")


async def async_main() -> None:
    """Start the WebSocket server."""
    server = DartWebSocketServer()

    logger.info("Starting dart WebSocket server on localhost:8765")

    async with websockets.serve(server.register_connection, "0.0.0.0", 8765, max_size=20 * 1024 * 1024) as websocket_server:  # noqa: S104
        logger.info("WebSocket server is running on ws://127.0.0.1:8765")
        await websocket_server.serve_forever()


def main() -> None:
    """Entry point for the autoscore-server script."""
    try:
        asyncio.run(async_main())
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
    except Exception:
        logger.exception("Server error")


if __name__ == "__main__":
    main()
