package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.autoscore.rest.model.GameConfigTo
import io.github.dmall.opendarts.game.autoscore.rest.model.GameSessionResponse
import io.github.dmall.opendarts.game.model.Game
import io.github.dmall.opendarts.game.model.GameSession
import io.github.dmall.opendarts.game.model.X01Config
import io.github.dmall.opendarts.game.repository.GameRepository
import io.github.dmall.opendarts.game.repository.GameSessionRepository
import io.github.dmall.opendarts.game.repository.PlayerRepository
import jakarta.persistence.EntityManager
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class GameCreationService
@Autowired
constructor(
    val gameRepository: GameRepository,
    val gameSessionRepository: GameSessionRepository,
    val playerRepository: PlayerRepository,
    val gameModeRegistry: GameModeRegistry,
    val entityManager: EntityManager,
) {

    fun createGame(gameConfig: GameConfigTo): GameSessionResponse {
        val players =
            gameConfig.players.map { player ->
                playerRepository.findByName(player)
                    ?: throw IllegalStateException("Player $player not found")
            }

        val x01Config =
            X01Config().apply {
                this.startingScore = gameConfig.score
                this.legs = 1
                this.sets = 1
                this.doubleOut = true
                this.startingPlayer = players.first()
                this.playerOrder.addAll(players.map { it.id!! })
            }
        entityManager.persist(x01Config)
        entityManager.flush()

        val game =
            Game().apply {
                this.gameMode = gameConfig.gameMode
                this.gameConfig = x01Config
            }

        val savedGame = gameRepository.save(game)
        val gameSession =
            GameSession().apply {
                this.game = savedGame
                this.players.addAll(players)
            }
        val savedGameSession = gameSessionRepository.save(gameSession)
        val gameHandler = gameModeRegistry.getGameHandler(gameConfig.gameMode)
        gameHandler.initializeGame(savedGameSession)
        return GameSessionResponse(savedGameSession.id!!)
    }
}
