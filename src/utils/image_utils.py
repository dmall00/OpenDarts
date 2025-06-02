from typing import Tuple, Optional

import cv2
import numpy as np


def crop_image(image: np.ndarray, resolution: np.ndarray,
               crop_size: Optional[float] = None) -> Tuple[np.ndarray, np.ndarray, float]:
    """
    Crop an image to a square centered in the image.
    
    This function creates a square crop from the center of the image,
    which is useful for dart board detection as it ensures the board
    remains centered and maintains aspect ratio.
    
    Args:
        image: Input image to crop
        resolution: Image resolution as [width, height]
        crop_size: Size of the square crop. If None, uses minimum dimension
        
    Returns:
        Tuple containing:
        - cropped_image: The cropped square image
        - crop_start: Starting coordinates [x, y] of the crop
        - crop_size: Size of the square crop
    """
    if crop_size is None:
        crop_size = min(resolution)
    
    # Calculate crop starting position (centered)
    crop_start = resolution / 2 - crop_size / 2
    
    # Extract the square crop from the image
    cropped_image = image[
        int(crop_start[1]):int(crop_start[1] + crop_size),
        int(crop_start[0]):int(crop_start[0] + crop_size)
    ]
    
    return cropped_image, crop_start, crop_size


def resize_image(image, target_size=(800, 800)):
    """
    Skaliert das übergebene Bild auf die gewünschte Größe (standardmäßig 800x800).

    Args:
        image: Das Eingabebild (numpy-Array)
        target_size: Zielegewünschte Größe als Tupel (Breite, Höhe)

    Returns:
        Das skalierte Bild
    """
    return cv2.resize(image, target_size, interpolation=cv2.INTER_AREA)
