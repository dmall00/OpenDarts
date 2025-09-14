"""Main module for starting the dart autoscore WebSocket server."""

import asyncio
import logging

import click
import websockets

from autoscore.config.settings import __load_settings
from autoscore.websocket.dart_websocket_server import DartWebSocketServer


def setup_logging(log_level: str) -> None:
    """Configure logging with the specified level."""
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )


async def async_main(host: str, port: int) -> None:
    """Start the WebSocket server."""
    settings = __load_settings()

    if host != "127.0.0.1":
        settings.host = host
    if port != 8765:  # noqa: PLR2004
        settings.port = port

    setup_logging(settings.log_level)
    logger = logging.getLogger("Main")

    server = DartWebSocketServer(settings)

    logger.info("Starting dart WebSocket server on %s:%s", settings.host, settings.port)
    logger.info("Configuration: Image saving=%s, Log level=%s", settings.save_images, settings.log_level)

    async with websockets.serve(
        server.register_connection, settings.host, settings.port, max_size=settings.max_message_size
    ) as websocket_server:
        logger.info("WebSocket server is running on ws://%s:%s", settings.host, settings.port)
        await websocket_server.serve_forever()


@click.command()
@click.option("--host", default="127.0.0.1", help="Host to bind the server to")
@click.option("--port", default=8765, type=int, help="Port to bind the server to")
def main(host: str, port: int) -> None:
    """Entry point for the autoscore-server script."""
    try:
        asyncio.run(async_main(host, port))
    except KeyboardInterrupt:
        logging.getLogger("Main").info("Server shutdown requested")
    except Exception:
        logging.getLogger("Main").exception("Server error")


if __name__ == "__main__":
    main()
