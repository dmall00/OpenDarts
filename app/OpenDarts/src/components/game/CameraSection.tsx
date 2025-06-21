import React from 'react';
import {View} from 'react-native';
import ZoomCameraView from './ZoomCameraView';
import {GameViewStyles} from '../../styles/GameViewStyles';

interface CameraSectionProps {
    isCameraExpanded: boolean;
    onToggleCamera: () => void;
}

export default function CameraSection({isCameraExpanded, onToggleCamera}: CameraSectionProps) {
    return (
        <View style={GameViewStyles.cameraContainer}>
            {isCameraExpanded ? (
                <ZoomCameraView
                    isExpanded={isCameraExpanded}
                    onToggleExpand={onToggleCamera}
                />
            ) : (
                <ZoomCameraView
                    isExpanded={isCameraExpanded}
                    onToggleExpand={onToggleCamera}
                />
            )}
        </View>
    );
}
