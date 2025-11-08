/**
 * Service to load and manage TensorFlow.js models for dart detection.
 * Handles model initialization, caching, and disposal.
 * 
 * Models are loaded from the converted TensorFlow.js format (model.json + weight bins)
 * located in app/assets/models/tfjs/
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import {bundleResourceIO} from '@tensorflow/tfjs-react-native';
import {Asset} from 'expo-asset';
import {DART_SCORER_MODEL_PATH, DARTBOARD_DETECTOR_MODEL_PATH} from './constants';
import type {ModelLoaderResult, TFLiteModel} from './types';

// Static model imports - Metro bundler requires these to be static
const MODEL_ASSETS = {
    'dart_scorer': {
        modelJson: require('../../../assets/models/tfjs/dart_scorer/model.json'),
        weights: [
            require('../../../assets/models/tfjs/dart_scorer/group1-shard1of3.bin'),
            require('../../../assets/models/tfjs/dart_scorer/group1-shard2of3.bin'),
            require('../../../assets/models/tfjs/dart_scorer/group1-shard3of3.bin'),
        ],
    },
    'dartboard_detector': {
        modelJson: require('../../../assets/models/tfjs/dartboard_detector/model.json'),
        weights: [
            require('../../../assets/models/tfjs/dartboard_detector/group1-shard1of3.bin'),
            require('../../../assets/models/tfjs/dartboard_detector/group1-shard2of3.bin'),
            require('../../../assets/models/tfjs/dartboard_detector/group1-shard3of3.bin'),
        ],
    },
} as const;

class ModelLoader {
    private static instance: ModelLoader;
    private dartScorerModel: tf.GraphModel | null = null;
    private dartboardDetectorModel: tf.GraphModel | null = null;
    private isInitialized = false;
    private initializationPromise: Promise<void> | null = null;

    private constructor() {
    }

    static getInstance(): ModelLoader {
        if (!ModelLoader.instance) {
            ModelLoader.instance = new ModelLoader();
        }
        return ModelLoader.instance;
    }

    /**
     * Initialize TensorFlow.js and load models.
     * This should be called once at app startup.
     */
    async initialize(): Promise<ModelLoaderResult> {
        // If already initialized, return cached models
        if (this.isInitialized) {
            return {
                dartScorerModel: this.dartScorerModel as TFLiteModel,
                dartboardDetectorModel: this.dartboardDetectorModel as TFLiteModel,
            };
        }

        // If initialization is in progress, wait for it
        if (this.initializationPromise) {
            await this.initializationPromise;
            return {
                dartScorerModel: this.dartScorerModel as TFLiteModel,
                dartboardDetectorModel: this.dartboardDetectorModel as TFLiteModel,
            };
        }

        // Start initialization
        this.initializationPromise = this.doInitialize();

        try {
            await this.initializationPromise;
            return {
                dartScorerModel: this.dartScorerModel as TFLiteModel,
                dartboardDetectorModel: this.dartboardDetectorModel as TFLiteModel,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Failed to initialize models:', errorMessage);
            return {
                dartScorerModel: null,
                dartboardDetectorModel: null,
                error: errorMessage,
            };
        } finally {
            this.initializationPromise = null;
        }
    }

    /**
     * Get the dart scorer model (main detection model).
     */
    getDartScorerModel(): tf.GraphModel | null {
        return this.dartScorerModel;
    }

    /**
     * Get the dartboard detector model (calibration/cropping model).
     */
    getDartboardDetectorModel(): tf.GraphModel | null {
        return this.dartboardDetectorModel;
    }

    /**
     * Check if models are loaded and ready.
     */
    isReady(): boolean {
        return this.isInitialized && this.dartScorerModel !== null;
    }

    /**
     * Dispose of loaded models to free memory.
     * Should be called when models are no longer needed.
     */
    dispose(): void {
        if (this.dartScorerModel) {
            this.dartScorerModel.dispose();
            this.dartScorerModel = null;
        }
        if (this.dartboardDetectorModel) {
            this.dartboardDetectorModel.dispose();
            this.dartboardDetectorModel = null;
        }
        this.isInitialized = false;
        console.log('Models disposed');
    }

    private async doInitialize(): Promise<void> {
        try {
            console.log('🤖 Initializing TensorFlow.js...');

            // Initialize TensorFlow.js for React Native
            // This is critical - it sets up the React Native backend
            const {fetch, decodeJpeg} = require('@tensorflow/tfjs-react-native');
            await tf.ready();
            
            console.log(`✅ TensorFlow.js backend: ${tf.getBackend()}`);
            console.log(`✅ TensorFlow.js version: ${tf.version.tfjs}`);

            // Load models
            console.log('📦 Loading dart scorer model...');
            this.dartScorerModel = await this.loadModel('dart_scorer');
            console.log('✅ Dart scorer model loaded successfully');

            console.log('📦 Loading dartboard detector model...');
            this.dartboardDetectorModel = await this.loadModel('dartboard_detector');
            console.log('✅ Dartboard detector model loaded successfully');

            this.isInitialized = true;
            console.log('🎯 ML models ready for inference');
        } catch (error) {
            console.error('❌ Error during model initialization:', error);
            throw error;
        }
    }

    /**
     * Load a TensorFlow.js model from the assets folder.
     */
    private async loadModel(modelName: 'dart_scorer' | 'dartboard_detector'): Promise<tf.GraphModel> {
        try {
            const modelAssets = MODEL_ASSETS[modelName];
            
            console.log(`Loading ${modelName}...`);

            // Use bundleResourceIO with model.json and weight files
            // bundleResourceIO(modelJson, weightsManifest)
            const model = await tf.loadGraphModel(
                bundleResourceIO(modelAssets.modelJson, modelAssets.weights as any)
            );

            console.log(`✅ ${modelName} loaded successfully`);
            return model;
        } catch (error) {
            console.error(`Failed to load model ${modelName}:`, error);
            throw error;
        }
    }
}

// Export singleton instance
export const modelLoader = ModelLoader.getInstance();

// Export convenience functions
export const initializeModels = () => modelLoader.initialize();
export const getDartScorerModel = () => modelLoader.getDartScorerModel();
export const getDartboardDetectorModel = () => modelLoader.getDartboardDetectorModel();
export const isModelsReady = () => modelLoader.isReady();
export const disposeModels = () => modelLoader.dispose();
