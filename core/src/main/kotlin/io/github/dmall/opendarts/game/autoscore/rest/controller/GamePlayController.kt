package io.github.dmall.opendarts.game.autoscore.rest.controller

import io.github.dmall.opendarts.game.model.DartThrow
import io.github.dmall.opendarts.game.model.GameResult
import io.github.dmall.opendarts.game.model.GameState
import io.github.dmall.opendarts.game.service.GameOrchestrator
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/app/game")
class GamePlayController @Autowired constructor(private val gameOrchestrator: GameOrchestrator) {

    @PostMapping("/{gameId}/throw")
    fun submitDartThrow(
        @PathVariable gameId: String,
        @RequestParam playerId: Long,
        @RequestBody dartThrow: DartThrow,
    ): GameResult {
        return gameOrchestrator.submitDartThrow(gameId, playerId, dartThrow)
    }

    @GetMapping("/{gameId}/state")
    fun getGameState(@PathVariable gameId: String): GameState {
        return gameOrchestrator.getGameState(gameId)
    }
}
