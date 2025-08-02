package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.model.DartThrow
import io.github.dmall.opendarts.game.model.GameResult
import io.github.dmall.opendarts.game.model.GameState
import io.github.dmall.opendarts.game.repository.GameSessionRepository
import io.github.dmall.opendarts.game.repository.PlayerRepository
import jakarta.transaction.Transactional
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

/** Main entry point to route dart throws to the current game */
@Service
class GameOrchestrator
@Autowired
constructor(
    private val gameSessionRepository: GameSessionRepository,
    private val playerRepository: PlayerRepository,
    private val gameModeRegistry: GameModeRegistry,
) {

    @Transactional
    fun submitDartThrow(sessionId: String, playerId: String, dartThrow: DartThrow): GameResult {
        val gameSession = gameSessionRepository.findById(sessionId).orElseThrow()
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
