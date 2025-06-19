import {apiService} from '../api';
import {API_ENDPOINTS} from '../../config/config';
import {CreateGameRequest, Game, GameStats, PaginatedResponse} from '../../types/api';

export class GameService {
    async createGame(gameData: CreateGameRequest): Promise<Game> {
        return apiService.post<Game>(API_ENDPOINTS.GAMES.CREATE, gameData);
    }

    async getAllGames(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Game>> {
        return apiService.get<PaginatedResponse<Game>>(
            `${API_ENDPOINTS.GAMES.GET_ALL}?page=${page}&limit=${limit}`
        );
    }

    async getGameById(id: string): Promise<Game> {
        return apiService.get<Game>(API_ENDPOINTS.GAMES.GET_BY_ID(id));
    }

    async updateGame(id: string, gameData: Partial<Game>): Promise<Game> {
        return apiService.put<Game>(API_ENDPOINTS.GAMES.UPDATE(id), gameData);
    }

    async deleteGame(id: string): Promise<void> {
        return apiService.delete<void>(API_ENDPOINTS.GAMES.DELETE(id));
    }

    async getGameStats(): Promise<GameStats> {
        return apiService.get<GameStats>(API_ENDPOINTS.USERS.GET_STATS);
    }
}

export const gameService = new GameService();
