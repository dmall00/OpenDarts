package io.github.dmall.opendarts.game.repository

import io.github.dmall.opendarts.game.model.Player
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PlayerRepository : JpaRepository<Player, Long> {

    fun findByName(name: String): Player?
}