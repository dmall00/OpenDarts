"""File utility functions for handling file operations and conversions."""

import base64
from datetime import datetime
from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def base64_to_numpy(base64_data: bytes | bytearray | str) -> np.ndarray:
    """Convert base64 data to numpy array in BGR format (OpenCV compatible)."""
    image_bytes = base64.b64decode(base64_data) if isinstance(base64_data, str) else bytes(base64_data)
    image_buffer = BytesIO(image_bytes)
    pil_image = Image.open(image_buffer)
    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")  # type: ignore
    rgb_array = np.array(pil_image)
    return cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)



def save_base64_as_png(base64_data: bytes | bytearray | str, output_dir: str = "saved_images") -> str:
    """Save base64 image data as a PNG file with timestamp."""
    # Create output directory if it doesn't exist
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%M-%S_%f")[:-3]  # noqa: DTZ005
    filename = f"image_{timestamp}.png"
    filepath = output_path / filename
    image_bytes = base64.b64decode(base64_data) if isinstance(base64_data, str) else bytes(base64_data)
    image_buffer = BytesIO(image_bytes)
    pil_image = Image.open(image_buffer)
    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")  # type: ignore

    pil_image.save(filepath, "PNG")
    return str(filepath)
