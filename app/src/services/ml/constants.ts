/**
 * Constants for ML-based dart detection and scoring.
 * Ported from Python autoscore-server/detector/model/geometry_models.py
 */

// YOLO model constants
export const DART_CLASS_ID = 4;

// Class ID to name mapping (from yolo_dart_class_mapping.py)
export const YOLO_CLASS_MAPPING: Record<number, string> = {
    0: '20',
    1: '3',
    2: '11',
    3: '6',
    [DART_CLASS_ID]: 'dart',
    5: '9',
    6: '15',
};

// Confidence thresholds
export const DEFAULT_DART_CONFIDENCE_THRESHOLD = 0.35;
export const DEFAULT_CALIBRATION_CONFIDENCE_THRESHOLD = 0.0;
export const MISS_DART_CONFIDENCE_THRESHOLD = 0.8;

// Image processing
export const TARGET_IMAGE_SIZE = {width: 800, height: 800};
export const MAX_ALLOWED_DARTS = 3;
export const MIN_CALIBRATION_POINTS = 4;

// Dartboard coordinate constants
export const BOARD_CENTER_COORDINATE = 0.5;
export const ANGLE_CALCULATION_EPSILON = 0.00001;

// Dartboard segment angle thresholds
export const SEGMENT_20_3_ANGLE_THRESHOLD = 81;
export const SEGMENT_11_6_ANGLE = -9;
export const SEGMENT_9_15_ANGLE = 27;

// Dartboard physical dimensions (in mm)
export const RING_WIDTH = 10.0;
export const BULLSEYE_WIRE_WIDTH = 1.6;
export const BOARD_DIAMETER = 451.0;
export const OUTER_RADIUS_RATIO = 170.0 / 451.0;

// Dartboard scoring region radii (in mm, before normalization)
export const DOUBLE_BULL_RADIUS = 6.35;
export const SINGLE_BULL_RADIUS = 15.9;
export const TRIPLE_RING_INNER_RADIUS = 107.4 - RING_WIDTH;
export const TRIPLE_RING_OUTER_RADIUS = 107.4;
export const DOUBLE_RING_INNER_RADIUS = 170.0 - RING_WIDTH;
export const DOUBLE_RING_OUTER_RADIUS = 170.0;

// Dartboard segment angles (degrees from center)
export const DARTBOARD_SEGMENT_ANGLES = [-9, 9, 27, 45, 63, -81, -63, -45, -27];

// Dartboard segment number mappings
export const DARTBOARD_SEGMENT_NUMBERS = [
    [6, 11],
    [10, 14],
    [15, 9],
    [2, 12],
    [17, 5],
    [19, 1],
    [7, 18],
    [16, 4],
    [8, 13],
];

// Scoring region names
export const SCORING_REGION_NAMES = ['DB', 'SB', 'S', 'T', 'S', 'D', 'miss'];

// Scoring values
export const DOUBLE_BULL_SCORE = 50;
export const SINGLE_BULL_SCORE = 25;
export const MISS_SCORE = 0;

// Coordinate bounds
export const NORMALIZED_COORDINATE_MIN = 0.0;
export const NORMALIZED_COORDINATE_MAX = 1.0;

// Stabilization constants (from Kotlin AutoScoreStabilizer)
export const REQUIRED_APPEARANCES = 2;
export const MAX_FRAMES_WITHOUT_APPEARANCE = 3;
export const DISTANCE_THRESHOLD = 0.04;

// Turn detection constants (from Kotlin TurnSwitchDetector)
export const EMPTY_FRAMES_THRESHOLD = 5;

// Model paths (TensorFlow.js format)
export const DART_SCORER_MODEL_PATH = 'tfjs/dart_scorer/model.json';
export const DARTBOARD_DETECTOR_MODEL_PATH = 'tfjs/dartboard_detector/model.json';
