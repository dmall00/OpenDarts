"""Integration tests for the WebSocket server."""

import asyncio
import base64
import json
import logging
from pathlib import Path
from typing import AsyncGenerator

import pytest
import websockets
from websockets import Server

from autoscore.model.request import CalibrationRequest, PingRequest, PipelineDetectionRequest, RequestType, ScoringRequest
from autoscore.model.response import CalibrationResponse, PingResponse, PipelineDetectionResponse, ScoringResponse, Status

logger = logging.getLogger("ServerTestIT")

# Test constants
EXPECTED_TOTAL_SCORE = 100


def send_image_base64(file_path: str | Path) -> str:
    """Send image as base64 over WebSocket."""
    with Path(file_path).open("rb") as f:
        image_bytes = f.read()

    return base64.b64encode(image_bytes).decode("utf-8")


@pytest.fixture
async def websocket_server() -> AsyncGenerator[Server, None]:
    """Start the WebSocket server as a background task."""
    from autoscore.websocket.dart_websocket_server import DartWebSocketServer

    server = DartWebSocketServer()

    websocket_server = await websockets.serve(server.register_connection, "localhost", 8765, max_size=20 * 1024 * 1024)
    await asyncio.sleep(0.1)

    yield websocket_server
    websocket_server.close()
    await websocket_server.wait_closed()




@pytest.mark.asyncio
@pytest.mark.usefixtures("websocket_server")
async def test_full_pipeline() -> None:
    logger.info("Starting WebSocket integration test")
    uri = "ws://localhost:8765"
    async with websockets.connect(uri) as websocket:
        # Test calibration
        image = send_image_base64(Path(__file__).parent / "img.png")
        full_request = PipelineDetectionRequest(session_id="test", image=image, request_type=RequestType.FULL)
        await websocket.send(full_request.model_dump_json())

        response = await websocket.recv()
        detection_response = PipelineDetectionResponse(**json.loads(response))
        scoring_result = detection_response.detection_result.scoring_result
        assert scoring_result is not None, "scoring_result is None"
        assert scoring_result.dart_detections
        assert len(scoring_result.dart_detections) > 0
        assert all(dart.dart_score.single_value > 0 for dart in scoring_result.dart_detections)
        assert all(dart.confidence > 0 for dart in scoring_result.dart_detections)
        assert scoring_result.total_score == EXPECTED_TOTAL_SCORE


if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
