import {CameraView} from 'expo-camera';

export interface CameraConfig {
    quality?: number;
    skipProcessing?: boolean;
}

export class CameraService {
    private static instance: CameraService;
    private cameraRef: CameraView | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private videoStream: MediaStream | null = null;
    private isRecording: boolean = false;
    private frameExtractor: ((blob: Blob) => void) | null = null;

    private constructor() {
    }

    public static getInstance(): CameraService {
        if (!CameraService.instance) {
            CameraService.instance = new CameraService();
        }
        return CameraService.instance;
    }
  public setCameraRef(ref: CameraView | null): void {
    console.log('CameraService: Setting camera ref:', !!ref);
        this.cameraRef = ref;
    if (ref) {
      console.log('CameraService: Camera ref successfully set');
    } else {
      console.log('CameraService: Camera ref cleared');
        this.stopVideoRecording();
    }
  }

  public isCameraReady(): boolean {
    return this.cameraRef !== null;
  }

    public async startVideoRecording(): Promise<boolean> {
        if (!this.cameraRef || this.isRecording) {
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
            console.log('Video recording stopped');
        } catch (error) {
            console.error('Failed to stop video recording:', error);
        }
    }

    public async captureFrameFromStream(config: CameraConfig = {}): Promise<Blob | null> {
        if (!this.cameraRef) {
            console.warn('Camera reference not set');
            return null;
        }

        try {
            const options = {
                quality: config.quality || 0.7,
                base64: false,
                skipProcessing: config.skipProcessing || false,
                shutterSound: false,
                animationEnabled: false,
            };

            const photo = await this.cameraRef.takePictureAsync(options);

            if (!photo || !photo.uri) {
                return null;
            }

            const response = await fetch(photo.uri);
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
            console.log('Starting camera capture from stream...');

          if (!this.cameraRef) {
            console.error('Camera reference not set - cannot capture');
            return false;
          }

            const blob = await this.captureFrameFromStream(config);

            if (!blob) {
                console.warn('No frame captured from stream');
                return false;
            }

            console.log('Frame captured from stream, size:', blob.size, 'type:', blob.type);

          const result = sendBinaryFunction(blob);
          console.log('Send binary result:', result);
          return result;
        } catch (error) {
            console.error('Failed to capture and send camera data:', error);
            return false;
        }
    }
}
