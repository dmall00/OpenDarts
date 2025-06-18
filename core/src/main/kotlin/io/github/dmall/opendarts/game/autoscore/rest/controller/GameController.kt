package io.github.dmall.opendarts.game.autoscore.rest.controller

import io.github.dmall.opendarts.game.autoscore.rest.model.GameTo
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

@RestController
class GameController {

    @PostMapping
    fun createGame(@RequestBody game: GameTo) {

    }
}