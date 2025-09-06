import React from "react";
import ScoreDisplay from "@/src/components/ui/ScoreDisplay";

interface ScoreBoxProps {
    text: string
}

export default function ScoreBox({text}: ScoreBoxProps) {
    return (
        <ScoreDisplay 
            value={text}
            variant="small"
            color="neutral"
        />
    );
};