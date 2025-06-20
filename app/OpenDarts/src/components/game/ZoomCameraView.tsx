import {Camera, useCameraDevice, useCameraPermission} from "react-native-vision-camera";
import React, {useEffect, useRef, useState} from "react";
import {Text, TouchableOpacity, View} from "react-native";
import Slider from "@react-native-community/slider";
import {GameViewStyles} from "../../styles/GameViewStyles";
import {CameraService} from "../../services/camera/cameraService";

interface ZoomCameraViewProps {
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

export default function ZoomCameraView({isExpanded = false, onToggleExpand}: ZoomCameraViewProps) {
    const {hasPermission, requestPermission} = useCameraPermission();
    const [zoom, setZoom] = useState(0);
    const cameraRef = useRef<Camera>(null);
    const device = useCameraDevice('back');
    const cameraService = CameraService.getInstance();
    useEffect(() => {
        console.log('ZoomCameraView mounted, setting camera ref...');
        if (cameraRef.current && device) {
            console.log('Camera ref is available, setting in service');
            cameraService.setCameraRef(cameraRef.current);
            cameraService.setDevice(device);
        } else {
            console.log('Camera ref not yet available');
        }
    }, [cameraService, device]);

    useEffect(() => {
        if (cameraRef.current && device) {
            console.log('Camera ref updated, setting in service');
            cameraService.setCameraRef(cameraRef.current);
            cameraService.setDevice(device);
        }
    });

    if (hasPermission === null) {
        return <View/>;
    }

    if (!hasPermission) {
        return (
            <View style={GameViewStyles.permissionContainer}>
                <Text style={GameViewStyles.permissionMessage}>
                    We need your permission to show the camera
                </Text>
                <TouchableOpacity
                    style={GameViewStyles.permissionButton}
                    onPress={requestPermission}
                >
                    <Text style={GameViewStyles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity> </View>
        );
    }
    const handleZoom = (zoomLevel: number) => {
        setZoom(zoomLevel);
    };

    const cameraStyle = isExpanded ? GameViewStyles.expandedCamera : GameViewStyles.compactCameraPressable;

    if (!device) {
        return (
            <View style={GameViewStyles.permissionContainer}>
                <Text style={GameViewStyles.permissionMessage}>
                    No camera device found
                </Text>
            </View>
        );
    }

    if (!isExpanded) {
        return (
            <TouchableOpacity style={cameraStyle} onPress={onToggleExpand}>
                <Camera
                    ref={cameraRef}
                    style={GameViewStyles.camera}
                    device={device}
                    isActive={true}
                    photo={true}
                    zoom={zoom}
                />
                <View style={GameViewStyles.cameraOverlay}/>
            </TouchableOpacity>
        );
    }
    return (
        <View style={cameraStyle}> <TouchableOpacity
                style={GameViewStyles.camera}
                onPress={onToggleExpand}
                activeOpacity={1}
        >
            <Camera
                ref={cameraRef}
                    style={GameViewStyles.camera}
                device={device}
                isActive={true}
                photo={true}
                    zoom={zoom}
            />
            <View style={GameViewStyles.cameraOverlay}/>
            </TouchableOpacity>

            <View style={GameViewStyles.zoomContainer}>
                <Slider
                    style={GameViewStyles.zoomSlider}
                    minimumValue={0}
                    maximumValue={1}
                    value={zoom}
                    onValueChange={handleZoom}
                    minimumTrackTintColor="#10b981"
                    maximumTrackTintColor="#e5e7eb"
                    thumbTintColor="#10b981"
                />
                <Text style={GameViewStyles.zoomText}>
                    {`${Math.round((zoom * 3 + 1) * 10) / 10}x`}
                </Text>
            </View>
        </View>
    );
}

