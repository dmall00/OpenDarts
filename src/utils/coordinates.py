import numpy as np


def calculate_distance(coord1, coord2):
    return np.sqrt(np.sum((coord1 - coord2) ** 2))
