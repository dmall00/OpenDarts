/**
 * Coordinate transformer for dartboard calibration.
 * Transforms dart positions from camera space to board space using homography matrix.
 * Ported from Python detector/service/calibration/coordinate_transformer.py
 */

import type {DartPosition} from '../types';

/**
 * Coordinate transformer service.
 */
export class CoordinateTransformer {
    private imageSize: number;

    constructor(imageSize: number = 800) {
        this.imageSize = imageSize;
    }

    /**
     * Transform dart coordinates from camera space to board space.
     *
     * @param homographyMatrix - 3x3 transformation matrix
     * @param dartPositions - Dart positions in camera space (normalized 0-1)
     * @returns Transformed positions in board space (normalized 0-1)
     */
    transformToBoardDimensions(
        homographyMatrix: number[][],
        dartPositions: DartPosition[]
    ): Array<{ x: number; y: number }> {
        console.log(`Transforming ${dartPositions.length} dart coordinates to board space`);

        const transformedPositions: Array<{ x: number; y: number }> = [];

        for (const position of dartPositions) {
            // Convert normalized coordinates to pixel coordinates
            const pixelX = position.x * this.imageSize;
            const pixelY = position.y * this.imageSize;

            // Create homogeneous coordinates [x, y, 1]
            const homogeneousCoords = [pixelX, pixelY, 1];

            // Apply homography transformation: H * [x, y, 1]^T
            const transformed = [
                homographyMatrix[0][0] * homogeneousCoords[0] +
                homographyMatrix[0][1] * homogeneousCoords[1] +
                homographyMatrix[0][2] * homogeneousCoords[2],
                homographyMatrix[1][0] * homogeneousCoords[0] +
                homographyMatrix[1][1] * homogeneousCoords[1] +
                homographyMatrix[1][2] * homogeneousCoords[2],
                homographyMatrix[2][0] * homogeneousCoords[0] +
                homographyMatrix[2][1] * homogeneousCoords[1] +
                homographyMatrix[2][2] * homogeneousCoords[2],
            ];

            // Normalize by the homogeneous coordinate (w)
            const normalizedX = transformed[0] / transformed[2];
            const normalizedY = transformed[1] / transformed[2];

            // Convert back to normalized coordinates (0-1)
            const finalX = normalizedX / this.imageSize;
            const finalY = normalizedY / this.imageSize;

            transformedPositions.push({x: finalX, y: finalY});

            console.log(
                `Transformed dart: (${position.x.toFixed(3)}, ${position.y.toFixed(3)}) → ` +
                `(${finalX.toFixed(3)}, ${finalY.toFixed(3)})`
            );
        }

        console.log(`Transformation completed for ${dartPositions.length} darts`);
        return transformedPositions;
    }

    /**
     * Set image size for coordinate transformation.
     */
    setImageSize(size: number): void {
        this.imageSize = size;
    }

    /**
     * Get current image size.
     */
    getImageSize(): number {
        return this.imageSize;
    }
}

// Export singleton instance
export const coordinateTransformer = new CoordinateTransformer();
