package io.github.dmall.opendarts.game.repository

import io.github.dmall.opendarts.game.model.GameSession
import org.springframework.cache.annotation.CacheConfig
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
@CacheConfig(cacheNames = ["gameSessions"])
interface GameSessionRepository : JpaRepository<GameSession, String> {

    @Cacheable(key = "#id")
    override fun findById(id: String): Optional<GameSession>
}
