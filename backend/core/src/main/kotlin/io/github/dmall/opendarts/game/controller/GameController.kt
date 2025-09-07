package io.github.dmall.opendarts.game.controller

import io.github.dmall.opendarts.game.model.GameConfigTo
import io.github.dmall.opendarts.game.model.GameSessionResponse
import io.github.dmall.opendarts.game.service.GameCreationService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/app/game")
class GameController @Autowired constructor(private val gameCreationService: GameCreationService) {

    @PostMapping
    fun createGame(@RequestBody gameConfig: GameConfigTo): ResponseEntity<GameSessionResponse> {
        val response = gameCreationService.createGame(gameConfig)
        return ResponseEntity.ok(response)
    }

}
