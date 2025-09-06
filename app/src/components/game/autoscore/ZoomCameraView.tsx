import {Camera, useCameraDevice, useCameraPermission} from "react-native-vision-camera";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {Animated, Text, TouchableOpacity, View} from "react-native";
import {CameraService} from "@/src/services/camera/cameraService";
import Button from "@/src/components/ui/Button";
import Typography from "@/src/components/ui/Typography";

interface ZoomCameraViewProps {
    onClose?: () => void;
    isVisible?: boolean;
}

export default function ZoomCameraView({onClose, isVisible = true}: ZoomCameraViewProps) {
    const {hasPermission, requestPermission} = useCameraPermission();
    const [zoom, setZoom] = useState(1);
    const cameraRef = useRef<Camera | null>(null);
    const device = useCameraDevice('back');
    const cameraService = CameraService.getInstance();

    const scale = useRef(new Animated.Value(1)).current;

    const sliderBottomPosition = 80;

    const minZoom = 1;
    const maxZoom = 3;
    const neutralZoom = 1;

    useEffect(() => {
        setZoom(neutralZoom);
    }, [device]);

    useEffect(() => {
        if (cameraRef.current && device) {
            cameraService.setCameraRef(cameraRef.current);
            cameraService.setDevice(device);
        }

        return () => {
            if (!device) {
                cameraService.setCameraRef(null);
            }
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
        }
    }, [scale, isVisible]);

    useEffect(() => {
        return () => {
            cameraService.setCameraRef(null);
        };
    }, [cameraService]);

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
                    No camera device found
                </Typography>
            </View>
        );
    }

    const handleCameraRef = useCallback((ref: Camera | null) => {
        cameraRef.current = ref;
        if (ref && device) {
            cameraService.setCameraRef(ref);
            cameraService.setDevice(device);
        }
    }, [cameraService, device]);

    const handleZoom = (zoomLevel: number) => {
        const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel));
        setZoom(clampedZoom);
    };



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
                    className="flex-1"
                    device={device}
                    isActive={true}
                    photo={true}
                    zoom={zoom}
                />
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
                        className="flex-row bg-white/95 rounded-2xl p-md shadow-md items-center min-w-[180px] justify-between"
                        style={{
                            opacity: scale,
                            transform: [{
                                translateY: scale.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                })
                            }],
                            shadowColor: '#000',
                            shadowOffset: {width: 0, height: 2},
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 4,
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
