import {apiService} from '../api';
import {API_ENDPOINTS} from '../../config/config';
import {CreateGameRequest, Game} from '../../types/api';

export class GameService {
    async createGame(gameData: CreateGameRequest): Promise<Game> {
        return apiService.post<Game>(API_ENDPOINTS.GAMES.CREATE, gameData);
    }
}

export const gameService = new GameService();
