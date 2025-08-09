export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
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


export interface DartThrow {
    score: number;
    multiplier: number;
    scoreString: String;
    isAutoScore: boolean;
}

export interface GameResultTo {
    scoreChange: number;
    currentDartThrow: DartThrow;
    currentDartNumber: number;
    remainingScore?: number | null;
    isLegWon?: boolean;
    isSetWon?: boolean;
    isGameWon?: boolean;
    winner?: string | null;
    nextPlayer?: string | null;
    message?: string | null;
    bust?: boolean;
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
