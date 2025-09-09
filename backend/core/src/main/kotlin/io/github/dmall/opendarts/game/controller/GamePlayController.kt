package io.github.dmall.opendarts.game.controller

import io.github.dmall.opendarts.game.mapper.GameMapper
import io.github.dmall.opendarts.game.model.CurrentGameStateTO
import io.github.dmall.opendarts.game.model.DartRevertRequest
import io.github.dmall.opendarts.game.model.DartThrowRequest
import io.github.dmall.opendarts.game.service.GameOrchestrator
import jakarta.validation.Valid
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/app/game")
class GamePlayController
@Autowired
constructor(
    private val gameOrchestrator: GameOrchestrator,
    private val gameMapper: GameMapper,
) {
    @PostMapping("/{gameId}/{playerId}/dart")
    fun submitDartThrow(
        @PathVariable playerId: String,
        @PathVariable gameId: String,
        @Valid @RequestBody dartThrowRequest: DartThrowRequest,
    ): ResponseEntity<CurrentGameStateTO> {
        val currentGameState = gameOrchestrator.submitDartThrow(gameId, playerId, dartThrowRequest)
        return ResponseEntity.ok(gameMapper.toCurrentGameStateTO(currentGameState))
    }

    @DeleteMapping("/{gameId}/{playerId}/dart/{dartId}")
    fun revertLastTurnDart(
        @PathVariable playerId: String,
        @PathVariable gameId: String,
        @PathVariable dartId: Long
    ): ResponseEntity<CurrentGameStateTO> {
        val currentGameState = gameOrchestrator.revertDartThrow(gameId, playerId, DartRevertRequest(dartId))
        return ResponseEntity.ok(gameMapper.toCurrentGameStateTO(currentGameState))
    }


    @GetMapping("/{gameId}/state")
    fun getGameState(
        @PathVariable gameId: String,
    ): ResponseEntity<CurrentGameStateTO> {
        val gameState = gameOrchestrator.getGameState(gameId)
        return ResponseEntity.ok(gameMapper.toCurrentGameStateTO(gameState))
    }
}
