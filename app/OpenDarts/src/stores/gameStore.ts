import {create} from 'zustand';

interface GameState {
    isAutoScoreEnabled: boolean;
    toggleAutoScore: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    isAutoScoreEnabled: false,
    toggleAutoScore: () => set((state) => ({
        isAutoScoreEnabled: !state.isAutoScoreEnabled
    })),
}));
