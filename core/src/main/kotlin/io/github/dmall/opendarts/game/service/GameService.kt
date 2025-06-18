package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.autoscore.rest.model.GameTo
import io.github.dmall.opendarts.game.repository.GameRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

@Service
class GameService @Autowired constructor(val gameRepository: GameRepository) {

    fun createGame(game: GameTo): Long {

        return TODO("Provide the return value")
    }
}