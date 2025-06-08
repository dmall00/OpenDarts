import asyncio
import json
from pathlib import Path

import pytest
import websockets
from detector.model.detection_models import CalibrationResult, ScoringResult

from autoscore.model.models import RequestType, ResponseResult, ScoringRequest, WebsocketRequest


def load_file(file_path: str | Path) -> bytearray:
    with Path.open(file_path, "rb") as image:
        image_bytes = image.read()
        return bytearray(image_bytes)


@pytest.mark.asyncio
async def test_websocket_integration() -> None:
    uri = "ws://localhost:8765"

    async with websockets.connect(uri) as websocket:
        # Test ping
        await websocket.send(WebsocketRequest(request_type=RequestType.PING, id="test").model_dump_json())
        response = await websocket.recv()
        response_data = json.loads(response)
        assert response_data["status"] == "success"
        assert response_data["request_type"] == "ping"


        # Test calibration
        image = load_file(Path(__file__).parent / "img.png")
        await websocket.send(
            WebsocketRequest(
                request_type=RequestType.CALIBRATION,
                id="test",
                data=image,
            ).model_dump_json()
        )
        response = await websocket.recv()
        response_result = ResponseResult(**json.loads(response))
        assert response_result.status.value == "success"
        assert response_result.request_type == RequestType.CALIBRATION

        # Test scoring
        calibration_result = CalibrationResult(**response_result.data)
        scoring_request = ScoringRequest(image=image, calibration_result=calibration_result)
        await websocket.send(
            WebsocketRequest(
                request_type=RequestType.SCORING,
                id="test",
                data=scoring_request.model_dump_json()
            ).model_dump_json()
        )
        response = await websocket.recv()
        response_result = ResponseResult(**json.loads(response))
        assert response_result.status.value == "success"
        assert response_result.request_type == RequestType.CALIBRATION

        # Verify scoring results
        scoring_result = ScoringResult(**response_result.data)
        assert scoring_result.dart_detections
        assert len(scoring_result.dart_detections) > 0
        assert all(dart.dart_score.score_value > 0 for dart in scoring_result.dart_detections)
        assert all(dart.confidence > 0 for dart in scoring_result.dart_detections)


@pytest.mark.asyncio
async def test_integration() -> None:
    await test_websocket_integration()


if __name__ == "__main__":
    asyncio.run(test_websocket_integration())
