package io.github.dmall.opendarts.game.autoscore.rest.controller

import io.github.dmall.opendarts.game.autoscore.rest.model.GameTo
import io.github.dmall.opendarts.game.service.GameService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/games")
class GameController @Autowired constructor(
    private val gameService: GameService
) {

    @PostMapping
    fun createGame(@RequestBody game: GameTo): ResponseEntity<Map<String, Long>> {
        val gameId = gameService.createGame(game)
        return ResponseEntity.ok(mapOf("gameId" to gameId))
    }
}