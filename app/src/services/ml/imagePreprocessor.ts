/**
 * Image preprocessing service for dart detection.
 * Ported from Python autoscore-server/detector/service/image_preprocessor.py
 */

import * as tf from '@tensorflow/tfjs';
import {TARGET_IMAGE_SIZE} from './constants';
import type {PreprocessingResult} from './types';
import {decodeJpeg} from '@tensorflow/tfjs-react-native';

/**
 * Resize and preprocess images for YOLO model inference.
 * Converts image data to tensor format expected by the model.
 */
export class ImagePreprocessor {
    private targetSize: { width: number; height: number };

    constructor(targetSize = TARGET_IMAGE_SIZE) {
        this.targetSize = targetSize;
    }

    /**
     * Preprocess an image for model inference.
     * Optimized with tf.tidy() for automatic memory management.
     *
     * @param imageData - Image data as Uint8Array
     * @returns Preprocessed tensor ready for model input
     */
    async preprocessImage(
        imageData: Uint8Array
    ): Promise<{ tensor: tf.Tensor; preprocessingResult: PreprocessingResult }> {
        try {
            // Use tf.tidy to automatically clean up intermediate tensors
            const tensor = tf.tidy(() => {
                // Decode JPEG to tensor [height, width, 3]
                const imageTensor = decodeJpeg(imageData);

                // Chain operations: resize → normalize → add batch dimension
                // This is more efficient than separate operations
                return imageTensor
                    .resizeBilinear([this.targetSize.height, this.targetSize.width])
                    .div(255.0)
                    .expandDims(0);
            });

            return {
                tensor,
                preprocessingResult: {
                    cropInfo: undefined,
                },
            };
        } catch (error) {
            console.error('Error preprocessing image:', error);
            throw error;
        }
    }

    /**
     * Preprocess image from a blob (camera capture).
     * Optimized for React Native performance.
     *
     * @param blob - Image blob from camera
     * @returns Preprocessed tensor
     */
    async preprocessBlob(blob: Blob): Promise<{ tensor: tf.Tensor; preprocessingResult: PreprocessingResult }> {
        try {
            // Use Response API for faster blob to ArrayBuffer conversion (faster than FileReader)
            const arrayBuffer = await new Response(blob).arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            return this.preprocessImage(uint8Array);
        } catch (error) {
            console.error('Error preprocessing blob:', error);
            throw error;
        }
    }

    /**
     * Resize image tensor to target size.
     * Matches Python's cv2.resize with INTER_AREA interpolation.
     */
    resizeTensor(tensor: tf.Tensor3D): tf.Tensor3D {
        return tf.image.resizeBilinear(
            tensor,
            [this.targetSize.height, this.targetSize.width]
        ) as tf.Tensor3D;
    }

    /**
     * Get target image size.
     */
    getTargetSize(): { width: number; height: number } {
        return this.targetSize;
    }


}

// Export singleton instance
export const imagePreprocessor = new ImagePreprocessor();
