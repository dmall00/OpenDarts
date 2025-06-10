import asyncio
import base64
import json
import logging
from pathlib import Path

import pytest
import websockets
from detector.model.detection_models import CalibrationResult, ScoringResult
from detector.model.image_models import DartImage

from autoscore.main import main
from autoscore.model.request import RequestType, ScoringRequest, CalibrationRequest, PingRequest, PipelineDetectionRequest
from autoscore.model.response import BaseResponse, Status, PingResponse, CalibrationResponse, ScoringResponse, PipelineDetectionResponse
from autoscore.util.file_util import base64_to_numpy

logger = logging.getLogger("ServerTestIT")
def send_image_base64(file_path: str | Path) -> str:
    """Send image as base64 over WebSocket."""
    with Path.open(file_path, "rb") as f:
        image_bytes = f.read()

    base64_string = base64.b64encode(image_bytes).decode("utf-8")
    return base64_string


@pytest.fixture
async def websocket_server():
    """Start the WebSocket server as a background task."""
    from autoscore.websocket.dart_websocket_server import DartWebSocketServer

    server = DartWebSocketServer()

    websocket_server = await websockets.serve(server.register_connection, "localhost", 8765, max_size=20 * 1024 * 1024)
    await asyncio.sleep(0.1)

    yield websocket_server
    websocket_server.close()
    await websocket_server.wait_closed()


@pytest.mark.asyncio
async def test_separate_pipeline(websocket_server) -> None:

    logger.info("Starting WebSocket integration test")
    uri = "ws://localhost:8765"
    async with websockets.connect(uri) as websocket:
        # Test ping
        ping_request = PingRequest(request_type=RequestType.PING, id="test")
        await websocket.send(ping_request.model_dump_json())
        response = await websocket.recv()
        response_data = PingResponse(**json.loads(response))
        logger.info(f"Received ping response: {response_data}")
        assert response_data.status == Status.SUCCESS
        assert response_data.request_type == RequestType.PING

        # Test calibration
        image = send_image_base64(Path(__file__).parent / "img.png")
        calibration_request = CalibrationRequest(
            request_type=RequestType.CALIBRATION,
            id="test",
            image=image
        )
        await websocket.send(calibration_request.model_dump_json())
        response = await websocket.recv()
        response_result = CalibrationResponse(**json.loads(response))
        logger.info(f"Received calibration response: {response_result}")
        assert response_result.status == Status.SUCCESS
        assert response_result.request_type == RequestType.CALIBRATION

        # Test scoring
        scoring_request = ScoringRequest(
            request_type=RequestType.SCORING,
            id="test",
            image=image,
            calibration_result=response_result.calibration_result
        )
        await websocket.send(scoring_request.model_dump_json())
        response = await websocket.recv()
        response_result = ScoringResponse(**json.loads(response))
        logger.info(f"Received scoring response: {response_result}")
        assert response_result.status == Status.SUCCESS
        assert response_result.request_type == RequestType.SCORING

        # Verify scoring results
        scoring_result = response_result.scoring_result
        assert scoring_result.dart_detections
        assert len(scoring_result.dart_detections) > 0
        assert all(dart.dart_score.score_value > 0 for dart in scoring_result.dart_detections)
        assert all(dart.confidence > 0 for dart in scoring_result.dart_detections)
        assert scoring_result.total_score == 100

@pytest.mark.asyncio
async def test_full_pipeline(websocket_server) -> None:
    logger.info("Starting WebSocket integration test")
    uri = "ws://localhost:8765"
    async with websockets.connect(uri) as websocket:
        # Test ping
        ping_request = PingRequest(request_type=RequestType.PING, id="test")
        await websocket.send(ping_request.model_dump_json())
        response = await websocket.recv()
        response_data = PingResponse(**json.loads(response))
        logger.info(f"Received ping response: {response_data}")
        assert response_data.status == Status.SUCCESS
        assert response_data.request_type == RequestType.PING

        # Test calibration
        image = send_image_base64(Path(__file__).parent / "img.png")
        full_request = PipelineDetectionRequest(id="test", image=image, request_type=RequestType.FULL)
        await websocket.send(full_request.model_dump_json())

        response = await websocket.recv()
        detection_response = PipelineDetectionResponse(**json.loads(response))
        scoring_result = detection_response.detection_result.scoring_result
        assert scoring_result.dart_detections
        assert len(scoring_result.dart_detections) > 0
        assert all(dart.dart_score.score_value > 0 for dart in scoring_result.dart_detections)
        assert all(dart.confidence > 0 for dart in scoring_result.dart_detections)
        assert scoring_result.total_score == 100  # noqa: PLR2004


if __name__ == "__main__":
    asyncio.run(test_separate_pipeline())
