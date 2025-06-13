import React, {useEffect, useRef, useState} from 'react';
import {Alert, Dimensions, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';

const { width, height } = Dimensions.get('window');

// Configuration - Update these URLs for your backend
const DEFAULT_CONFIG = {
  CALIBRATION_API: 'https://your-api.com/calibrate',
  DEFAULT_WEBSOCKET_URL: 'ws://localhost:8080/ws/app',
  FRAME_RATE: 10 // 10 FPS
};

export default function DartScoringApp() {
  // State management
  const [mode, setMode] = useState<1 | 2>(1); // 1 = Calibration mode, 2 = Streaming mode
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isStreaming, setIsStreaming] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [websocketUrl, setWebsocketUrl] = useState(DEFAULT_CONFIG.DEFAULT_WEBSOCKET_URL);
  const [calibrationApi, setCalibrationApi] = useState(DEFAULT_CONFIG.CALIBRATION_API);

  // Refs
  const cameraRef = useRef<Camera>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Camera device
  const device = useCameraDevice('back');

  // WebSocket connection
  useEffect(() => {
    if (mode === 2 || (mode === 1 && isCalibrated)) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, [mode, isCalibrated]);
  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket(websocketUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        startVideoStreaming();
      };
      wsRef.current.onmessage = (event: any) => {
        console.log('WebSocket message:', event.data);
      };

      wsRef.current.onerror = (error: any) => {
        console.error('WebSocket error:', error);
        Alert.alert('Connection Error', 'Failed to connect to streaming server');
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        setIsStreaming(false);
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current);
        }
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  };
  const captureFrame = async () => {
    if (!cameraRef.current) return null;

    try {
      const photo = await cameraRef.current.takePhoto({
        enableAutoRedEyeReduction: false,
      });

      // Note: For base64 encoding, you might need to use react-native-fs or similar library
      // This is a simplified version - you may need to implement proper base64 conversion
      return `data:image/jpeg;base64,${photo.path}`;
    } catch (error) {
      console.error('Frame capture failed:', error);
      return null;
    }
  };
  const startVideoStreaming = () => {
    if (isStreaming || !wsConnected) return;

    setIsStreaming(true);
    const frameInterval = 1000 / DEFAULT_CONFIG.FRAME_RATE; // Convert FPS to milliseconds

    streamIntervalRef.current = setInterval(async () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const frame = await captureFrame();
        if (frame) {
          wsRef.current.send(frame);
        }
      }
    }, frameInterval);
  };

  const stopVideoStreaming = () => {
    setIsStreaming(false);
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
  };

  const handleCalibrate = async () => {
    try {
      const frame = await captureFrame();
      if (!frame) {
        Alert.alert('Error', 'Failed to capture calibration image');
        return;
      }

      const response = await fetch(calibrationApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: frame,
          timestamp: Date.now()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsCalibrated(true);
        Alert.alert('Success', 'Calibration completed successfully!');
      } else {
        Alert.alert('Calibration Failed', result.message || 'Please try again');
      }
    } catch (error) {
      console.error('Calibration error:', error);
      Alert.alert('Error', 'Failed to connect to calibration service');
    }
  };

  const handleRecalibrate = () => {
    setIsCalibrated(false);
    stopVideoStreaming();
    if (wsRef.current) {
      wsRef.current.close();
    }
  };
  const changeZoom = (newZoom: number) => {
    setZoomLevel(newZoom);
  };
  const toggleMode = () => {
    const newMode = mode === 1 ? 2 : 1;
    setMode(newMode);

    // Reset state when switching modes
    if (newMode === 1) {
      setIsCalibrated(false);
    }
    stopVideoStreaming();
  };

  const saveConfiguration = () => {
    setShowConfigModal(false);
    // Reconnect with new URL if currently connected
    if (wsConnected && wsRef.current) {
      wsRef.current.close();
    }
  };

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera not available</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {/* Configuration Modal */}
      <Modal
          visible={showConfigModal}
          animationType="slide"
          presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Configuration</Text>
            <TouchableOpacity onPress={() => setShowConfigModal(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.configForm}>
            <Text style={styles.configLabel}>WebSocket URL:</Text>
            <TextInput
                style={styles.configInput}
                value={websocketUrl}
                onChangeText={setWebsocketUrl}
                placeholder="ws://localhost:8080/ws/app"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
            />

            <Text style={styles.configLabel}>Calibration API URL:</Text>
            <TextInput
                style={styles.configInput}
                value={calibrationApi}
                onChangeText={setCalibrationApi}
                placeholder="https://your-api.com/calibrate"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
            />

            <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={saveConfiguration}
            >
              <Text style={styles.buttonText}>Save Configuration</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          zoom={zoomLevel}
          photo={true}
          enableZoomGesture={true}
        />

        {/* Status Overlay */}
        <View style={styles.statusOverlay}>
          <Text style={styles.statusText}>
            Mode: {mode === 1 ? 'Calibration' : 'Streaming'}
          </Text>
          {mode === 1 && (
            <Text style={styles.statusText}>
              Status: {isCalibrated ? 'Calibrated ✓' : 'Not Calibrated'}
            </Text>
          )}
          <Text style={styles.statusText}>
            WebSocket: {wsConnected ? 'Connected ✓' : 'Disconnected'}
          </Text>
          <Text style={styles.statusText}>
            Streaming: {isStreaming ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View> {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Settings Button */}
        <TouchableOpacity
            style={[styles.button, styles.settingsButton]}
            onPress={() => setShowConfigModal(true)}
        >
          <Text style={styles.buttonText}>⚙️ Settings</Text>
        </TouchableOpacity>

        {/* Mode Toggle */}
        <TouchableOpacity
          style={[styles.button, styles.toggleButton]}
          onPress={toggleMode}
        >
          <Text style={styles.buttonText}>
            Switch to {mode === 1 ? 'Streaming' : 'Calibration'} Mode
          </Text>
        </TouchableOpacity>

        {/* Zoom Controls */}
        <View style={styles.zoomContainer}>
          <Text style={styles.zoomLabel}>Zoom:</Text>
          {[1, 2, 3].map((zoom) => (
            <TouchableOpacity
              key={zoom}
              style={[
                styles.zoomButton,
                zoomLevel === zoom && styles.activeZoomButton
              ]}
              onPress={() => changeZoom(zoom)}
            >
              <Text style={[
                styles.zoomButtonText,
                zoomLevel === zoom && styles.activeZoomButtonText
              ]}>
                {zoom}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mode-specific Controls */}
        {mode === 1 ? (
          <View style={styles.calibrationControls}>
            {!isCalibrated ? (
              <TouchableOpacity
                style={[styles.button, styles.calibrateButton]}
                onPress={handleCalibrate}
              >
                <Text style={styles.buttonText}>Calibrate</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.recalibrateButton]}
                onPress={handleRecalibrate}
              >
                <Text style={styles.buttonText}>Recalibrate</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.streamingControls}>
            <TouchableOpacity
              style={[
                styles.button,
                isStreaming ? styles.stopButton : styles.startButton
              ]}
              onPress={isStreaming ? stopVideoStreaming : connectWebSocket}
            >
              <Text style={styles.buttonText}>
                {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  statusOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
  },
  controlsContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#666',
  },
  toggleButton: {
    backgroundColor: '#FF9500',
  },
  calibrateButton: {
    backgroundColor: '#34C759',
  },
  recalibrateButton: {
    backgroundColor: '#FF3B30',
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginTop: 20,
  },
  zoomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  zoomLabel: {
    color: '#fff',
    fontSize: 16,
    marginRight: 15,
  },
  zoomButton: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  activeZoomButton: {
    backgroundColor: '#007AFF',
  },
  zoomButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  activeZoomButtonText: {
    fontWeight: 'bold',
  },
  calibrationControls: {
    marginTop: 10,
  },
  streamingControls: {
    marginTop: 10,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  configForm: {
    padding: 20,
  },
  configLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  configInput: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
  },
});
