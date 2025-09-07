package io.github.dmall.opendarts.game.controller

import io.github.dmall.opendarts.game.mapper.GameMapper
import io.github.dmall.opendarts.game.model.CurrentGameStateTO
import io.github.dmall.opendarts.game.model.DartThrow
import io.github.dmall.opendarts.game.model.GameStateTo
import io.github.dmall.opendarts.game.service.GameOrchestrator
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/app/game")
class GamePlayController
    @Autowired
    constructor(
        private val gameOrchestrator: GameOrchestrator,
        private val gameMapper: GameMapper,
    ) {
        @PostMapping("/{gameId}/{playerId}/dart/throw")
        fun submitDartThrow(
            @PathVariable playerId: String,
            @PathVariable gameId: String,
            @RequestBody dartThrow: DartThrow,
        ): CurrentGameStateTO {
            val gameResult = gameOrchestrator.submitDartThrow(gameId, playerId, dartThrow)
            return gameMapper.toCurrentGameStateTO(gameResult)
        }

        @GetMapping("/{gameId}/state")
        fun getGameState(
            @PathVariable gameId: String,
        ): GameStateTo {
            val gameState = gameOrchestrator.getGameState(gameId)
            return gameMapper.toGameStateTo(gameState)
        }
    }
