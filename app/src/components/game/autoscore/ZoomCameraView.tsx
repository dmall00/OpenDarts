import {Camera, useCameraDevice, useCameraFormat, useCameraPermission} from "react-native-vision-camera";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {Animated, Text, TouchableOpacity, View} from "react-native";
import {CameraService} from "@/src/services/camera/cameraService";
import Button from "@/src/components/ui/Button";
import Typography from "@/src/components/ui/Typography";
import {getCameraConfig} from "@/src/config/config";
import {useSettingsStore} from "@/src/stores/settingsStore";

interface ZoomCameraViewProps {
    onClose?: () => void;
    isVisible?: boolean;
}

export default function ZoomCameraView({onClose, isVisible = true}: ZoomCameraViewProps) {
    const {hasPermission, requestPermission} = useCameraPermission();
    const cameraDefaultZoom = useSettingsStore(state => state.cameraDefaultZoom);
    const [zoom, setZoom] = useState(1);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const hasAppliedInitialZoom = useRef(false);
    const cameraRef = useRef<Camera | null>(null);
    const device = useCameraDevice('back');
    const cameraConfig = getCameraConfig();
    const format = useCameraFormat(device, [
        {videoResolution: {width: cameraConfig.MAX_WIDTH, height: cameraConfig.MAX_HEIGHT}},
        { fps: 30 }
    ]) ?? device?.formats?.[0];
    const cameraService = CameraService.getInstance();

    const scale = useRef(new Animated.Value(1)).current;

    const sliderBottomPosition = 80;

    const minZoom = 1;
    const maxZoom = 3;
    const neutralZoom = cameraDefaultZoom;

    useEffect(() => {
        setZoom(cameraDefaultZoom);
        setIsCameraReady(false);
        hasAppliedInitialZoom.current = false;
    }, [device]);


    useEffect(() => {
        if (cameraRef.current && device) {
            cameraService.setCameraRef(cameraRef.current);
            cameraService.setDevice(device);
        }

        return () => {
            // Only clean up when the component unmounts or device changes
            // Don't clear on visibility change
            cameraService.setCameraRef(null);
        };
    }, [cameraService, device]);

    useEffect(() => {
        if (isVisible) {
            Animated.timing(scale, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }).start();
        } else {
            scale.setValue(0);
            // Don't set isCameraReady to false when minimized - keep camera active
        }
    }, [scale, isVisible]);

    useEffect(() => {
        return () => {
            cameraService.setCameraRef(null);
        };
    }, [cameraService]);

    const handleCameraRef = useCallback((ref: Camera | null) => {
        cameraRef.current = ref;
        if (ref && device && format) {
            cameraService.setCameraRef(ref);
            cameraService.setDevice(device);
        } else {
            setIsCameraReady(false);
        }
    }, [cameraService, device, format]);

    const handleZoom = (zoomLevel: number) => {
        const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel));
        console.log('handleZoom called with:', zoomLevel, 'clamped to:', clampedZoom);
        setZoom(clampedZoom);
    };

    if (hasPermission === null) {
        return <View/>;
    }

    if (!hasPermission) {
        return (
            <View className="flex-1 justify-center items-center bg-white rounded-xl m-0 p-xl">
                <Typography variant="body" className="text-center mb-lg">
                    We need your permission to show the camera
                </Typography>
                <Button 
                    title="Grant Permission"
                    onPress={requestPermission}
                    size="large"
                />
            </View>
        );
    }

    if (!device) {
        return (
            <View className="flex-1 justify-center items-center bg-white rounded-xl m-0 p-xl">
                <Typography variant="body" className="text-center mb-lg">
                    No camera device found. Please ensure your device has a rear camera.
                </Typography>
                <Button 
                    title="Try Again"
                    onPress={() => {
                        setZoom(neutralZoom);
                    }}
                    size="large"
                />
            </View>
        );
    }

    if (!format) {
        return (
            <View className="flex-1 justify-center items-center bg-white rounded-xl m-0 p-xl">
                <Typography variant="body" className="text-center mb-lg">
                    No suitable camera format found. Your device may not support the required camera formats.
                </Typography>
                <Button 
                    title="Try Again"
                    onPress={() => {
                        setZoom(neutralZoom);
                    }}
                    size="large"
                />
            </View>
        );
    }

    return (
        <View className={
            isVisible 
                ? "absolute inset-0 w-full h-full overflow-hidden bg-black z-[1000]"
                : "absolute -top-[1000px] -left-[1000px] w-1 h-1 opacity-0"
        } style={{
            pointerEvents: isVisible ? 'auto' : 'none',
            zIndex: isVisible ? 1000 : -1
        }}>
            <TouchableOpacity
                className="flex-1 bg-transparent"
                onPress={isVisible ? onClose : undefined}
                activeOpacity={isVisible ? 1 : 0}
                disabled={!isVisible}
            >
                <Camera
                    ref={handleCameraRef}
                    style={{flex: 1}}
                    device={device}
                    format={format}
                    isActive={true}
                    photo={true}
                    video={false}
                    zoom={zoom}
                    enableZoomGesture={false}
                    resizeMode="contain"
                    onError={(error) => {
                        setIsCameraReady(false);
                    }}
                    onInitialized={() => {
                        console.log('Camera initialized');
                        setTimeout(() => {
                            setIsCameraReady(true);
                        }, 100);
                    }}
                />
                {isVisible && !isCameraReady && (
                    <View className="absolute inset-0 bg-black items-center justify-center">
                        <Typography variant="body" className="text-white">
                            Initializing camera...
                        </Typography>
                    </View>
                )}
                {isVisible && <View className="absolute inset-0 bg-black/5"/>}
                {isVisible && (
                    <View className="absolute top-md right-md bg-slate-800 p-sm rounded-full min-w-8 min-h-8 items-center justify-center z-10">
                        <Text className="text-white text-sm font-bold text-center">×</Text>
                    </View>
                )}
            </TouchableOpacity>
            {isVisible && (
                <View className="absolute inset-x-0 items-center z-[1001]" style={{bottom: sliderBottomPosition}}>
                    <Animated.View
                        className="flex-row bg-white/95 rounded-2xl p-md items-center min-w-[180px] justify-between shadow-lg"
                        style={{
                            opacity: scale,
                            transform: [{
                                translateY: scale.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                })
                            }],
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => handleZoom(zoom - 0.1)}
                            disabled={zoom <= minZoom}
                            className={`rounded-full w-10 h-10 items-center justify-center ${
                                zoom <= minZoom ? 'bg-slate-200' : 'bg-emerald-500'
                            }`}
                        >
                            <Text className={`text-xl font-bold ${
                                zoom <= minZoom ? 'text-slate-400' : 'text-white'
                            }`}>-</Text>
                        </TouchableOpacity>
                        
                        <Text className="text-slate-700 text-lg font-semibold text-center mx-base">
                            {`${Math.round(zoom * 10) / 10}x`}
                        </Text>
                        
                        <TouchableOpacity
                            onPress={() => handleZoom(zoom + 0.1)}
                            disabled={zoom >= maxZoom}
                            className={`rounded-full w-10 h-10 items-center justify-center ${
                                zoom >= maxZoom ? 'bg-slate-200' : 'bg-emerald-500'
                            }`}
                        >
                            <Text className={`text-xl font-bold ${
                                zoom >= maxZoom ? 'text-slate-400' : 'text-white'
                            }`}>+</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}
        </View>
    );
}
