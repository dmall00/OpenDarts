import {
    CreateGameRequest,
    CurrentGameStateResponse,
    DartCorrectionRequest,
    DartRevertRequest,
    DartThrowRequest,
    GameSessionResponse
} from '../../types/api';
import {API_ENDPOINTS} from "@/src/config/config";
import apiService from "@/src/services/api/api";

export class GameService {
    async createGame(gameData: CreateGameRequest): Promise<GameSessionResponse> {
        return apiService.post<GameSessionResponse>(API_ENDPOINTS.GAMES.CREATE, gameData);
    }

    async trackDart(playerId: string, gameId: string, dartThrow: DartThrowRequest): Promise<CurrentGameStateResponse> {
        const url = API_ENDPOINTS.GAMES.THROW
            .replace('gameId', gameId)
            .replace('playerId', playerId);
        return apiService.post<CurrentGameStateResponse>(url, dartThrow)
    }

    async revertDart(playerId: string, gameId: string, revertRequest: DartRevertRequest): Promise<CurrentGameStateResponse> {
        const url = API_ENDPOINTS.GAMES.REVERT
            .replace('gameId', gameId)
            .replace('playerId', playerId)
            .replace('dartId', String(revertRequest.id));
        return apiService.delete<CurrentGameStateResponse>(url, null)
    }

    async correctDart(playerId: string, gameId: string, correction: DartCorrectionRequest): Promise<CurrentGameStateResponse> {
        const url = API_ENDPOINTS.GAMES.CORRECT
            .replace('gameId', gameId)
            .replace('playerId', playerId);
        return apiService.put<CurrentGameStateResponse>(url, correction)
    }

    async getCurrentGameState(gameId: string): Promise<CurrentGameStateResponse> {
        const url = API_ENDPOINTS.GAMES.GET_STATE
            .replace('gameId', gameId);
        return apiService.get<CurrentGameStateResponse>(url);
    }
}

export const gameService = new GameService();
