import { DartThrowRequest, CurrentGameStateResponse } from '@/src/types/api';

export interface PendingDart {
    score: number;
    multiplier: number;
    computedScore: number;
    scoreString: string;
}

export interface ManualScoringState {
    pendingDarts: PendingDart[];
    currentScore: number;
    initialScore: number;
    isBust: boolean;
}

export class ManualScoringService {
    private state: ManualScoringState = {
        pendingDarts: [],
        currentScore: 0,
        initialScore: 0,
        isBust: false
    };

    initialize(currentScore: number) {
        this.state = {
            pendingDarts: [],
            currentScore,
            initialScore: currentScore,
            isBust: false
        };
    }

    getState(): ManualScoringState {
        return { ...this.state };
    }

    addDart(score: number, multiplier: number): ManualScoringState {
        if (this.state.isBust) {
            return this.getState();
        }

        if (this.state.pendingDarts.length >= 3) {
            console.warn('Cannot add more than 3 darts per turn');
            return this.getState();
        }

        const computedScore = score * multiplier;
        const scoreString = this.formatScoreString(score, multiplier);
        
        const newDart: PendingDart = {
            score,
            multiplier,
            computedScore,
            scoreString
        };

        const newPendingDarts = [...this.state.pendingDarts, newDart];
        const totalThrown = newPendingDarts.reduce((sum, dart) => sum + dart.computedScore, 0);
        const newScore = this.state.initialScore - totalThrown;

        const isBust = this.checkBust(newScore, newDart, this.state.initialScore - totalThrown + computedScore);

        if (isBust) {
            this.state = {
                ...this.state,
                pendingDarts: newPendingDarts,
                isBust: true
            };
        } else {
            this.state = {
                ...this.state,
                pendingDarts: newPendingDarts,
                currentScore: newScore,
                isBust: false
            };
        }

        return this.getState();
    }

    revertLastDart(): ManualScoringState {
        if (this.state.pendingDarts.length === 0) {
            return this.getState();
        }

        const newPendingDarts = this.state.pendingDarts.slice(0, -1);
        const totalThrown = newPendingDarts.reduce((sum, dart) => sum + dart.computedScore, 0);
        const newScore = this.state.initialScore - totalThrown;

        this.state = {
            ...this.state,
            pendingDarts: newPendingDarts,
            currentScore: newScore,
            isBust: false
        };

        return this.getState();
    }

    correctDart(index: number, score: number, multiplier: number): ManualScoringState {
        if (index < 0 || index >= this.state.pendingDarts.length) {
            console.warn('Invalid dart index for correction');
            return this.getState();
        }

        const computedScore = score * multiplier;
        const scoreString = this.formatScoreString(score, multiplier);

        const newPendingDarts = [...this.state.pendingDarts];
        newPendingDarts[index] = {
            score,
            multiplier,
            computedScore,
            scoreString
        };

        const totalThrown = newPendingDarts.reduce((sum, dart) => sum + dart.computedScore, 0);
        const newScore = this.state.initialScore - totalThrown;

        const lastDart = newPendingDarts[newPendingDarts.length - 1];
        const isBust = this.checkBust(newScore, lastDart, this.state.initialScore - totalThrown + lastDart.computedScore);

        this.state = {
            ...this.state,
            pendingDarts: newPendingDarts,
            currentScore: isBust ? this.state.initialScore : newScore,
            isBust
        };

        return this.getState();
    }

    getPendingDartsForSubmission(): DartThrowRequest[] {
        return this.state.pendingDarts.map(dart => ({
            score: dart.score,
            multiplier: dart.multiplier,
            autoScore: false
        }));
    }

    clear() {
        this.state = {
            pendingDarts: [],
            currentScore: this.state.currentScore,
            initialScore: this.state.currentScore,
            isBust: false
        };
    }

    syncWithBackendState(gameState: CurrentGameStateResponse, playerId: string) {
        const currentScore = gameState.currentRemainingScores?.[playerId] ?? 0;
        this.state = {
            pendingDarts: [],
            currentScore,
            initialScore: currentScore,
            isBust: gameState.bust ?? false
        };
    }

    private checkBust(newScore: number, lastDart: PendingDart, scoreBeforeLastDart: number): boolean {
        if (newScore < 0) {
            return true;
        }

        if (newScore === 1) {
            return true;
        }

        if (newScore === 0) {
            if (lastDart.multiplier !== 2) {
                return true;
            }
        }

        return false;
    }

    private formatScoreString(score: number, multiplier: number): string {
        if (score === 0) {
            return 'Miss';
        }
        
        switch (multiplier) {
            case 1:
                return `S${score}`;
            case 2:
                return `D${score}`;
            case 3:
                return `T${score}`;
            default:
                return `${score}`;
        }
    }
}

export const manualScoringService = new ManualScoringService();
