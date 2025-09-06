package io.github.dmall.opendarts.game.repository

import io.github.dmall.opendarts.game.model.Game
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface GameRepository : JpaRepository<Game, Long> {}
