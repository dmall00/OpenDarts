import React, {useState} from "react";
import {View} from "react-native";
import ZoomCameraView from "./ZoomCameraView";
import {GameViewStyles} from "../../styles/GameViewStyles";

interface GameViewProps {
    gameId: string;
}

export default function GameView({gameId}: GameViewProps) {
    const [isCameraExpanded, setIsCameraExpanded] = useState(false);

    const handleToggleCamera = () => {
        setIsCameraExpanded(!isCameraExpanded);
    };
    return (
        <View style={GameViewStyles.container}>
            <View style={GameViewStyles.cameraContainer}>
                {isCameraExpanded && (
                    <ZoomCameraView
                        isExpanded={isCameraExpanded}
                        onToggleExpand={handleToggleCamera}
                    />
                )}
            </View>

            {!isCameraExpanded && (
                <ZoomCameraView
                    isExpanded={isCameraExpanded}
                    onToggleExpand={handleToggleCamera}
                />
            )}
        </View>
    );
}
