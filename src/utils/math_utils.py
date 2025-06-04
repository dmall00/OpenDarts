"""Utility functions for mathematical operations."""

from typing import Union

import numpy as np


def calculate_distance(coord1: Union[np.ndarray, list, tuple], coord2: Union[np.ndarray, list, tuple]) -> float:
    """Calculate Euclidean distance between two 2D coordinates."""
    coord1 = np.array(coord1)
    coord2 = np.array(coord2)
    return float(np.sqrt(np.sum((coord1 - coord2) ** 2)))
