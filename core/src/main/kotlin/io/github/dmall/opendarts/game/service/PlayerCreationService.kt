package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.model.Player
import io.github.dmall.opendarts.game.repository.PlayerRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class PlayerCreationService @Autowired constructor(private val playerRepository: PlayerRepository) {

    fun createPlayer(userName: String) {
        val player = Player().apply {
            name = userName
        }
        playerRepository.save(player)
    }
}