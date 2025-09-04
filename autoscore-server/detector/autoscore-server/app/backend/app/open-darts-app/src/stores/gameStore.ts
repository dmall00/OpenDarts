import {create} from 'zustand';
import {isWeb} from "@/src/utils/platform";

interface AutoScoreConfig {
    isAutoScoreEnabled: boolean;
    toggleAutoScore: () => void;
}

export const useGameStore = create<AutoScoreConfig>((set) => ({
    isAutoScoreEnabled: !isWeb(),
    toggleAutoScore: () => set((state) => ({
        isAutoScoreEnabled: !state.isAutoScoreEnabled
    })),
}));
