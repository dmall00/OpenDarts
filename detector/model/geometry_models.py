"""Utility geometry constants for dartboard calibration and scoring."""

# Dartboard coordinate constants
BOARD_CENTER_COORDINATE = 0.5  # Center position for both X and Y coordinates (normalized 0-1)
ANGLE_CALCULATION_EPSILON = 0.00001  # Small value to avoid division by zero in angle calculations

# Dartboard segment angle thresholds and boundaries
SEGMENT_20_3_ANGLE_THRESHOLD = 81  # Angle threshold for determining segments 20 and 3
SEGMENT_11_6_ANGLE = -9  # Angle between segments 11 and 6
SEGMENT_9_15_ANGLE = 27  # Angle between segments 9 and 15

# Dartboard physical dimensions (in mm)
RING_WIDTH = 10.0
BULLSEYE_WIRE_WIDTH = 1.6
BOARD_DIAMETER = 451.0
OUTER_RADIUS_RATIO = 170.0 / 451.0

# Dartboard scoring region radii (in mm, before normalization)
DOUBLE_BULL_RADIUS = 6.35  # Inner bull (double bull) radius
SINGLE_BULL_RADIUS = 15.9  # Outer bull (single bull) radius
TRIPLE_RING_INNER_RADIUS = 107.4 - RING_WIDTH  # Inner edge of triple ring
TRIPLE_RING_OUTER_RADIUS = 107.4  # Outer edge of triple ring
DOUBLE_RING_INNER_RADIUS = 170.0 - RING_WIDTH  # Inner edge of double ring
DOUBLE_RING_OUTER_RADIUS = 170.0  # Outer edge of double ring

# Dartboard segment angles (degrees from center)
DARTBOARD_SEGMENT_ANGLES = [-9, 9, 27, 45, 63, -81, -63, -45, -27]

# Dartboard segment number mappings
DARTBOARD_SEGMENT_NUMBERS = [
    [6, 11],
    [10, 14],
    [15, 9],
    [2, 12],
    [17, 5],
    [19, 1],
    [7, 18],
    [16, 4],
    [8, 13],
]

# Scoring region names
SCORING_REGION_NAMES = ["DB", "SB", "S", "T", "S", "D", "miss"]

# Scoring values
DOUBLE_BULL_SCORE = 50
SINGLE_BULL_SCORE = 25
MISS_SCORE = 0

# YOLO model constants
DART_CLASS_ID = 4  # Class ID for dart detection in YOLO model

# Coordinate bounds
NORMALIZED_COORDINATE_MIN = 0.0  # Minimum normalized coordinate value
NORMALIZED_COORDINATE_MAX = 1.0  # Maximum normalized coordinate value

# Visualization constants
VISUALIZATION_TEXT_RADIUS_RATIO = 0.8  # Ratio for text placement on dartboard visualization
VISUALIZATION_SAMPLE_POSITION_RADIUS = 0.4  # Radius for sample position calculation
VISUALIZATION_TARGET_HEIGHT = 600  # Target height for visualization windows
VISUALIZATION_CIRCLE_RADIUS = 8  # Radius for calibration point circles
VISUALIZATION_DART_CIRCLE_RADIUS = 6  # Radius for dart point circles
VISUALIZATION_TEXT_OFFSET = 10  # Offset for text placement
