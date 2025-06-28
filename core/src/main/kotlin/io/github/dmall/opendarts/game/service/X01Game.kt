package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.model.DartThrow
import io.github.dmall.opendarts.game.model.GameMode
import io.github.dmall.opendarts.game.model.GameSession
import io.github.dmall.opendarts.game.model.Player
import org.springframework.stereotype.Service

@Service
class X01Game : DartGameModeHandler {


    override fun processDartThrow(
        gameSession: GameSession,
        currentPlayer: Player,
        dartThrow: DartThrow
    ) {

    }


    override fun getGameMode(): GameMode {
        return GameMode.X01
    }
}