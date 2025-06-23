import {useState} from 'react';

export const useCameraUI = () => {
    const [isCameraExpanded, setIsCameraExpanded] = useState(true);

    const handleToggleCamera = () => {
        setIsCameraExpanded(!isCameraExpanded);
    };

    return {
        isCameraExpanded,
        handleToggleCamera
    };
};
