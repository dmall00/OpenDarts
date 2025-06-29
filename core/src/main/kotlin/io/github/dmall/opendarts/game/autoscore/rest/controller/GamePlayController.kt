package io.github.dmall.opendarts.game.autoscore.rest.controller

import io.github.dmall.opendarts.game.autoscore.rest.mapper.GameMapper
import io.github.dmall.opendarts.game.model.DartThrow
import io.github.dmall.opendarts.game.model.GameResultTo
import io.github.dmall.opendarts.game.model.GameStateTo
import io.github.dmall.opendarts.game.service.GameOrchestrator
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/app/game")
class GamePlayController @Autowired constructor(
    private val gameOrchestrator: GameOrchestrator,
    private val gameMapper: GameMapper
) {

    @PostMapping("/{gameId}/throw")
    fun submitDartThrow(
        @PathVariable gameId: String,
        @RequestParam playerId: Long,
        @RequestBody dartThrow: DartThrow,
    ): GameResultTo {
        val gameResult = gameOrchestrator.submitDartThrow(gameId, playerId, dartThrow)
        return gameMapper.toGameResultTo(gameResult)
    }

    @GetMapping("/{gameId}/state")
    fun getGameState(@PathVariable gameId: String): GameStateTo {
        val gameState = gameOrchestrator.getGameState(gameId)
        return gameMapper.toGameStateTo(gameState)
    }
}
