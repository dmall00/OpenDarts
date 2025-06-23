package io.github.dmall.opendarts.game.autoscore.rest.controller

import io.github.dmall.opendarts.game.autoscore.rest.model.GameConfigTo
import io.github.dmall.opendarts.game.autoscore.rest.model.GameSessionResponse
import io.github.dmall.opendarts.game.service.GameService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/app/game")
class GameController @Autowired constructor(private val gameService: GameService) {

    @PostMapping
    fun createGame(@RequestBody gameConfig: GameConfigTo): GameSessionResponse = gameService.createGame(gameConfig)

}