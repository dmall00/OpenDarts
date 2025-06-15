import React, {useEffect, useRef, useState} from 'react';
import {Alert, Dimensions, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import ImageResizer from '@bam.tech/react-native-image-resizer';

const { width, height } = Dimensions.get('window');

// Configuration - Update these URLs for your backend
const DEFAULT_CONFIG = {
  DEFAULT_WEBSOCKET_URL: 'ws://192.168.178.34:8080/ws/app',
  FRAME_RATE: 1, // 1 FPS (1 frame per second)
  IMAGE_QUALITY: 0.3, // Heavy compression: 30% quality
  MAX_IMAGE_WIDTH: 640, // Resize to max 640px width
  MAX_IMAGE_HEIGHT: 480, // Resize to max 480px height
};

export default function DartScoringApp() {
  // State management
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isStreaming, setIsStreaming] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);  const [websocketUrl, setWebsocketUrl] = useState(DEFAULT_CONFIG.DEFAULT_WEBSOCKET_URL);
  const [frameRate, setFrameRate] = useState(DEFAULT_CONFIG.FRAME_RATE);
  const [imageQuality, setImageQuality] = useState(DEFAULT_CONFIG.IMAGE_QUALITY);
  const [maxImageWidth, setMaxImageWidth] = useState(DEFAULT_CONFIG.MAX_IMAGE_WIDTH);
  const [maxImageHeight, setMaxImageHeight] = useState(DEFAULT_CONFIG.MAX_IMAGE_HEIGHT);
  const [aspectRatioLocked, setAspectRatioLocked] = useState(true);
  const [resizeMode, setResizeMode] = useState<'contain' | 'cover' | 'stretch'>('cover');
  // Refs
  const cameraRef = useRef<Camera>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Camera device
  const device = useCameraDevice('back');
  // WebSocket connection
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    // Clear any existing timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    // Show connecting feedback
    console.log('Attempting to connect to WebSocket...');

    try {
      wsRef.current = new WebSocket(websocketUrl);

      // Set connection timeout (10 seconds)
      connectionTimeoutRef.current = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
          Alert.alert(
              'Connection Timeout',
              `Failed to connect to ${websocketUrl} within 10 seconds. Please check the server is running and the URL is correct.`
          );
        }
      }, 10000);      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        setWsConnected(true);
        // Don't automatically start streaming - let user control this
      };

      wsRef.current.onmessage = (event: any) => {
        console.log('WebSocket message:', event.data);
      };

      wsRef.current.onerror = (error: any) => {
        console.error('WebSocket error:', error);
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        setWsConnected(false);
        setIsStreaming(false);
        Alert.alert(
            'Connection Error',
            `Failed to connect to streaming server at ${websocketUrl}. Please check the URL and try again.`
        );
      };      wsRef.current.onclose = (event: any) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        setWsConnected(false);
        setIsStreaming(false);
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }

        // Provide more specific disconnect reasons
        if (event.code !== 1000) {
          let reason = 'Connection to streaming server lost';
          switch (event.code) {
            case 1001:
              reason = 'Server is going away';
              break;
            case 1002:
              reason = 'Protocol error';
              break;
            case 1003:
              reason = 'Server received unsupported data';
              break;
            case 1006:
              reason = 'Connection closed abnormally (check server logs)';
              break;
            case 1009:
              reason = 'Message too large for server';
              break;
            case 1011:
              reason = 'Server encountered an unexpected condition';
              break;
            default:
              reason = `Connection lost (code: ${event.code})`;
          }

          console.error('WebSocket closed with code:', event.code, 'reason:', event.reason);
          Alert.alert('Disconnected', reason);
        }
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      setWsConnected(false);
      setIsStreaming(false);
      Alert.alert(
          'Connection Error',
          'Failed to create WebSocket connection. Please check your network and try again.'
      );
    }
  };const captureFrame = async (): Promise<Uint8Array | null> => {
    if (!cameraRef.current) return null;

    try {      const photo = await cameraRef.current.takePhoto({
      enableAutoRedEyeReduction: false,
    });      // Compress and resize the image before sending
      const compressedImage = await ImageResizer.createResizedImage(
          photo.path,
          maxImageWidth,
          maxImageHeight,
          'JPEG',
          Math.round(imageQuality * 100), // Convert to 0-100 scale
          0, // rotation
          undefined, // outputPath
          false, // keep metadata
          {
            mode: resizeMode, // Use the selected resize mode
            onlyScaleDown: false, // Allow scaling up if needed
          }
      );// For React Native, read the compressed file as base64 and convert to binary
      const response = await fetch(`file://${compressedImage.uri}`);

      // Check if the response is ok
      if (!response.ok) {
        throw new Error(`Failed to read compressed image file: ${response.status}`);
      }

      // Get the response as an ArrayBuffer (this should work in newer RN versions)
      let arrayBuffer;
      try {
        arrayBuffer = await response.arrayBuffer();
        const frameData = new Uint8Array(arrayBuffer);

        // Log compression results
        console.log(`Original path: ${photo.path}`);
        console.log(`Compressed path: ${compressedImage.uri}`);
        console.log(`Compressed size: ${frameData.length} bytes`);
        console.log(`Image dimensions: ${compressedImage.width}x${compressedImage.height}`);

        // Check if the frame is still too large (limit to 1MB to prevent WebSocket issues)
        if (frameData.length > 1024 * 1024) {
          console.warn(`Compressed frame size is still large: ${frameData.length} bytes. Consider reducing quality further.`);
        }

        return frameData;
      } catch (arrayBufferError) {
        // Fallback: read as base64 and convert
        console.log('ArrayBuffer not available, using base64 fallback');

        // Alternative approach: Use XMLHttpRequest for binary data
        return new Promise<Uint8Array>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', `file://${compressedImage.uri}`, true);
          xhr.responseType = 'arraybuffer';

          xhr.onload = function() {
            if (xhr.status === 200) {
              const frameData = new Uint8Array(xhr.response);

              // Log compression results
              console.log(`Compressed size (fallback): ${frameData.length} bytes`);

              // Check if the frame is too large
              if (frameData.length > 1024 * 1024) {
                console.warn(`Compressed frame size is still large: ${frameData.length} bytes. Consider reducing quality further.`);
              }

              resolve(frameData);
            } else {
              reject(new Error(`Failed to load compressed image: ${xhr.status}`));
            }
          };

          xhr.onerror = function() {
            reject(new Error('Network error while loading compressed image'));
          };

          xhr.send();
        });
      }
    } catch (error) {
      console.error('Frame capture failed:', error);
      return null;
    }
  };const startVideoStreaming = () => {
    if (isStreaming || !wsConnected) return;

    console.log('Starting video streaming...');
    setIsStreaming(true);
    const frameInterval = 1000 / frameRate; // Convert FPS to milliseconds

    streamIntervalRef.current = setInterval(async () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {        try {
        const frame = await captureFrame();
        if (frame) {
          console.log(`Sending frame of size: ${frame.length} bytes`);
          // Check WebSocket state before sending
          if (wsRef.current.readyState === WebSocket.OPEN) {
            try {
              wsRef.current.send(frame);
            } catch (sendError) {
              console.error('Error sending frame:', sendError);
              // If we can't send, the connection might be broken
              console.log('WebSocket send failed, stopping streaming');
              stopVideoStreaming();
            }
          } else {
            console.log('WebSocket not open during send, stopping streaming');
            stopVideoStreaming();
          }
        } else {
          console.log('No frame captured, skipping...');
        }
      } catch (error) {
        console.error('Error during frame capture/send:', error);
        // Don't stop streaming for individual frame errors, but limit retries
      }
      } else {
        console.log('WebSocket not open, stopping streaming. State:', wsRef.current?.readyState);
        // Stop streaming if WebSocket is not open
        stopVideoStreaming();
      }
    }, frameInterval);
  };

  const stopVideoStreaming = () => {
    setIsStreaming(false);
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
  };  const changeZoom = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  // Helper function to maintain aspect ratio
  const updateImageWidth = (newWidth: number) => {
    if (!isNaN(newWidth) && newWidth >= 240 && newWidth <= 1920) {
      setMaxImageWidth(newWidth);
      if (aspectRatioLocked) {
        // Maintain 4:3 aspect ratio (common for camera feeds)
        const newHeight = Math.round((newWidth * 3) / 4);
        if (newHeight >= 180 && newHeight <= 1080) {
          setMaxImageHeight(newHeight);
        }
      }
    }
  };

  const updateImageHeight = (newHeight: number) => {
    if (!isNaN(newHeight) && newHeight >= 180 && newHeight <= 1080) {
      setMaxImageHeight(newHeight);
      if (aspectRatioLocked) {
        // Maintain 4:3 aspect ratio
        const newWidth = Math.round((newHeight * 4) / 3);
        if (newWidth >= 240 && newWidth <= 1920) {
          setMaxImageWidth(newWidth);
        }
      }
    }
  };

  // Preset image sizes
  const applyImagePreset = (preset: string) => {
    switch (preset) {
      case 'low':
        setMaxImageWidth(320);
        setMaxImageHeight(240);
        break;
      case 'medium':
        setMaxImageWidth(640);
        setMaxImageHeight(480);
        break;
      case 'high':
        setMaxImageWidth(1280);
        setMaxImageHeight(720);
        break;
      case 'ultra':
        setMaxImageWidth(1920);
        setMaxImageHeight(1080);
        break;
    }
  };
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected'); // 1000 = normal closure
    }
    stopVideoStreaming();
    setWsConnected(false);
    console.log('Manually disconnected from WebSocket');
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

            <View style={styles.configForm}>            <Text style={styles.configLabel}>WebSocket URL:</Text>
              <TextInput
                  style={styles.configInput}
                  value={websocketUrl}
                  onChangeText={setWebsocketUrl}
                  placeholder="ws://localhost:8080/ws/app"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  autoCorrect={false}
              />

              <Text style={styles.configLabel}>Frame Rate (FPS):</Text>
              <TextInput
                  style={styles.configInput}
                  value={frameRate.toString()}
                  onChangeText={(text) => {
                    const fps = parseFloat(text);
                    if (!isNaN(fps) && fps > 0 && fps <= 30) {
                      setFrameRate(fps);
                    }
                  }}
                  placeholder="1"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
              />            <Text style={styles.configHint}>
                Recommended: 1-5 FPS for better performance and battery life
              </Text>

              <Text style={styles.configLabel}>Image Quality (0.1-1.0):</Text>
              <TextInput
                  style={styles.configInput}
                  value={imageQuality.toString()}
                  onChangeText={(text) => {
                    const quality = parseFloat(text);
                    if (!isNaN(quality) && quality >= 0.1 && quality <= 1.0) {
                      setImageQuality(quality);
                    }
                  }}
                  placeholder="0.3"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
              /> <Text style={styles.configHint}>
                Lower values = smaller file size, higher compression (0.3 = 30% quality)
              </Text>

              <Text style={styles.configLabel}>Image Size Presets:</Text>
              <View style={styles.presetContainer}>
                <TouchableOpacity
                    style={[styles.presetButton,
                      maxImageWidth === 320 && maxImageHeight === 240 && styles.activePresetButton]}
                    onPress={() => applyImagePreset('low')}
                >
                  <Text style={styles.presetButtonText}>Low (320x240)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.presetButton,
                      maxImageWidth === 640 && maxImageHeight === 480 && styles.activePresetButton]}
                    onPress={() => applyImagePreset('medium')}
                >
                  <Text style={styles.presetButtonText}>Medium (640x480)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.presetButton,
                      maxImageWidth === 1280 && maxImageHeight === 720 && styles.activePresetButton]}
                    onPress={() => applyImagePreset('high')}
                >
                  <Text style={styles.presetButtonText}>High (1280x720)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.presetButton,
                      maxImageWidth === 1920 && maxImageHeight === 1080 && styles.activePresetButton]}
                    onPress={() => applyImagePreset('ultra')}
                >
                  <Text style={styles.presetButtonText}>Ultra (1920x1080)</Text>
                </TouchableOpacity> </View>

              <Text style={styles.configLabel}>Resize Mode:</Text>
              <View style={styles.resizeModeContainer}>
                <TouchableOpacity
                    style={[styles.resizeModeButton, resizeMode === 'cover' && styles.activeResizeModeButton]}
                    onPress={() => setResizeMode('cover')}
                >
                  <Text style={styles.resizeModeButtonText}>Cover</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.resizeModeButton, resizeMode === 'contain' && styles.activeResizeModeButton]}
                    onPress={() => setResizeMode('contain')}
                >
                  <Text style={styles.resizeModeButtonText}>Contain</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.resizeModeButton, resizeMode === 'stretch' && styles.activeResizeModeButton]}
                    onPress={() => setResizeMode('stretch')}
                >
                  <Text style={styles.resizeModeButtonText}>Stretch</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.configHint}>
                Cover: Crop to fit exactly | Contain: Fit within bounds | Stretch: Distort to exact size
              </Text>

              <View style={styles.aspectRatioContainer}>
                <Text style={styles.configLabel}>Lock Aspect Ratio (4:3):</Text>
                <TouchableOpacity
                    style={[styles.toggleButton, aspectRatioLocked && styles.activeToggleButton]}
                    onPress={() => setAspectRatioLocked(!aspectRatioLocked)}
                >
                  <Text style={styles.toggleButtonText}>
                    {aspectRatioLocked ? '✓ Locked' : '✗ Unlocked'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.configLabel}>Image Width (pixels):</Text>
              <TextInput
                  style={styles.configInput}
                  value={maxImageWidth.toString()}
                  onChangeText={(text) => {
                    const width = parseInt(text);
                    updateImageWidth(width);
                  }}
                  placeholder="640"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
              />

              <Text style={styles.configLabel}>Image Height (pixels):</Text>
              <TextInput
                  style={styles.configInput}
                  value={maxImageHeight.toString()}
                  onChangeText={(text) => {
                    const height = parseInt(text);
                    updateImageHeight(height);
                  }}
                  placeholder="480"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
              />
              <Text style={styles.configHint}>
                Current aspect ratio: {(maxImageWidth / maxImageHeight).toFixed(2)}:1
              </Text>
              <Text style={styles.configHint}>
                Estimated file size: ~{Math.round((maxImageWidth * maxImageHeight * imageQuality * 0.5) / 1024)}KB per
                frame
              </Text>

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
          />        {/* Status Overlay */}
          <View style={styles.statusOverlay}>
            <Text style={styles.statusText}>
              Dart Streaming App
            </Text>
            <Text style={[styles.statusText, wsConnected ? styles.connectedText : styles.disconnectedText]}>
              WebSocket: {wsConnected ? 'Connected ✓' : 'Disconnected ✗'}
            </Text>
            <Text style={styles.statusText}>
              Server: {websocketUrl.replace('ws://', '').replace('wss://', '')}
            </Text>
            <Text style={styles.statusText}>
              Streaming: {isStreaming ? 'Active' : 'Inactive'}
            </Text>          <Text style={styles.statusText}>
            Frame Rate: {frameRate} FPS
          </Text> <Text style={styles.statusText}>
            Quality: {Math.round(imageQuality * 100)}% | Size: {maxImageWidth}x{maxImageHeight}
          </Text>
            <Text style={styles.statusText}>
              Mode: {resizeMode} | Ratio: {aspectRatioLocked ? 'Locked' : 'Free'}
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
          </TouchableOpacity>        {/* Connection Toggle */}
          <TouchableOpacity
              style={[
                styles.button,
                wsConnected ? styles.disconnectButton : styles.connectButton
              ]}
              onPress={wsConnected ? disconnectWebSocket : connectWebSocket}
          >
            <Text style={styles.buttonText}>
              {wsConnected ? 'Disconnect' : 'Connect'}
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
          </View>        {/* Streaming Controls */}
          <View style={styles.streamingControls}>
            <TouchableOpacity
                style={[
                  styles.button,
                  !wsConnected ? styles.disabledButton :
                      (isStreaming ? styles.stopButton : styles.startButton)
                ]}
                onPress={wsConnected ? (isStreaming ? stopVideoStreaming : startVideoStreaming) : undefined}
                disabled={!wsConnected}
            >
              <Text style={styles.buttonText}>
                {!wsConnected ? 'Connect First' :
                    (isStreaming ? 'Stop Streaming' : 'Start Streaming')}
              </Text>
            </TouchableOpacity>
          </View>
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
  },  statusText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
  },
  connectedText: {
    color: '#34C759',
  },
  disconnectedText: {
    color: '#FF3B30',
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
  },  settingsButton: {
    backgroundColor: '#666',
  },  connectButton: {
    backgroundColor: '#34C759',
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  toggleButton: {
    backgroundColor: '#FF9500',
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
  },  activeZoomButtonText: {
    fontWeight: 'bold',
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
  },  configInput: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
  }, configHint: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  // Preset button styles
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
    gap: 8,
  },
  presetButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    minWidth: '45%',
    marginHorizontal: 2,
  },
  activePresetButton: {
    backgroundColor: '#007AFF',
  },
  presetButtonText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Aspect ratio control styles
  aspectRatioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  activeToggleButton: {
    backgroundColor: '#34C759',
  }, toggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Resize mode control styles
  resizeModeContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    gap: 8,
  },
  resizeModeButton: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
  },
  activeResizeModeButton: {
    backgroundColor: '#007AFF',
  },
  resizeModeButtonText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
