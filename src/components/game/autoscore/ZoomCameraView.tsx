import {Camera, useCameraDevice, useCameraPermission} from "react-native-vision-camera";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {Animated, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import Slider from "@react-native-community/slider";
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
        <View style={[
            isVisible ? {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                borderRadius: 0,
                overflow: 'hidden',
                backgroundColor: 'black',
                zIndex: 1000,
            } : styles.hiddenCamera,
            {zIndex: isVisible ? 1000 : -1}
        ]}>
            <TouchableOpacity
                className="flex-1"
                style={{backgroundColor: 'black'}}
                onPress={isVisible ? onClose : undefined}
                activeOpacity={isVisible ? 1 : 0}
                disabled={!isVisible}
            >
                <Camera
                    ref={handleCameraRef}
                    style={{flex: 1}}
                    device={device}
                    isActive={true}
                    photo={true}
                    zoom={zoom}
                />
                {isVisible && <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/5"/>}
                {isVisible && (
                    <View
                        className="absolute top-3 right-3 bg-slate-800 p-2 rounded-full min-w-[32px] min-h-[32px] items-center justify-center z-10">
                        <Text className="text-white text-sm font-bold text-center">×</Text>
                    </View>
                )}
            </TouchableOpacity>
            {isVisible && (
                <Animated.View
                    style={[
                        {
                            flexDirection: 'column',
                            position: 'absolute',
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            borderRadius: 16,
                            padding: 12,
                            shadowColor: '#000',
                            shadowOffset: {
                                width: 0,
                                height: 2,
                            },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 4,
                            alignItems: 'center',
                            minWidth: 200,
                            maxWidth: 220,
                            left: '50%',
                            marginLeft: -110,
                        },
                        {
                            opacity: scale,
                            bottom: sliderBottomPosition,
                            transform: [{
                                translateY: scale.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                })
                            }]
                        }
                    ]}
                >
                    <Slider
                        style={{width: 180, height: 40}}
                        minimumValue={minZoom}
                        maximumValue={maxZoom}
                        value={zoom}
                        onValueChange={handleZoom}
                        minimumTrackTintColor="#10b981"
                        maximumTrackTintColor="#e5e7eb"
                        thumbTintColor="#10b981"
                    />
                    <Text className="text-slate-700 text-sm font-semibold text-center mt-1">
                        {`${Math.round(zoom * 10) / 10}x`}
                    </Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    hiddenCamera: {
        position: 'absolute',
        top: -1000,
        left: -1000,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none',
    },
});
