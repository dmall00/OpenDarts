import {CameraView, useCameraPermissions} from "expo-camera";
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
    const [permission, requestPermission] = useCameraPermissions();
    const [zoom, setZoom] = useState(0);
    const cameraRef = useRef<CameraView>(null);
    const cameraService = CameraService.getInstance();
    useEffect(() => {
        console.log('ZoomCameraView mounted, setting camera ref...');
        if (cameraRef.current) {
            console.log('Camera ref is available, setting in service');
            cameraService.setCameraRef(cameraRef.current);
        } else {
            console.log('Camera ref not yet available');
        }
    }, [cameraService]);

    useEffect(() => {
        // Also try to set the ref whenever the component re-renders
        if (cameraRef.current) {
            console.log('Camera ref updated, setting in service');
            cameraService.setCameraRef(cameraRef.current);
        }
    });

    if (!permission) {
        return <View/>;
    }

    if (!permission.granted) {
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

    if (!isExpanded) {
        return (
            <TouchableOpacity style={cameraStyle} onPress={onToggleExpand}>
                <CameraView
                    ref={cameraRef}
                    style={GameViewStyles.camera}
                    facing="back"
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
            <CameraView
                ref={cameraRef}
                    style={GameViewStyles.camera}
                    facing="back"
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

