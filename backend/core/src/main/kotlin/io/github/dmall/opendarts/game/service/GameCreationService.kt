package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.model.*
import io.github.dmall.opendarts.game.repository.GameRepository
import io.github.dmall.opendarts.game.repository.GameSessionRepository
import io.github.dmall.opendarts.game.repository.PlayerRepository
import io.github.oshai.kotlinlogging.KotlinLogging
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

  private val logger = KotlinLogging.logger {}

  fun createGame(gameConfig: GameConfigRequest): GameSessionResponse {
    val players =
      gameConfig.players.map { player ->
        val existingPlayer = playerRepository.findByName(player.name)
        if (existingPlayer != null) {
          logger.info { "Adding existing player $player to game" }
          existingPlayer
        } else {
          logger.info { "Creating new player $player and adding to game" }
          playerRepository.save(Player().apply { this.name = player.name })
        }
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
