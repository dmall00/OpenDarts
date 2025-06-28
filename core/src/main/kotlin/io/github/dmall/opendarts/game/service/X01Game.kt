package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.model.*
import org.springframework.stereotype.Service

@Service
class X01Game() : DartGameModeHandler {
    override fun processDartThrow(
        gameSession: GameSession,
        currentPlayer: Player,
        dartThrow: DartThrow
    ): GameResult {
        TODO("Not yet implemented")
    }

    override fun getGameState(gameSession: GameSession): GameState {
        TODO("Not yet implemented")
    }

    override fun initializeGame(gameSession: GameSession) {

    }

    override fun isValidThrow(
        gameSession: GameSession,
        currentPlayer: Player,
        dartThrow: DartThrow
    ): Boolean {
        TODO("Not yet implemented")
    }

    override fun getGameMode(): GameMode {
        TODO("Not yet implemented")
    }
}