import {CreateGameRequest, DartProcessedResult, DartRevertRequest, DartThrow, GameSession} from '../../types/api';
import {API_ENDPOINTS} from "@/src/config/config";
import apiService from "@/src/services/api/api";

export class GameService {
    async createGame(gameData: CreateGameRequest): Promise<GameSession> {
        return apiService.post<GameSession>(API_ENDPOINTS.GAMES.CREATE, gameData);
    }

    async trackDart(playerId: string, gameId: string, dartThrow: DartThrow): Promise<DartProcessedResult> {
        const url = API_ENDPOINTS.GAMES.THROW
            .replace('gameId', gameId)
            .replace('playerId', playerId);
        return apiService.post<DartProcessedResult>(url, dartThrow)
    }

    async revertDart(playerId: string, gameId: string, revertRequest: DartRevertRequest): Promise<DartProcessedResult> {
        const url = API_ENDPOINTS.GAMES.REVERT
            .replace('gameId', gameId)
            .replace('playerId', playerId)
            .replace('dartId', String(revertRequest.id));
        return apiService.delete<DartProcessedResult>(url, null)
    }
}

export const gameService = new GameService();
