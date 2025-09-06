import {API_ENDPOINTS} from '../../config/config';
import {CreateGameRequest, GameSession} from '../../types/api';
import apiService from "@/src/services/api/api";

export class GameService {
    async createGame(gameData: CreateGameRequest): Promise<GameSession> {
        return apiService.post<GameSession>(API_ENDPOINTS.GAMES.CREATE, gameData);
    }
}

export const gameService = new GameService();
