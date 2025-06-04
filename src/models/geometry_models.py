"""Utility geometry constants for dartboard calibration and scoring."""


# Dartboard coordinate constants
BOARD_CENTER_COORDINATE = 0.5  # Center position for both X and Y coordinates (normalized 0-1)
ANGLE_CALCULATION_EPSILON = 0.00001  # Small value to avoid division by zero in angle calculations

# Dartboard segment angle thresholds
SEGMENT_20_3_ANGLE_THRESHOLD = 81  # Angle threshold for determining segments 20 and 3

# Dartboard physical dimensions (in mm)
RING_WIDTH = 10.0
BULLSEYE_WIRE_WIDTH = 1.6
BOARD_DIAMETER = 451.0
OUTER_RADIUS_RATIO = 170.0 / 451.0


