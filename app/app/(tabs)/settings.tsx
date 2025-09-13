import React, {useEffect, useState} from 'react';
import {Switch, TextInput, View} from 'react-native';
import PageLayout from '@/src/components/ui/PageLayout';
import Typography from '@/src/components/ui/Typography';
import Card from '@/src/components/ui/Card';
import Button from '@/src/components/ui/Button';
import {DEFAULT_SERVER_URL, useSettingsStore} from '@/src/stores/settingsStore';

export default function Settings() {
    const serverUrl = useSettingsStore(state => state.serverUrl);
    const setServerUrl = useSettingsStore(state => state.setServerUrl);
    const loadSettings = useSettingsStore(state => state.loadSettings);

    const cameraQuality = useSettingsStore(state => state.cameraQuality);
    const cameraSkipProcessing = useSettingsStore(state => state.cameraSkipProcessing);
    const cameraMaxWidth = useSettingsStore(state => state.cameraMaxWidth);
    const cameraMaxHeight = useSettingsStore(state => state.cameraMaxHeight);
    const cameraFps = useSettingsStore(state => state.cameraFps);
    const cameraDefaultZoom = useSettingsStore(state => state.cameraDefaultZoom);

    const setCameraQuality = useSettingsStore(state => state.setCameraQuality);
    const setCameraSkipProcessing = useSettingsStore(state => state.setCameraSkipProcessing);
    const setCameraMaxWidth = useSettingsStore(state => state.setCameraMaxWidth);
    const setCameraMaxHeight = useSettingsStore(state => state.setCameraMaxHeight);
    const setCameraFps = useSettingsStore(state => state.setCameraFps);
    const setCameraDefaultZoom = useSettingsStore(state => state.setCameraDefaultZoom);
    const resetCameraSettings = useSettingsStore(state => state.resetCameraSettings);
    
    const [localServerUrl, setLocalServerUrl] = useState(serverUrl);
    const [localCameraQuality, setLocalCameraQuality] = useState(cameraQuality.toString());
    const [localCameraSkipProcessing, setLocalCameraSkipProcessing] = useState(cameraSkipProcessing);
    const [localCameraMaxWidth, setLocalCameraMaxWidth] = useState(cameraMaxWidth.toString());
    const [localCameraMaxHeight, setLocalCameraMaxHeight] = useState(cameraMaxHeight.toString());
    const [localCameraFps, setLocalCameraFps] = useState(cameraFps.toString());
    const [localCameraDefaultZoom, setLocalCameraDefaultZoom] = useState(cameraDefaultZoom.toString());
    
    const [isLoading, setIsLoading] = useState(false);
    const [inputKey, setInputKey] = useState(0);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    useEffect(() => {
        setLocalServerUrl(serverUrl);
        setLocalCameraQuality(cameraQuality.toString());
        setLocalCameraSkipProcessing(cameraSkipProcessing);
        setLocalCameraMaxWidth(cameraMaxWidth.toString());
        setLocalCameraMaxHeight(cameraMaxHeight.toString());
        setLocalCameraFps(cameraFps.toString());
        setLocalCameraDefaultZoom(cameraDefaultZoom.toString());
    }, [serverUrl, cameraQuality, cameraSkipProcessing, cameraMaxWidth, cameraMaxHeight, cameraFps, cameraDefaultZoom]);

    const handleSave = async () => {
        if (!localServerUrl.trim()) {
            return;
        }

        setIsLoading(true);
        try {
            await setServerUrl(localServerUrl.trim());

            const quality = parseFloat(localCameraQuality);
            const maxWidth = parseInt(localCameraMaxWidth);
            const maxHeight = parseInt(localCameraMaxHeight);
            const fps = parseInt(localCameraFps);
            const defaultZoom = parseFloat(localCameraDefaultZoom);

            if (!isNaN(quality) && quality >= 0 && quality <= 1) {
                await setCameraQuality(quality);
            }
            await setCameraSkipProcessing(localCameraSkipProcessing);
            if (!isNaN(maxWidth) && maxWidth > 0) {
                await setCameraMaxWidth(maxWidth);
            }
            if (!isNaN(maxHeight) && maxHeight > 0) {
                await setCameraMaxHeight(maxHeight);
            }
            if (!isNaN(fps) && fps > 0) {
                await setCameraFps(fps);
            }
            if (!isNaN(defaultZoom) && defaultZoom >= 1 && defaultZoom <= 3) {
                await setCameraDefaultZoom(defaultZoom);
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async () => {
        setIsLoading(true);
        try {
            setLocalServerUrl(DEFAULT_SERVER_URL);
            setInputKey(prev => prev + 1);
            await setServerUrl(DEFAULT_SERVER_URL);
        } catch (error) {
            console.error('Failed to reset server URL:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetCamera = async () => {
        setIsLoading(true);
        try {
            await resetCameraSettings();
            setInputKey(prev => prev + 1);
        } catch (error) {
            console.error('Failed to reset camera settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageLayout title="Settings">
            <Typography variant="title" className="mb-lg">Settings</Typography>

            <Card padding="large" margin="medium">
                <View className="mb-lg">
                    <Typography variant="subtitle" className="mb-md">Server Configuration</Typography>

                    <View className="mb-lg">
                        <Typography variant="label" className="mb-sm">Server URL</Typography>
                        <TextInput
                            key={inputKey}
                            className="bg-slate-50 border-2 border-slate-200 rounded-xl px-lg py-md text-slate-900 text-base"
                            placeholder="Enter server URL"
                            placeholderTextColor="#94a3b8"
                            value={localServerUrl}
                            onChangeText={setLocalServerUrl}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                        />
                        <Typography variant="caption" className="mt-sm text-slate-500">
                            The base URL for the OpenDarts server
                        </Typography>
                    </View>

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Button
                                title={isLoading ? "Saving..." : "Save"}
                                variant="primary"
                                disabled={isLoading || localServerUrl === serverUrl}
                                onPress={handleSave}
                            />
                        </View>
                        <View className="flex-1">
                            <Button
                                title="Reset"
                                variant="secondary"
                                disabled={isLoading}
                                onPress={handleReset}
                            />
                        </View>
                    </View>
                </View>
            </Card>

            <Card padding="large" margin="medium">
                <View className="mb-lg">
                    <Typography variant="subtitle" className="mb-md">Camera Configuration</Typography>

                    <View className="mb-lg">
                        <Typography variant="label" className="mb-sm">Quality (0.0 - 1.0)</Typography>
                        <TextInput
                            key={`quality-${inputKey}`}
                            className="bg-slate-50 border-2 border-slate-200 rounded-xl px-lg py-md text-slate-900 text-base"
                            placeholder="0.9"
                            placeholderTextColor="#94a3b8"
                            value={localCameraQuality}
                            onChangeText={setLocalCameraQuality}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    <View className="mb-lg">
                        <View className="flex-row justify-between items-center">
                            <Typography variant="label">Skip Processing</Typography>
                            <Switch
                                value={localCameraSkipProcessing}
                                onValueChange={setLocalCameraSkipProcessing}
                                disabled={isLoading}
                            />
                        </View>
                    </View>

                    <View className="mb-lg">
                        <Typography variant="label" className="mb-sm">Max Width</Typography>
                        <TextInput
                            key={`width-${inputKey}`}
                            className="bg-slate-50 border-2 border-slate-200 rounded-xl px-lg py-md text-slate-900 text-base"
                            placeholder="1280"
                            placeholderTextColor="#94a3b8"
                            value={localCameraMaxWidth}
                            onChangeText={setLocalCameraMaxWidth}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                            keyboardType="number-pad"
                        />
                    </View>

                    <View className="mb-lg">
                        <Typography variant="label" className="mb-sm">Max Height</Typography>
                        <TextInput
                            key={`height-${inputKey}`}
                            className="bg-slate-50 border-2 border-slate-200 rounded-xl px-lg py-md text-slate-900 text-base"
                            placeholder="720"
                            placeholderTextColor="#94a3b8"
                            value={localCameraMaxHeight}
                            onChangeText={setLocalCameraMaxHeight}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                            keyboardType="number-pad"
                        />
                    </View>

                    <View className="mb-lg">
                        <Typography variant="label" className="mb-sm">FPS</Typography>
                        <TextInput
                            key={`fps-${inputKey}`}
                            className="bg-slate-50 border-2 border-slate-200 rounded-xl px-lg py-md text-slate-900 text-base"
                            placeholder="1"
                            placeholderTextColor="#94a3b8"
                            value={localCameraFps}
                            onChangeText={setLocalCameraFps}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                            keyboardType="number-pad"
                        />
                    </View>

                    <View className="mb-lg">
                        <Typography variant="label" className="mb-sm">Default Zoom (1.0 - 3.0)</Typography>
                        <TextInput
                            key={`zoom-${inputKey}`}
                            className="bg-slate-50 border-2 border-slate-200 rounded-xl px-lg py-md text-slate-900 text-base"
                            placeholder="1.8"
                            placeholderTextColor="#94a3b8"
                            value={localCameraDefaultZoom}
                            onChangeText={setLocalCameraDefaultZoom}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Button
                                title={isLoading ? "Saving..." : "Save"}
                                variant="primary"
                                disabled={isLoading}
                                onPress={handleSave}
                            />
                        </View>
                        <View className="flex-1">
                            <Button
                                title="Reset"
                                variant="secondary"
                                disabled={isLoading}
                                onPress={handleResetCamera}
                            />
                        </View>
                    </View>
                </View>
            </Card>
        </PageLayout>
    );
}