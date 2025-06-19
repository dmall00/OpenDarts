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

export interface Game {
    id: string;
    gameMode: 'X01';
}

export interface CreateGameRequest {
    gameMode: 'X01';
    score: number;
    players: string[];
}

export interface GameStats {
    totalGames: number;
    wins: number;
    losses: number;
    averageScore: number;
    bestFinish: number;
}

export interface ApiError {
    message: string;
    status: number;
    code?: string;
    details?: any;
}
