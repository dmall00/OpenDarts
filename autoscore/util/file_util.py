"""File utility functions for handling file operations and conversions."""

import base64
from io import BytesIO

import numpy as np
from PIL import Image


def base64_to_numpy(base64_data: bytes | bytearray | str) -> np.ndarray:
    """Convert base64 data to numpy array."""
    image_bytes = base64.b64decode(base64_data) if isinstance(base64_data, str) else bytes(base64_data)

    image_buffer = BytesIO(image_bytes)
    pil_image = Image.open(image_buffer)

    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")  # type: ignore

    return np.array(pil_image)
