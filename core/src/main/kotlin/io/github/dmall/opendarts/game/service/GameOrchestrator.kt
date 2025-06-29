package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.model.DartThrow
import io.github.dmall.opendarts.game.model.GameResult
import io.github.dmall.opendarts.game.model.GameState
import io.github.dmall.opendarts.game.repository.GameSessionRepository
import io.github.dmall.opendarts.game.repository.PlayerRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

/** Main entry point to route dart throws to the current game */
@Service
class GameOrchestrator
@Autowired
constructor(
    val gameSessionRepository: GameSessionRepository,
    val playerRepository: PlayerRepository,
    val gameModeRegistry: GameModeRegistry,
) {

    fun submitDartThrow(gameId: String, playerId: Long, dartThrow: DartThrow): GameResult {
        val gameSession = gameSessionRepository.findById(gameId).orElseThrow()
        val currentPlayer = playerRepository.findById(playerId).orElseThrow()
        val gameHandler = gameModeRegistry.getGameHandler(gameSession.game.gameMode)
        return gameHandler.processDartThrow(gameSession, currentPlayer, dartThrow)
    }

    fun getGameState(gameId: String): GameState {
        val gameSession = gameSessionRepository.findById(gameId).orElseThrow()
        val gameHandler = gameModeRegistry.getGameHandler(gameSession.game.gameMode)
        return gameHandler.getGameState(gameSession)
    }
}
