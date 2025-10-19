export interface PlayerRequest {
    name: string;
}

export interface PlayerResponse {
    id: string;
    name: string;
}

export interface GameSessionResponse {
    gameId: string;
}

export interface CreateGameRequest {
    gameMode: 'X01';
    score: number;
    players: PlayerRequest[];
}

export interface CalibrationResponse {
    calibrated: boolean;
}

export interface DartThrowRequest {
    score: number;
    multiplier: number;
    autoScore?: boolean;
}

export interface DartRevertRequest {
    id: number
}

export interface DartCorrectionRequest {
    dartId: number;
    score: number;
    multiplier: number;
}

export interface DartThrowResponse {
    id: number
    score: number;
    multiplier: number;
    scoreString: string;
    computedScore: number;
    autoScore: boolean;
}

export interface CurrentGameStateResponse {
    currentTurnDarts: { [playerId: string]: DartThrowResponse[] };
    currentRemainingScores: { [playerId: string]: number };
    players: { [playerId: string]: PlayerResponse };
    currentPlayer: PlayerResponse;
    legWon: boolean;
    setWon: boolean;
    gameWon: boolean;
    winner?: PlayerResponse;
    nextPlayer?: PlayerResponse;
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
