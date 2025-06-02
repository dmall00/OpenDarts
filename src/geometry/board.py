import logging

import numpy as np

logger = logging.getLogger(__name__)


class DartBoard:
    def __init__(self):
        logger.info("Initializing DartBoard")
        self._setup_geometry()
        self._setup_scoring()
        self._setup_segments()
        logger.info("DartBoard initialization complete")

    def _setup_geometry(self):
        self.ring_width = 10.0
        self.bullseye_wire_width = 1.6
        self.board_diameter = 451.0
        logger.debug(
            f"Board geometry - Ring width: {self.ring_width}mm, Bullseye wire: {self.bullseye_wire_width}mm, Diameter: {self.board_diameter}mm")

    def _setup_scoring(self):
        self.scoring_names = np.array(['DB', 'SB', 'S', 'T', 'S', 'D', 'miss'])
        self.scoring_radii = np.array([0, 6.35, 15.9, 107.4 - self.ring_width, 107.4, 170.0 - self.ring_width, 170.0])
        self.scoring_radii[1:3] += (self.bullseye_wire_width / 2)
        self.scoring_radii /= self.board_diameter
        logger.debug(f"Normalized scoring radii: {self.scoring_radii}")

    def _setup_segments(self):
        self.segment_angles = np.array([-9, 9, 27, 45, 63, -81, -63, -45, -27])
        self.segment_numbers = np.array(
            [[6, 11], [10, 14], [15, 9], [2, 12], [17, 5], [19, 1], [7, 18], [16, 4], [8, 13]])
        logger.debug(f"Segment angles: {self.segment_angles}")
        logger.debug(f"Segment number pairs: {self.segment_numbers}")

    def get_segment_number(self, angle, position):
        if abs(angle) >= 81:
            possible_numbers = np.array([3, 20])
        else:
            valid_angles = self.segment_angles[self.segment_angles <= angle]
            if len(valid_angles) == 0:
                segment_index = 0
            else:
                max_valid_angle = max(valid_angles)
                segment_index = np.where(self.segment_angles == max_valid_angle)[0][0]
            possible_numbers = self.segment_numbers[segment_index]

        coordinate_index = 0 if np.array_equal(possible_numbers, [6, 11]) else 1
        return possible_numbers[0] if position[coordinate_index] > 0.5 else possible_numbers[1]

    def get_scoring_region(self, position):
        distance_from_center = np.sqrt((position[0] - 0.5) ** 2 + (position[1] - 0.5) ** 2)
        region_index = np.argmax(self.scoring_radii[distance_from_center > self.scoring_radii])
        return self.scoring_names[region_index]

    def calculate_final_score(self, segment_number, scoring_region):
        scoring_rules = {
            'DB': ('DB', 50),
            'SB': ('SB', 25),
            'S': (f'S{segment_number}', segment_number),
            'T': (f'T{segment_number}', segment_number * 3),
            'D': (f'D{segment_number}', segment_number * 2),
            'miss': ('miss', 0)
        }
        return scoring_rules[scoring_region]
