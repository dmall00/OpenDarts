package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.model.GameMode
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

@Service
class GameModeRegistry
    @Autowired
    constructor(
        gameModeHandlers: Set<DartGameModeHandler>,
    ) {
        private val gameModeHandlerMap: MutableMap<GameMode, DartGameModeHandler> = mutableMapOf()

        init {
            gameModeHandlers.forEach { gameModeHandlerMap[it.getGameMode()] = it }
        }

        fun getGameHandler(gameMode: GameMode): DartGameModeHandler = gameModeHandlerMap[gameMode]!!
}
