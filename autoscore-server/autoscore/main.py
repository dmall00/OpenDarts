"""Main module for starting the dart autoscore WebSocket server."""

import asyncio
import logging

import click
import websockets

from autoscore.websocket.dart_websocket_server import DartWebSocketServer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("Main")


async def async_main(host: str, port: int) -> None:
    """Start the WebSocket server."""
    server = DartWebSocketServer()

    logger.info(f"Starting dart WebSocket server on {host}:{port}")

    async with websockets.serve(server.register_connection, host, port, max_size=20 * 1024 * 1024) as websocket_server:
        logger.info(f"WebSocket server is running on ws://{host}:{port}")
        await websocket_server.serve_forever()


@click.command()
@click.option("--host", default="127.0.0.1", help="Host to bind the server to")
@click.option("--port", default=8765, type=int, help="Port to bind the server to")
def main(host: str, port: int) -> None:
    """Entry point for the autoscore-server script."""
    try:
        asyncio.run(async_main(host, port))
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
    except Exception:
        logger.exception("Server error")


if __name__ == "__main__":
    main()
