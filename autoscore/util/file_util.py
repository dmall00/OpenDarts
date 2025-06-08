import base64
import numpy as np
from PIL import Image
from io import BytesIO


def base64_to_numpy(base64_data: bytes | bytearray | str) -> np.ndarray:
    """Convert base64 data to numpy array."""
    if isinstance(base64_data, str):
        image_bytes = base64.b64decode(base64_data)
    else:
        image_bytes = base64_data

    image_buffer = BytesIO(image_bytes)
    image = Image.open(image_buffer)

    if image.mode != "RGB":
        image = image.convert("RGB")

    numpy_array = np.array(image)
    return numpy_array