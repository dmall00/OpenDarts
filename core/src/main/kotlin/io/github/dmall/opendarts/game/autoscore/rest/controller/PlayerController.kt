package io.github.dmall.opendarts.game.autoscore.rest.controller

import io.github.dmall.opendarts.game.service.PlayerCreationService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/app/player")
class PlayerController
@Autowired
constructor(private val playerCreationService: PlayerCreationService) {

    @PostMapping
    fun createPlayer(userName: String) {
        playerCreationService.createPlayer(userName)
    }
}
