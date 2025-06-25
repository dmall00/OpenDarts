package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.autoscore.rest.model.GameConfigTo
import io.github.dmall.opendarts.game.autoscore.rest.model.GameSessionResponse
import io.github.dmall.opendarts.game.model.Game
import io.github.dmall.opendarts.game.model.GameSession
import io.github.dmall.opendarts.game.repository.GameRepository
import io.github.dmall.opendarts.game.repository.GameSessionRepository
import io.github.dmall.opendarts.game.repository.PlayerRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class GameCreationService @Autowired constructor(
    val gameRepository: GameRepository,
    val gameSessionRepository: GameSessionRepository,
    val playerRepository: PlayerRepository
) {

    fun createGame(gameConfig: GameConfigTo): GameSessionResponse {
        val game = Game().apply {
            gameMode = gameConfig.gameMode
        }
        val savedGame = gameRepository.save(game)
        val players = gameConfig.players.map { player ->
            playerRepository.findByName(player)
                ?: throw IllegalStateException("Player $player not found")
        }
        val gameSession = GameSession().apply {
            this.game = savedGame
            this.players.addAll(players)
        }
        gameSessionRepository.save(gameSession)
        return GameSessionResponse(gameSession.id!!)
    }
}