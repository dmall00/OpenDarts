package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.model.*
import io.github.dmall.opendarts.game.repository.GameSessionRepository
import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.transaction.Transactional
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

@Service
class X01Game @Autowired constructor(val gameSessionRepository: GameSessionRepository) :
    DartGameModeHandler {

        private val logger = KotlinLogging.logger {}

    override fun processDartThrow(
        gameSession: GameSession,
        currentPlayer: Player,
        dartThrow: DartThrow,
    ): GameResult {
        val config = getConfig(gameSession)
        val currentLeg = getCurrentLeg(gameSession)
        val currentTurn = getCurrentTurn(currentLeg, currentPlayer)
        val currentScore = getCurrentScore(config, currentPlayer, currentLeg)
        val throwScore = dartThrow.computedScore

        val newScore = currentScore - throwScore

        if (isBust(newScore, config, dartThrow)) {
            logger.info { "Bust detected" }
            fillMissDarts(currentTurn)
            val nextPlayer = getNextPlayer(gameSession, currentPlayer)
            logger.info { "Next player is $nextPlayer" }
            createNewTurnIfNeeded(currentLeg, nextPlayer!!, gameSession)

            return GameResult(
                isValidThrow = true,
                scoreChange = 0,
                remainingScore = currentScore,
                bust = true,
                nextPlayer = nextPlayer,
                message = "Bust",
            )
        }

        if (isFinishLeg(config, newScore, dartThrow)) {
            logger.info { "Leg is finished" }
            handleDartThrow(gameSession, dartThrow, currentTurn)
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
            return GameResult(
                isValidThrow = true,
                scoreChange = throwScore,
                remainingScore = 0,
                isLegWon = true,
                isSetWon = isSetWon,
                isGameWon = isGameWon,
                winner = if (isGameWon) currentPlayer else null,
                nextPlayer = nextPlayer,
                message =
                    when {
                        isGameWon -> "Game won!"
                        isSetWon -> "Set won!"
                        else -> "Leg won!"
                    },
            )
        }

        handleDartThrow(gameSession, dartThrow, currentTurn)

        val shouldSwitch = shouldSwitchPlayer(currentTurn)
        val nextPlayer =
            if (shouldSwitch) {
                logger.info { "Turn completed switching player" }
                val next = getNextPlayer(gameSession, currentPlayer)!!
                createNewTurnIfNeeded(currentLeg, next, gameSession)
                next
            } else {
                currentPlayer
            }

        return GameResult(
            isValidThrow = true,
            scoreChange = throwScore,
            remainingScore = newScore,
            nextPlayer = nextPlayer,
        )
    }

    private fun fillMissDarts(currentTurn: Turn) {
        while (currentTurn.darts.size < 3) {
            val dart = Dart().apply {
                this.score = 0
                this.multiplier = 0
                this.turn = currentTurn
            }
            currentTurn.darts.add(dart)
        }
    }

    private fun getCurrentTurn(currentLeg: Leg, currentPlayer: Player): Turn =
        currentLeg.turns
            .filter { it.player.id == currentPlayer.id }
            .lastOrNull { it.darts.size < 3 } ?: error("No active turn found for current player")

    private fun handleDartThrow(gameSession: GameSession, dartThrow: DartThrow, currentTurn: Turn) {
        logger.info { "Handling new throw ${dartThrow.computedScore}" }
        if (currentTurn.darts.count() < 3) {
            val dart =
                Dart().apply {
                    this.score = dartThrow.score
                    this.multiplier = dartThrow.multiplier
                    this.turn = currentTurn
                }
            currentTurn.darts.add(dart)
        }
        logger.info { "Currently ${currentTurn.darts.count()} darts in turn" }
        gameSessionRepository.save(gameSession)
    }

    private fun shouldSwitchPlayer(currentTurn: Turn): Boolean {
        return currentTurn.darts.count() >= 3
    }

    private fun isFinishLeg(config: X01Config, newScore: Int, dartThrow: DartThrow): Boolean {
        if (newScore != 0) return false
        if (config.doubleOut && dartThrow.multiplier != 2) return false
        return true
    }

    private fun isBust(newScore: Int, config: X01Config, dartThrow: DartThrow): Boolean {
        if (newScore < 0) return true
        if (newScore == 0 && config.doubleOut && dartThrow.multiplier != 2) return true
        if (newScore == 1 && config.doubleOut) return true
        return false
    }

    private fun getNextPlayer(gameSession: GameSession, currentPlayer: Player): Player? {
        val config = getConfig(gameSession)
        val currentIndex = config.playerOrder.indexOf(currentPlayer.id)
        if (currentIndex == -1) return null

        val nextIndex = (currentIndex + 1) % config.playerOrder.size
        val nextPlayerId = config.playerOrder[nextIndex]

        return gameSession.players.find { it.id == nextPlayerId }
    }

    private fun getCurrentScore(config: X01Config, currentPlayer: Player, currentLeg: Leg): Int {
        val accumulatedScore =
            currentLeg.turns
                .filter { it.player.id == currentPlayer.id }
                .flatMap { it.darts }
                .sumOf { it.score * it.multiplier }

        return config.startingScore - accumulatedScore
    }

    override fun getGameState(gameSession: GameSession): GameState {
        val currentLeg = getCurrentLeg(gameSession)
        val currentPlayer = getCurrentPlayer(gameSession)
        val playerToRemainingScoreMap =
            gameSession.players.associateWith { player ->
                getRemainingScore(gameSession, player, currentLeg)
            }

        return GameState(
            currentLeg = gameSession.dartSets.sumOf { it.legs.size },
            currentSet = gameSession.dartSets.size,
            scores = playerToRemainingScoreMap,
            currentPlayer = currentPlayer,
            legsWon = getLegsWonByPlayer(gameSession),
            setsWon = getSetsWonByPlayer(gameSession),
            dartsThrown = getDartsThrown(currentLeg, currentPlayer),
        )
    }

    private fun getRemainingScore(gameSession: GameSession, player: Player, currentLeg: Leg): Int {
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
        val incompleteTurn = currentLeg.turns.find { it.darts.size < 3 }

        return incompleteTurn?.player ?: error("No current player found - all turns are complete")
    }

    private fun getConfig(gameSession: GameSession): X01Config =
        gameSession.game.gameConfig as X01Config

    private fun getCurrentLeg(gameSession: GameSession): Leg =
        gameSession.dartSets.lastOrNull()?.legs?.lastOrNull() ?: error("No current leg found")

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

    private fun createNewTurnIfNeeded(
        currentLeg: Leg,
        nextPlayer: Player,
        gameSession: GameSession,
    ) {
        val existingTurn =
            currentLeg.turns.find { it.player.id == nextPlayer.id && it.darts.size < 3 }

        if (existingTurn == null) {
            logger.info { "Creating new turn" }
            val nextTurnOrder = currentLeg.turns.maxOfOrNull { it.turnOrderIndex } ?: -1
            val newTurn =
                Turn().apply {
                    this.player = nextPlayer
                    this.leg = currentLeg
                    this.turnOrderIndex = nextTurnOrder + 1
                }
            currentLeg.turns.add(newTurn)
            gameSessionRepository.save(gameSession)
        }
    }

    private fun createNewLeg(gameSession: GameSession, currentDartSet: DartSet) {
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

    private fun getStartingPlayerForNewLeg(gameSession: GameSession, config: X01Config): Player {
        val currentLegCount = gameSession.dartSets.sumOf { it.legs.size }
        val startingPlayerIndex = (currentLegCount - 1) % config.playerOrder.size
        val startingPlayerId = config.playerOrder[startingPlayerIndex]

        return gameSession.players.find { it.id == startingPlayerId } ?: config.startingPlayer
    }

    private fun getLegsWonByPlayer(gameSession: GameSession): Map<Player, Int> {
        return gameSession.players.associateWith { player ->
            gameSession.dartSets.sumOf { set ->
                set.legs.count { leg -> leg.winner?.id == player.id }
            }
        }
    }

    private fun getSetsWonByPlayer(gameSession: GameSession): Map<Player, Int> {
        return gameSession.players.associateWith { player ->
            gameSession.dartSets.count { set -> set.winner?.id == player.id }
        }
    }

    private fun getDartsThrown(currentLeg: Leg, currentPlayer: Player): Int {
        val currentTurn =
            currentLeg.turns.find { it.player.id == currentPlayer.id && it.darts.size < 3 }
        return currentTurn?.darts?.size ?: 0
    }

    private data class LegWinResult(val isSetWon: Boolean, val isGameWon: Boolean)
}
