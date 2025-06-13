import base64
from io import BytesIO

import numpy as np
from PIL import Image


def base64_to_numpy(base64_data: bytes | bytearray | str) -> np.ndarray:
    """Convert base64 data to numpy array."""
    if isinstance(base64_data, str):
        image_bytes = base64.b64decode(base64_data)
    else:
        # If it's already bytes/bytearray, assume it's raw image data
        image_bytes = bytes(base64_data)  # Convert bytearray to bytes if needed

    image_buffer = BytesIO(image_bytes)
    image = Image.open(image_buffer)

    if image.mode != "RGB":
        image = image.convert("RGB")

    return np.array(image)
