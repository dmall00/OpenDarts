/**
 * Board calibration service.
 * Orchestrates the calibration process: detect points → calculate homography.
 * Ported from Python detector/service/calibration/board_calibration_service.py
 */

import {homographyCalculator} from './homographyCalculator';
import type {CalibrationPoint, CalibrationResult} from '../types';

/**
 * Board calibration service.
 */
export class BoardCalibrationService {
    private cachedCalibration: CalibrationResult | null = null;

    /**
     * Calibrate from detected calibration points.
     *
     * @param calibrationPoints - Detected calibration points from YOLO
     * @param imageSize - Image size used for detection (default 800)
     * @returns Calibration result with homography matrix
     */
    calibrateFromPoints(
        calibrationPoints: CalibrationPoint[],
        imageSize: number = 800
    ): CalibrationResult {
        const startTime = performance.now();

        console.log('=== Starting Board Calibration ===');
        console.log(`Input: ${calibrationPoints.length} calibration points`);

        // Log detected points
        calibrationPoints.forEach((point, index) => {
            console.log(
                `Point ${index + 1}: ${point.pointType} at (${point.x.toFixed(3)}, ${point.y.toFixed(3)}) ` +
                `confidence: ${point.confidence.toFixed(3)}`
            );
        });

        // Calculate homography matrix
        const homographyResult = homographyCalculator.calculateHomography(
            calibrationPoints,
            imageSize
        );

        const processingTime = performance.now() - startTime;

        if (homographyResult.error) {
            console.error('Calibration failed:', homographyResult.error);

            const result: CalibrationResult = {
                success: false,
                calibrationPoints,
                processingTime,
                errorMessage: homographyResult.error,
            };

            return result;
        }

        console.log(`✓ Calibration successful in ${processingTime.toFixed(2)}ms`);
        console.log(`✓ Used ${homographyResult.validPointCount} calibration points`);
        console.log('=== Calibration Complete ===');

        const result: CalibrationResult = {
            success: true,
            homographyMatrix: homographyResult.matrix,
            calibrationPoints,
            processingTime,
        };

        // Cache the successful calibration
        this.cachedCalibration = result;

        return result;
    }

    /**
     * Get cached calibration result.
     */
    getCachedCalibration(): CalibrationResult | null {
        return this.cachedCalibration;
    }

    /**
     * Check if calibration is cached and valid.
     */
    isCalibrated(): boolean {
        return this.cachedCalibration !== null && this.cachedCalibration.success;
    }

    /**
     * Clear cached calibration.
     */
    clearCalibration(): void {
        console.log('Clearing cached calibration');
        this.cachedCalibration = null;
    }

    /**
     * Get homography matrix from cached calibration.
     */
    getHomographyMatrix(): number[][] | null {
        if (!this.isCalibrated()) {
            return null;
        }
        return this.cachedCalibration!.homographyMatrix || null;
    }
}

// Export singleton instance
export const boardCalibrationService = new BoardCalibrationService();
