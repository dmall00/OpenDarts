package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.exception.DartGameException
import io.github.dmall.opendarts.game.exception.NotFoundException
import io.github.dmall.opendarts.game.model.*
import io.github.dmall.opendarts.game.repository.GameSessionRepository
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class X01Game
@Autowired
constructor(
    val gameSessionRepository: GameSessionRepository
) : DartGameModeHandler {
    private val logger = KotlinLogging.logger {}

    override fun processDartThrow(
        gameSession: GameSession,
        currentPlayer: Player,
        dartThrowRequest: DartThrowRequest,
    ): CurrentGameState {
        val config = getConfig(gameSession)
        val currentLeg = getCurrentLeg(gameSession)
        val currentTurn = getCurrentTurn(currentLeg, currentPlayer)
        val currentScore = getCurrentScore(config, currentPlayer, currentLeg)

        if (currentScore == 0) {
            throw DartGameException("Game is already over")
        }
        val throwScore = dartThrowRequest.score * dartThrowRequest.multiplier

        val newScore = currentScore - throwScore

        if (isBust(newScore, config, dartThrowRequest)) {
            logger.info { "Bust detected" }
            fillMissDarts(currentTurn)
            val nextPlayer = getNextPlayer(gameSession, currentPlayer)
            logger.info { "Next player is $nextPlayer" }

            return CurrentGameState(
                currentRemainingScores = getCurrentRemainingScores(
                    currentLeg
                ),
                bust = true,
                nextPlayer = nextPlayer,
                currentTurnDarts = getCurrentTurnDarts(currentPlayer, currentTurn, nextPlayer),
                message = "Bust",
                currentPlayer = currentPlayer,
            )
        }

        if (isFinishLeg(config, newScore, dartThrowRequest)) {
            logger.info { "Leg is finished" }
            handleDartThrow(gameSession, dartThrowRequest, currentTurn)
            val (isSetWon, isGameWon) = handleLegWin(gameSession, currentPlayer, currentLeg)

            var nextPlayer: Player? = null
            if (!isGameWon) {
                if (isSetWon) {
                    logger.info { "Set is won" }
                    createNewSet(gameSession)
                } else {
                    logger.info { "Leg is won" }
                    createNewLeg(gameSession, gameSession.dartSets.last())
                }
                nextPlayer = getStartingPlayerForNewLeg(gameSession, config)
            }
            logger.info { "Game is won" }
            return CurrentGameState(
                legWon = true,
                setWon = isSetWon,
                gameWon = isGameWon,
                winner = if (isGameWon) currentPlayer else null,
                nextPlayer = nextPlayer,
                message =
                    when {
                        isGameWon -> "Game won!"
                        isSetWon -> "Set won!"
                        else -> "Leg won!"
                    },
                currentTurnDarts = getCurrentTurnDarts(currentPlayer, currentTurn, nextPlayer),
                currentRemainingScores = getCurrentRemainingScores(
                    currentLeg
                ),
                currentPlayer = currentPlayer,
            )
        }

        handleDartThrow(gameSession, dartThrowRequest, currentTurn)
        logger.info { "Current game state after throw: $newScore" }

        val shouldSwitch = shouldSwitchPlayer(currentTurn)
        val nextPlayer =
            if (shouldSwitch) {
                logger.info { "Turn completed switching player" }
                getNextPlayer(gameSession, currentPlayer)
            } else {
                currentPlayer
            }

        return CurrentGameState(
            currentRemainingScores = getCurrentRemainingScores(currentLeg),
            nextPlayer = nextPlayer,
            currentPlayer = currentPlayer,
            currentTurnDarts = getCurrentTurnDarts(currentPlayer, currentTurn, nextPlayer),
        )
    }

    private fun getCurrentTurnDarts(
        currentPlayer: Player,
        currentTurn: Turn,
        nextPlayer: Player?
    ): Map<Player, List<Dart>> {
        val gameSession = currentTurn.leg.dartSet.gameSession
        val refreshedGameSession = gameSessionRepository.findById(gameSession.id!!)
            .orElseThrow { NotFoundException("Game session not found") }

        val refreshedLeg = getCurrentLeg(refreshedGameSession)
        val refreshedTurn = refreshedLeg.turns
            .find { it.player.id == currentPlayer.id && it.turnOrderIndex == currentTurn.turnOrderIndex }
            ?: currentTurn

        val map = mutableMapOf(currentPlayer to refreshedTurn.darts.toList())
        if (currentPlayer.id != nextPlayer?.id) {
            nextPlayer?.let {
                map[it] = emptyList()
            }
        }
        return map
    }

    private fun getCurrentRemainingScores(
        currentLeg: Leg
    ): Map<Player, Int> {
        val config = getConfig(currentLeg.dartSet.gameSession)
        return currentLeg.dartSet.gameSession.players.associateWith { player ->
            getCurrentScore(config, player, currentLeg)
        }
    }

    override fun revertDartThrow(
        gameSession: GameSession,
        currentPlayer: Player,
        dartRevertRequest: DartRevertRequest
    ): CurrentGameState {
        val currentLeg = getCurrentLeg(gameSession)
        val currentTurn = getCurrentTurnForRevert(currentLeg, currentPlayer)
        removeLastDartFromTurnIfPresent(currentTurn)
        gameSessionRepository.save(gameSession)
        val nextPlayer = gameSession.players.firstOrNull { it.id != currentPlayer.id }
        return CurrentGameState(
            currentTurnDarts = getCurrentTurnDarts(
                currentPlayer,
                currentTurn,
                nextPlayer
            ),
            currentPlayer = currentPlayer,
            currentRemainingScores = getCurrentRemainingScores(
                currentLeg
            ),
            legWon = false,
            setWon = false,
            gameWon = false,
            winner = null,
            nextPlayer = currentPlayer,
            message = "Last dart throw reversed",
            bust = false
        )
    }

    private fun removeLastDartFromTurnIfPresent(currentTurn: Turn) {
        if (currentTurn.darts.isNotEmpty()) {
            val lastDart = currentTurn.darts.removeLast()
            logger.info { "Removed dart: ${lastDart.scoreString} from turn" }
        } else {
            logger.info { "No darts to remove from turn" }
        }
    }

    private fun fillMissDarts(currentTurn: Turn) {
        while (currentTurn.darts.size < 3) {
            val dart =
                Dart().apply {
                    this.score = 0
                    this.multiplier = 0
                    this.turn = currentTurn
                    this.autoScore = false
                }
            currentTurn.darts.add(dart)
        }
    }

    private fun getCurrentTurn(
        currentLeg: Leg,
        currentPlayer: Player,
    ): Turn {
        val existingTurn = currentLeg.turns
            .filter { it.player.id == currentPlayer.id }
            .lastOrNull { it.darts.size < 3 }

        if (existingTurn != null) {
            return existingTurn
        }

        logger.info { "Creating new turn for player ${currentPlayer.name}" }
        val nextTurnOrder = currentLeg.turns.maxOfOrNull { it.turnOrderIndex } ?: -1
        val newTurn = Turn().apply {
            this.player = currentPlayer
            this.leg = currentLeg
            this.turnOrderIndex = nextTurnOrder + 1
        }
        currentLeg.turns.add(newTurn)
        return newTurn
    }

    private fun getCurrentTurnForRevert(
        currentLeg: Leg,
        currentPlayer: Player,
    ): Turn =
        currentLeg.turns
            .filter { it.player.id == currentPlayer.id }
            .maxByOrNull { it.turnOrderIndex } ?: error("No turn found for current player")

    private fun handleDartThrow(
        gameSession: GameSession,
        dartThrowRequest: DartThrowRequest,
        currentTurn: Turn,
    ) {
        logger.info { "Handling new throw $dartThrowRequest" }
        if (currentTurn.darts.count() < 3) {
            val dart =
                Dart().apply {
                    this.score = dartThrowRequest.score
                    this.multiplier = dartThrowRequest.multiplier
                    this.turn = currentTurn
                    this.autoScore = dartThrowRequest.autoScore
                }
            currentTurn.darts.add(dart)
        }
        logger.info { "Currently ${currentTurn.darts.count()} darts in turn" }
        gameSessionRepository.saveAndFlush(gameSession)
    }

    private fun shouldSwitchPlayer(currentTurn: Turn): Boolean = currentTurn.darts.count() >= 3

    private fun isFinishLeg(
        config: X01Config,
        newScore: Int,
        dartThrowRequest: DartThrowRequest,
    ): Boolean {
        if (newScore != 0) return false
        if (config.doubleOut && dartThrowRequest.multiplier != 2) return false
        return true
    }

    private fun isBust(
        newScore: Int,
        config: X01Config,
        dartThrowRequest: DartThrowRequest,
    ): Boolean {
        if (newScore < 0) return true
        if (newScore == 0 && config.doubleOut && dartThrowRequest.multiplier != 2) return true
        if (newScore == 1 && config.doubleOut) return true
        return false
    }

    private fun getNextPlayer(
        gameSession: GameSession,
        currentPlayer: Player,
    ): Player {
        val config = getConfig(gameSession)
        val currentIndex = config.playerOrder.indexOf(currentPlayer.id)
        val nextIndex = (currentIndex + 1) % config.playerOrder.size
        val nextPlayerId = config.playerOrder[nextIndex]

        return gameSession.players.find { it.id == nextPlayerId } ?: throw NotFoundException("Next player not found")
    }

    private fun getCurrentScore(
        config: X01Config,
        player: Player,
        currentLeg: Leg,
    ): Int {
        val accumulatedScore =
            currentLeg.turns
                .filter { it.player.id == player.id }
                .flatMap { it.darts }
                .sumOf { it.score * it.multiplier }

        return config.startingScore - accumulatedScore
    }

    override fun getCurrentGameState(gameSession: GameSession): CurrentGameState {
        val currentLeg = getCurrentLeg(gameSession)
        val currentPlayer = getCurrentPlayer(gameSession)

        val playerToRemainingScoreMap =
            gameSession.players.associateWith { player ->
                getRemainingScore(gameSession, player, currentLeg)
            }

        val currentTurnDartsMap = gameSession.players.associateWith { player ->
            val currentTurn = currentLeg.turns
                .filter { it.player.id == player.id }
                .maxByOrNull { it.turnOrderIndex }

            logger.info { "Player ${player.name}: currentTurn has ${currentTurn?.darts?.size ?: 0} darts" }

            // Return darts from the most recent turn if it's incomplete, or empty if complete
            if (currentTurn != null && currentTurn.darts.size < 3) {
                val darts = currentTurn.darts.toList()
                logger.info { "Returning ${darts.size} darts for player ${player.name}: ${darts.map { "${it.scoreString}(${it.id})" }}" }
                darts
            } else {
                logger.info { "Returning empty list for player ${player.name}" }
                emptyList()
            }
        }

        return CurrentGameState(
            currentRemainingScores = playerToRemainingScoreMap,
            currentPlayer = currentPlayer,
            currentTurnDarts = currentTurnDartsMap,
            legWon = false,
            setWon = false,
            gameWon = false,
            winner = null,
            nextPlayer = if (gameSession.players.size > 1) getNextPlayer(gameSession, currentPlayer) else null,
            message = null,
            bust = false
        )
    }

    private fun getCurrentTurnDarts(
        currentPlayer: Player,
        currentLeg: Leg,
    ): List<DartThrowRequest> {
        val currentTurn =
            currentLeg.turns
                .filter { it.player == currentPlayer }
                .maxByOrNull { it.turnOrderIndex } ?: return emptyList()

        return currentTurn.darts.map { dart ->
            DartThrowRequest(score = dart.score, multiplier = dart.multiplier, autoScore = false)
        }
    }

    private fun getRemainingScore(
        gameSession: GameSession,
        player: Player,
        currentLeg: Leg,
    ): Int {
        val startingScore = getConfig(gameSession).startingScore
        val playerRemainingScore =
            currentLeg.turns
                .filter { it.player.id == player.id }
                .flatMap { it.darts }
                .sumOf { it.score * it.multiplier }
        return startingScore - playerRemainingScore
    }

    private fun getCurrentPlayer(gameSession: GameSession): Player {
        val currentLeg = getCurrentLeg(gameSession)
        val incompleteTurn = currentLeg.turns.last()

        return incompleteTurn.player
    }

    private fun getConfig(gameSession: GameSession): X01Config = gameSession.game.gameConfig as X01Config

    private fun getCurrentLeg(gameSession: GameSession): Leg =
        gameSession.dartSets
            .lastOrNull()
            ?.legs
            ?.lastOrNull() ?: throw NotFoundException("No current leg found")

    override fun initializeGame(gameSession: GameSession) {
        val config = getConfig(gameSession)
        val dartSet = DartSet().apply { this.gameSession = gameSession }
        gameSession.dartSets.add(dartSet)

        val leg = Leg().apply { this.dartSet = dartSet }
        dartSet.legs.add(leg)

        val startingPlayer = config.startingPlayer
        val firstTurn =
            Turn().apply {
                this.player = startingPlayer
                this.leg = leg
                this.turnOrderIndex = 0
            }
        leg.turns.add(firstTurn)

        gameSessionRepository.save(gameSession)
    }

    override fun getGameMode(): GameMode = GameMode.X01

    private fun handleLegWin(
        gameSession: GameSession,
        winner: Player,
        currentLeg: Leg,
    ): LegWinResult {
        currentLeg.winner = winner
        val config = getConfig(gameSession)
        val currentSet = currentLeg.dartSet

        val playerWonLegs = currentSet.legs.count { it.winner?.id == winner.id }
        val isSetWon = config.legs == playerWonLegs

        if (isSetWon) {
            currentSet.winner = winner
        }

        val playerWonSets = gameSession.dartSets.count { it.winner?.id == winner.id }
        val isGameWon = config.sets == playerWonSets

        gameSessionRepository.save(gameSession)

        return LegWinResult(isSetWon = isSetWon, isGameWon = isGameWon)
    }

    private fun createNewLeg(
        gameSession: GameSession,
        currentDartSet: DartSet,
    ) {
        val newLeg = Leg().apply { this.dartSet = currentDartSet }
        currentDartSet.legs.add(newLeg)

        val config = getConfig(gameSession)
        val startingPlayer = getStartingPlayerForNewLeg(gameSession, config)
        val firstTurn =
            Turn().apply {
                this.player = startingPlayer
                this.leg = newLeg
                this.turnOrderIndex = 0
            }
        newLeg.turns.add(firstTurn)

        gameSessionRepository.save(gameSession)
    }

    private fun createNewSet(gameSession: GameSession) {
        val newDartSet = DartSet().apply { this.gameSession = gameSession }
        gameSession.dartSets.add(newDartSet)
        createNewLeg(gameSession, newDartSet)
    }

    private fun getStartingPlayerForNewLeg(
        gameSession: GameSession,
        config: X01Config,
    ): Player {
        val currentLegCount = gameSession.dartSets.sumOf { it.legs.size }
        val startingPlayerIndex = (currentLegCount - 1) % config.playerOrder.size
        val startingPlayerId = config.playerOrder[startingPlayerIndex]

        return gameSession.players.find { it.id == startingPlayerId } ?: config.startingPlayer
    }

    private fun getLegsWonByPlayer(gameSession: GameSession): Map<Player, Int> =
        gameSession.players.associateWith { player ->
            gameSession.dartSets.sumOf { set ->
                set.legs.count { leg -> leg.winner?.id == player.id }
            }
        }

    private fun getSetsWonByPlayer(gameSession: GameSession): Map<Player, Int> =
        gameSession.players.associateWith { player ->
            gameSession.dartSets.count { set -> set.winner?.id == player.id }
        }

    private fun getDartsThrown(
        currentLeg: Leg,
        currentPlayer: Player,
    ): Int {
        val currentTurn =
            currentLeg.turns.find { it.player.id == currentPlayer.id && it.darts.size < 3 }
        return currentTurn?.darts?.size ?: 0
    }

    private data class LegWinResult(
        val isSetWon: Boolean,
        val isGameWon: Boolean,
    )
}

