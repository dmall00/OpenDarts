export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}


export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    refreshToken: string;
    user: User;
}

export interface User {
    id: string;
    email: string;
    username: string;
    createdAt: string;
    updatedAt: string;
}

export interface GameSession {
    gameId: string;
}

export interface CreateGameRequest {
    gameMode: 'X01';
    score: number;
    players: string[];
}

export interface CalibrationState {
    calibrated: boolean;
}


export interface DartThrow {
    score: number;
    multiplier: number;
    scoreString: string;
    computedScore: number;
    autoScore: boolean;
}

export interface DartProcessedResult {
    currentDartThrow: DartThrow;
    currentTurnDarts: DartThrow[];
    currentDartNumber: number;
    currentPlayer: string;
    remainingScore: number;
    isLegWon: boolean;
    isSetWon: boolean;
    isGameWon: boolean;
    winner?: string;
    nextPlayer: string;
    message?: string;
    bust: boolean;
}

export interface GameState {
    currentPlayer: string;
    currentRemainingScores: Record<string, number>;
    currentLegDarts: DartThrow[];
    currentLeg: number;
    currentSet: number;
    legsWon: Record<string, number>;
    setsWon: Record<string, number>;
    dartsThrown: number;
    turnsPlayed: number;
}

export interface WebSocketMessage<T = any> {
    type: string;
    timestamp?: number;
    data?: T;
}

export type MessageHandler<T = any> = (data: T) => void;

export interface MessageHandlers {
    [messageType: string]: MessageHandler;
}

export interface ApiError {
    message: string;
    status: number;
    code?: string;
    details?: any;
}
