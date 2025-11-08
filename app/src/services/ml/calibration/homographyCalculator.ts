/**
 * Homography matrix calculator for dartboard calibration.
 * Uses ml-matrix library for robust SVD-based homography calculation.
 * Ported from Python detector/service/calibration/calibration_matrix_calculator.py
 */

import {Matrix, SingularValueDecomposition} from 'ml-matrix';
import {DART_CLASS_ID, MIN_CALIBRATION_POINTS, YOLO_CLASS_MAPPING} from '../constants';
import type {CalibrationPoint} from '../types';

/**
 * Calculate reference calibration coordinates on the dartboard.
 * These are the known positions of calibration points in board space.
 */
function calculateCalibrationReferenceCoordinates(): number[][] {
    const BOARD_CENTER = 0.5;
    const OUTER_RADIUS = 170.0 / 451.0; // OUTER_RADIUS_RATIO

    // Calibration angles for specific segments
    const calibrationAngles = {
        '20_3': 81,   // SEGMENT_20_3_ANGLE_THRESHOLD
        '11_6': -9,   // SEGMENT_11_6_ANGLE
        '9_15': 27,   // SEGMENT_9_15_ANGLE
    };

    const coords: number[][] = [];

    // Calculate coordinate pairs for each angle
    Object.values(calibrationAngles).forEach((angleDeg) => {
        const angleRad = (angleDeg * Math.PI) / 180;
        const xOffset = OUTER_RADIUS * Math.cos(angleRad);
        const yOffset = OUTER_RADIUS * Math.sin(angleRad);

        // Add both sides of the diameter
        coords.push([BOARD_CENTER - xOffset, BOARD_CENTER - yOffset]);
        coords.push([BOARD_CENTER + xOffset, BOARD_CENTER + yOffset]);
    });

    return coords;
}

/**
 * Calculate homography matrix using SVD (Singular Value Decomposition).
 * This is the standard, robust method used in OpenCV and other computer vision libraries.
 *
 * @param srcPoints - Source points (detected calibration points in image)
 * @param dstPoints - Destination points (known positions on dartboard)
 * @returns 3x3 homography matrix
 */
function computeHomographySVD(srcPoints: number[][], dstPoints: number[][]): number[][] {
    const n = srcPoints.length;

    if (n < 4) {
        throw new Error('Need at least 4 points to compute homography');
    }

    // Build the A matrix for DLT (Direct Linear Transform)
    // For each point correspondence, we get 2 equations
    const A: number[][] = [];

    for (let i = 0; i < n; i++) {
        const [x, y] = srcPoints[i];
        const [xp, yp] = dstPoints[i];

        // First equation: -x, -y, -1, 0, 0, 0, x*xp, y*xp, xp
        A.push([
            -x, -y, -1, 0, 0, 0, x * xp, y * xp, xp,
        ]);

        // Second equation: 0, 0, 0, -x, -y, -1, x*yp, y*yp, yp
        A.push([
            0, 0, 0, -x, -y, -1, x * yp, y * yp, yp,
        ]);
    }

    // Convert to Matrix and compute SVD
    const matrixA = new Matrix(A);
    const svd = new SingularValueDecomposition(matrixA);

    // The solution is the last column of V (corresponding to smallest singular value)
    const V = svd.rightSingularVectors;
    const h = V.getColumn(V.columns - 1);

    // Reshape into 3x3 matrix
    return [
        [h[0], h[1], h[2]],
        [h[3], h[4], h[5]],
        [h[6], h[7], h[8]],
    ];
}

/**
 * Homography matrix calculator service.
 */
export class HomographyCalculator {
    private referenceCoordinates: number[][];

    constructor() {
        this.referenceCoordinates = calculateCalibrationReferenceCoordinates();
        console.log('📐 Reference calibration coordinates initialized:', this.referenceCoordinates);
    }

    /**
     * Calculate homography transformation matrix from calibration points.
     * Uses SVD-based approach for robust calculation.
     */
    calculateHomography(
        calibrationPoints: CalibrationPoint[],
        imageSize: number = 800
    ): {
        matrix: number[][];
        validPointCount: number;
        error?: string;
    } {
        console.log(`📐 Calculating homography from ${calibrationPoints.length} calibration points`);

        // Filter valid points (within bounds)
        const validPoints = calibrationPoints.filter(
            (p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1
        );

        console.log(`✓ Found ${validPoints.length} valid calibration points`);

        // Check minimum points
        if (validPoints.length < MIN_CALIBRATION_POINTS) {
            const foundPoints = validPoints.map(
                (p) => `${YOLO_CLASS_MAPPING[p.classId]} (conf: ${p.confidence.toFixed(3)})`
            );

            const allClassIds = new Set(Object.keys(YOLO_CLASS_MAPPING).map(Number));
            allClassIds.delete(DART_CLASS_ID);

            const foundClassIds = new Set(validPoints.map((p) => p.classId));
            const missingClassIds = [...allClassIds].filter((id) => !foundClassIds.has(id));
            const missingPoints = missingClassIds.map((id) => YOLO_CLASS_MAPPING[id]);

            const error = `Only ${validPoints.length} valid calibration points found, minimum ${MIN_CALIBRATION_POINTS} required.\nFound: ${foundPoints.join(', ')}\nMissing: ${missingPoints.join(', ')}`;

            console.error('❌', error);

            return {
                matrix: [],
                validPointCount: validPoints.length,
                error,
            };
        }

        try {
            // Convert to pixel coordinates
            const srcPoints = validPoints.map((p) => [p.x * imageSize, p.y * imageSize]);
            const dstPoints = this.referenceCoordinates
                .slice(0, validPoints.length)
                .map((p) => [p[0] * imageSize, p[1] * imageSize]);

            // Compute homography matrix using SVD
            const matrix = computeHomographySVD(srcPoints, dstPoints);

            console.log(`✅ Homography matrix calculated successfully using ${validPoints.length} points (SVD method)`);
            console.log('Matrix:', matrix.map(row => row.map(v => v.toFixed(6))));

            return {
                matrix,
                validPointCount: validPoints.length,
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Homography calculation failed:', errorMsg);

            return {
                matrix: [],
                validPointCount: validPoints.length,
                error: `Homography calculation failed: ${errorMsg}`,
            };
        }
    }

    /**
     * Get reference calibration coordinates.
     */
    getReferenceCoordinates(): number[][] {
        return this.referenceCoordinates;
    }
}

// Export singleton instance
export const homographyCalculator = new HomographyCalculator();
