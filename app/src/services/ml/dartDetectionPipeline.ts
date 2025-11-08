/**
 * Dart detection pipeline.
 * Orchestrates the full ML pipeline: preprocess → detect → calibrate → score.
 */

import * as tf from '@tensorflow/tfjs';
import {imagePreprocessor} from './imagePreprocessor';
import {yoloParser} from './yoloParser';
import {boardCalibrationService} from './calibration/boardCalibrationService';
import {dartScoringService} from './scoring/dartScoringService';
import {getDartScorerModel} from './modelLoader';
import type {CalibrationResult, DartDetection} from './types';

export interface DetectionPipelineResult {
    detections: DartDetection[];
    calibrationResult?: CalibrationResult;
    processingTime: number;
    error?: string;
}

/**
 * Dart detection pipeline service.
 */
export class DartDetectionPipeline {
    private isProcessing = false;

    /**
     * Process a camera frame through the full detection pipeline.
     * Note: On mobile, this is disabled and images are sent to the backend for processing.
     *
     * @param imageBlob - Camera image blob
     * @param skipCalibration - Skip calibration step (use cached calibration)
     * @returns Detection results with scores
     */
    async processFrame(
        imageBlob: Blob,
        skipCalibration: boolean = false
    ): Promise<DetectionPipelineResult> {
        if (this.isProcessing) {
            console.warn('Pipeline already processing, skipping frame');
            return {
                detections: [],
                processingTime: 0,
                error: 'Pipeline busy',
            };
        }

        this.isProcessing = true;
        const startTime = performance.now();
        const timings: Record<string, number> = {};

        try {
            console.log('\n========================================');
            console.log('🎯 Starting Dart Detection Pipeline');
            console.log('========================================\n');

            // Step 1: Preprocess image
            console.log('📸 Step 1: Preprocessing image...');
            const step1Start = performance.now();
            const {tensor, preprocessingResult} = await imagePreprocessor.preprocessBlob(imageBlob);
            timings.preprocessing = performance.now() - step1Start;
            console.log(`✓ Image preprocessed (${timings.preprocessing.toFixed(1)}ms)\n`);

            // Step 2: Run YOLO detection
            console.log('🔍 Step 2: Running YOLO detection...');
            const step2Start = performance.now();
            const dartScorerModel = getDartScorerModel();

            if (!dartScorerModel) {
                throw new Error('Dart scorer model not loaded');
            }

            const modelOutput = await dartScorerModel.predict(tensor) as tf.Tensor;
            const parseResult = await yoloParser.extractDetections(modelOutput);
            timings.yoloDetection = performance.now() - step2Start;
            console.log(`✓ Detected ${parseResult.originalPositions.length} darts, ${parseResult.calibrationPoints.length} calibration points (${timings.yoloDetection.toFixed(1)}ms)\n`);

            // Clean up tensors
            tensor.dispose();
            modelOutput.dispose();

            // Step 3: Calibration (if needed)
            let calibrationResult: CalibrationResult | undefined;
            let homographyMatrix: number[][] | null = null;

            if (!skipCalibration && parseResult.calibrationPoints.length > 0) {
                console.log('🎲 Step 3: Calibrating dartboard...');
                const step3Start = performance.now();
                calibrationResult = boardCalibrationService.calibrateFromPoints(
                    parseResult.calibrationPoints
                );
                timings.calibration = performance.now() - step3Start;

                if (calibrationResult.success) {
                    homographyMatrix = calibrationResult.homographyMatrix || null;
                    console.log(`✓ Calibration successful (${timings.calibration.toFixed(1)}ms)\n`);
                } else {
                    console.warn(`⚠ Calibration failed: ${calibrationResult.errorMessage} (${timings.calibration.toFixed(1)}ms)`);
                    console.log('Will use cached calibration if available\n');
                }
            } else if (skipCalibration) {
                console.log('⏭ Step 3: Skipping calibration (using cached)');
                const step3Start = performance.now();
                homographyMatrix = boardCalibrationService.getHomographyMatrix();
                timings.calibration = performance.now() - step3Start;

                if (!homographyMatrix) {
                    console.warn(`⚠ No cached calibration available (${timings.calibration.toFixed(1)}ms)\n`);
                } else {
                    console.log(`✓ Using cached calibration (${timings.calibration.toFixed(1)}ms)\n`);
                }
            } else {
                timings.calibration = 0;
            }

            // Step 4: Score darts
            let detections: DartDetection[];

            if (parseResult.originalPositions.length > 0) {
                if (homographyMatrix) {
                    console.log('🎯 Step 4: Scoring darts...');
                    const step4Start = performance.now();
                    detections = dartScoringService.scoreDarts(
                        parseResult.originalPositions,
                        homographyMatrix
                    );
                    timings.scoring = performance.now() - step4Start;
                    console.log(`✓ Darts scored (${timings.scoring.toFixed(1)}ms)\n`);
                } else {
                    console.log('⚠ Step 4: No calibration available, creating unscored detections');
                    const step4Start = performance.now();
                    detections = dartScoringService.createUnscoredDetections(
                        parseResult.originalPositions
                    );
                    timings.scoring = performance.now() - step4Start;
                    console.log(`✓ Unscored detections created (${timings.scoring.toFixed(1)}ms)\n`);
                }
            } else {
                console.log('ℹ Step 4: No darts detected\n');
                detections = [];
                timings.scoring = 0;
            }

            const processingTime = performance.now() - startTime;

            console.log('========================================');
            console.log(`✅ Pipeline Complete (${processingTime.toFixed(1)}ms)`);
            console.log('⏱️  Breakdown:');
            console.log(`   - Preprocessing: ${timings.preprocessing.toFixed(1)}ms`);
            console.log(`   - YOLO Detection: ${timings.yoloDetection.toFixed(1)}ms`);
            console.log(`   - Calibration: ${timings.calibration.toFixed(1)}ms`);
            console.log(`   - Scoring: ${timings.scoring.toFixed(1)}ms`);
            console.log('========================================\n');

            return {
                detections,
                calibrationResult,
                processingTime,
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            const processingTime = performance.now() - startTime;
            
            console.log('========================================');
            console.error(`❌ Pipeline Failed (${processingTime.toFixed(1)}ms)`);
            console.error(`Error: ${errorMsg}`);
            if (error instanceof Error && error.stack) {
                console.error('Stack:', error.stack);
            }
            console.log('========================================\n');

            return {
                detections: [],
                processingTime,
                error: errorMsg,
            };
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Check if pipeline is currently processing.
     */
    isBusy(): boolean {
        return this.isProcessing;
    }

    /**
     * Clear cached calibration.
     */
    clearCalibration(): void {
        boardCalibrationService.clearCalibration();
    }

    /**
     * Check if calibration is available.
     */
    isCalibrated(): boolean {
        return boardCalibrationService.isCalibrated();
    }
}

// Export singleton instance
export const dartDetectionPipeline = new DartDetectionPipeline();
