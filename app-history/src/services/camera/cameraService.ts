import {Camera, CameraDevice} from 'react-native-vision-camera';
import {isWeb} from "@/src/utils/platform";

export interface CameraConfig {
    quality?: number;
    skipProcessing?: boolean;
}

export class CameraService {
    private static instance: CameraService;
    private cameraRef: Camera | null = null;
    private device: CameraDevice | null = null;
    private _isRecording: boolean = false;

    public get isRecording(): boolean {
        return this._isRecording;
    }
    private captureInterval: ReturnType<typeof setInterval> | null = null;

    private constructor() {
        this._isRecording = false;
    }

    public static getInstance(): CameraService {
        if (!CameraService.instance) {
            CameraService.instance = new CameraService();
        }
        return CameraService.instance;
    }

    public setCameraRef(ref: Camera | null): void {
        if (isWeb()) {
            return;
        }

        if (!ref && this.cameraRef) {
            this.stopVideoRecording();
            this.stopFrameCapture();
        }

        this.cameraRef = ref;
    }

    public setDevice(device: CameraDevice | null): void {
        if (isWeb()) {
            return;
        }
        
        this.device = device;
    }

    public isCameraReady(): boolean {
        if (isWeb()) {
            return false;
        }
        
        return this.cameraRef !== null;
    }

    public async startVideoRecording(): Promise<boolean> {
        if (isWeb()) {
            return false;
        }

        if (!this.cameraRef || !this.device || this._isRecording) {
            return false;
        }

        try {
            this._isRecording = true;
            console.log('Video recording started');
            return true;
        } catch (error) {
            console.error('Failed to start video recording:', error);
            return false;
        }
    }

    public async stopVideoRecording(): Promise<void> {
        if (isWeb()) {
            return;
        }

        if (!this._isRecording) {
            return;
        }

        try {
            this._isRecording = false;
            if (this.captureInterval) {
                clearInterval(this.captureInterval);
                this.captureInterval = null;
            }
            console.log('Video recording stopped');
        } catch (error) {
            console.error('Failed to stop video recording:', error);
        }
    }

    public async captureFrameFromStream(config: CameraConfig = {}): Promise<Blob | null> {
        if (isWeb()) {
            return null;
        }
        
        if (!this.cameraRef || !this.device) {
            if (this._isRecording) {
                console.warn('Camera reference or device not set');
            }
            return null;
        }

        try {
            const photo = await this.cameraRef.takePhoto();

            if (!photo || !photo.path) {
                return null;
            }

            const response = await fetch(`file://${photo.path}`);
            const blob = await response.blob();
            return blob;
        } catch (error) {
            if (this._isRecording && this.cameraRef) {
                console.error('Failed to capture frame from stream:', error);
            }
            return null;
        }
    }

    public async captureAndSend(
        sendBinaryFunction: (data: string | ArrayBuffer | Blob) => boolean,
        config: CameraConfig = {}
    ): Promise<boolean> {
        if (isWeb()) {
            return false;
        }
        
        try {
            if (!this.cameraRef || !this.device) {
                if (this._isRecording) {
                    console.error('Camera reference or device not set - cannot capture');
                }
                return false;
            }

            const blob = await this.captureFrameFromStream(config);

            if (!blob) {
                if (this._isRecording) {
                    console.warn('No frame captured from stream');
                }
                return false;
            }

            // Log when sending a picture to the websocket server
            console.log('Sending image frame to websocket server', {
                timestamp: new Date().toISOString(),
                imageSize: blob.size,
                imageType: blob.type
            });

            return sendBinaryFunction(blob);
        } catch (error) {
            if (this._isRecording && this.cameraRef) {
                console.error('Failed to capture and send camera data:', error);
            }
            return false;
        }
    }

    public startFrameCapture(captureCallback: () => Promise<void>, fps: number): void {
        if (isWeb()) {
            return;
        }
        
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
        }

        const intervalMs = 1000 / fps;
        this.captureInterval = setInterval(captureCallback, intervalMs);
    }

    public stopFrameCapture(): void {
        if (isWeb()) {
            return;
        }
        
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
        }
    }
}