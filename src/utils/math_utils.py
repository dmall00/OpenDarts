from typing import Union

import numpy as np


def calculate_distance(coord1: Union[np.ndarray, list, tuple],
                       coord2: Union[np.ndarray, list, tuple]) -> float:
    """
    Calculate Euclidean distance between two 2D coordinates.

    Args:
        coord1: First coordinate [x, y]
        coord2: Second coordinate [x, y]

    Returns:
        Euclidean distance between the coordinates
    """
    coord1 = np.array(coord1)
    coord2 = np.array(coord2)
    return float(np.sqrt(np.sum((coord1 - coord2) ** 2)))