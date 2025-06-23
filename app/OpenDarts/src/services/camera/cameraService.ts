import {Camera, CameraDevice} from 'react-native-vision-camera';

export interface CameraConfig {
    quality?: number;
    skipProcessing?: boolean;
}

export class CameraService {
    private static instance: CameraService;
    private cameraRef: Camera | null = null;
    private device: CameraDevice | null = null;
    private isRecording: boolean = false;
    private captureInterval: ReturnType<typeof setInterval> | null = null;

    private constructor() {
    }

    public static getInstance(): CameraService {
        if (!CameraService.instance) {
            CameraService.instance = new CameraService();
        }
        return CameraService.instance;
    }

    public setCameraRef(ref: Camera | null): void {
        this.cameraRef = ref;
        if (!ref) {
            this.stopVideoRecording();
        }
    }

    public setDevice(device: CameraDevice | null): void {
        this.device = device;
    }

    public isCameraReady(): boolean {
        return this.cameraRef !== null;
    }

    public async startVideoRecording(): Promise<boolean> {
        if (!this.cameraRef || !this.device || this.isRecording) {
            return false;
        }

        try {
            this.isRecording = true;
            console.log('Video recording started');
            return true;
        } catch (error) {
            console.error('Failed to start video recording:', error);
            return false;
        }
    }

    public async stopVideoRecording(): Promise<void> {
        if (!this.isRecording) {
            return;
        }

        try {
            this.isRecording = false;
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
        if (!this.cameraRef || !this.device) {
            console.warn('Camera reference or device not set');
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
            console.error('Failed to capture frame from stream:', error);
            return null;
        }
    }

    public async captureAndSend(
        sendBinaryFunction: (data: string | ArrayBuffer | Blob) => boolean,
        config: CameraConfig = {}
    ): Promise<boolean> {
        try {
            if (!this.cameraRef || !this.device) {
                console.error('Camera reference or device not set - cannot capture');
                return false;
            }

            const blob = await this.captureFrameFromStream(config);

            if (!blob) {
                console.warn('No frame captured from stream');
                return false;
            }


            return sendBinaryFunction(blob);
        } catch (error) {
            console.error('Failed to capture and send camera data:', error);
            return false;
        }
    }

    public startFrameCapture(captureCallback: () => Promise<void>, fps: number): void {
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
        }

        const intervalMs = 1000 / fps;
        this.captureInterval = setInterval(captureCallback, intervalMs);
    }

    public stopFrameCapture(): void {
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
        }
    }
}
