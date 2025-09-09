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

export interface Player {
    id: string;
    name: string;
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
    autoScore?: boolean;
}

export interface DartRevertRequest {
    id: number
}

export interface DartThrowResponse {
    id: number
    score: number;
    multiplier: number;
    scoreString: string;
    computedScore: number;
    autoScore: boolean;
}

export interface CurrentGameState {
    currentTurnDarts: { [playerId: string]: DartThrowResponse[] };
    currentRemainingScores: { [playerId: string]: number };
    players: { [playerId: string]: Player };
    currentPlayer: Player;
    legWon: boolean;
    setWon: boolean;
    gameWon: boolean;
    winner?: Player;
    nextPlayer?: Player;
    message?: string;
    bust: boolean;
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
