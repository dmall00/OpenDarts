import React, {useEffect, useState} from 'react';
import {TextInput, View} from 'react-native';
import PageLayout from '@/src/components/ui/PageLayout';
import Typography from '@/src/components/ui/Typography';
import Card from '@/src/components/ui/Card';
import Button from '@/src/components/ui/Button';
import {DEFAULT_SERVER_URL, useSettingsStore} from '@/src/stores/settingsStore';

export default function Settings() {
    const serverUrl = useSettingsStore(state => state.serverUrl);
    const setServerUrl = useSettingsStore(state => state.setServerUrl);
    const loadSettings = useSettingsStore(state => state.loadSettings);
    const [localServerUrl, setLocalServerUrl] = useState(serverUrl);
    const [isLoading, setIsLoading] = useState(false);
    const [inputKey, setInputKey] = useState(0);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    useEffect(() => {
        setLocalServerUrl(serverUrl);
    }, [serverUrl]);

    const handleSave = async () => {
        if (!localServerUrl.trim()) {
            return;
        }

        setIsLoading(true);
        try {
            await setServerUrl(localServerUrl.trim());
        } catch (error) {
            console.error('Failed to save server URL:', error);
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
                                title="Reset to Default"
                                variant="secondary"
                                disabled={isLoading}
                                onPress={handleReset}
                            />
                        </View>
                    </View>
                </View>
            </Card>
        </PageLayout>
    );
}