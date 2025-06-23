import React from 'react';
import {View} from 'react-native';
import ZoomCameraView from './ZoomCameraView';
import {GameViewStyles} from '../../styles/GameViewStyles';

export default function CameraSection() {


    return (
        <View style={GameViewStyles.cameraContainer}>
            <ZoomCameraView
            />
        </View>
    );
}
