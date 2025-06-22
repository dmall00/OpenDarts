import {View} from "react-native";
import {HeaderStyles} from "@/src/styles/HeaderStyles";
import ConnectionStatus from "@/src/components/game/ConnectionStatus";
import HeaderText from "@/src/components/common/HeaderText";
import AutoScoreToggle from "@/src/components/game/AutoScoreToggle";
import Header from "@/src/components/common/Header";
import React from "react";

interface InGameHeaderProps {
    isConnected: boolean,
    isConnecting: boolean,
    handleReconnect: () => void;
}

export default function InGameHeader(props: InGameHeaderProps) {
    return (<Header>
        <View style={HeaderStyles.leftContent}>
            <ConnectionStatus
                isConnected={props.isConnected}
                isConnecting={props.isConnecting}
                onReconnect={props.handleReconnect}
            />
        </View>
        <View style={HeaderStyles.centerContent}>
            <HeaderText title="OpenDarts"/>
        </View>
        <View style={HeaderStyles.rightContent}>
            <AutoScoreToggle></AutoScoreToggle>
        </View>
    </Header>);
};