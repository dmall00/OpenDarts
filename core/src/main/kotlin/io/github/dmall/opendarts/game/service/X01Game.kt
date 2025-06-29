package io.github.dmall.opendarts.game.service

import io.github.dmall.opendarts.game.model.*
import io.github.dmall.opendarts.game.model.Set
import io.github.dmall.opendarts.game.repository.GameSessionRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

@Service
class X01Game @Autowired constructor(val gameSessionRepository: GameSessionRepository) :
    DartGameModeHandler {

    override fun processDartThrow(
        gameSession: GameSession,
        currentPlayer: Player,
        dartThrow: DartThrow,
    ): GameResult {
        val config = getConfig(gameSession)
        val currentLeg = getCurrentLeg(gameSession)
        val currentTurn = getCurrentTurn(currentLeg)
        val currentScore = getCurrentScore(config, currentPlayer, currentLeg)
        val throwScore = dartThrow.computedScore

        val newScore = currentScore - throwScore

        if (isBust(newScore)) {
            return GameResult(
                isValidThrow = true,
                scoreChange = 0,
                remainingScore = currentScore,
                bust = true,
                nextPlayer = getNextPlayer(gameSession, currentPlayer),
                message = "Bust",
            )
        }

        if (isFinishLeg(config, newScore, dartThrow)) {
            val (isSetWon, isGameWon) = handleLegWin(gameSession, currentPlayer, currentLeg)
            return GameResult(
                isValidThrow = true,
                scoreChange = throwScore,
                remainingScore = 0,
                isLegWon = true,
                isSetWon = isSetWon,
                isGameWon = isGameWon,
                winner = if (isGameWon) currentPlayer else null,
                nextPlayer = if (!isGameWon) getNextPlayer(gameSession, currentPlayer) else null,
                message =
                    when {
                        isGameWon -> "Game won!"
                        isSetWon -> "Set won!"
                        else -> "Leg won!"
                    },
            )
        }

        handleDartThrow(gameSession, currentPlayer, dartThrow, currentTurn, currentLeg)

        return GameResult(
            isValidThrow = true,
            scoreChange = throwScore,
            remainingScore = newScore,
            nextPlayer =
                if (shouldSwitchPlayer(currentTurn)) getNextPlayer(gameSession, currentPlayer)
                else currentPlayer,
        )
    }

    private fun getCurrentTurn(currentLeg: Leg): Turn =
        currentLeg.turns.lastOrNull() ?: error("Current turn not found")

    private fun handleDartThrow(
        gameSession: GameSession,
        currentPlayer: Player,
        dartThrow: DartThrow,
        lastTurn: Turn,
        currentLeg: Leg,
    ) {
        if (lastTurn.darts.count() < 3) {
            lastTurn.darts.add(
                Dart().apply {
                    this.score = dartThrow.score
                    this.multiplier = dartThrow.multiplier
                }
            )
        }

    }

    private fun shouldSwitchPlayer(currentTurn: Turn): Boolean {
        return currentTurn.darts.count() >= 3
    }

    private fun isFinishLeg(config: X01Config, newScore: Int, dartThrow: DartThrow): Boolean {
        val isValidDoubleOut = config.doubleOut && dartThrow.multiplier == 2
        val isValidSingleOut = !config.doubleOut
        return newScore == 0 && (isValidDoubleOut || isValidSingleOut)
    }

    private fun isBust(newScore: Int): Boolean = newScore < 0

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
        val playerToRemainingScoreMap =
            gameSession.players.associateWith { player ->
                getRemainingScore(gameSession, player, currentLeg)
            }

        return GameState(
            currentLeg = gameSession.sets.size,
            scores = playerToRemainingScoreMap,
            currentPlayer = getCurrentPlayer(currentLeg),
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

    private fun getCurrentPlayer(leg: Leg): Player =
        leg.turns.lastOrNull()?.player ?: error("No last turn found")

    private fun getConfig(gameSession: GameSession): X01Config =
        gameSession.game.gameConfig as X01Config

    private fun getCurrentLeg(gameSession: GameSession): Leg =
        gameSession.sets.lastOrNull()?.legs?.lastOrNull() ?: error("No current leg found")

    override fun initializeGame(gameSession: GameSession) {
        val set = Set().apply { this.gameSession = gameSession }
        gameSession.sets.add(set)

        val leg = Leg().apply { this.set = set }
        set.legs.add(leg)
        val initialTurns =
            gameSession.players.map { player ->
                Turn().apply {
                    this.player = player
                    this.leg = leg
                }
            }
        leg.turns.addAll(initialTurns)
        gameSessionRepository.save(gameSession)
    }

    override fun isValidThrow(
        gameSession: GameSession,
        currentPlayer: Player,
        dartThrow: DartThrow,
    ): Boolean {
        return true
    }

    override fun getGameMode(): GameMode = GameMode.X01

    private fun handleLegWin(
        gameSession: GameSession,
        winner: Player,
        currentLeg: Leg,
    ): LegWinResult {
        currentLeg.winner = winner
        val isSetWon = isSetWon(gameSession, currentLeg, winner)
        return LegWinResult(isSetWon = isSetWon, isGameWon = isGameWon(gameSession, winner))
    }

    private fun isGameWon(gameSession: GameSession, winner: Player): Boolean {
        val playerWonSets = gameSession.sets.count { it.winner?.id == winner.id }
        return getConfig(gameSession).sets == playerWonSets
    }

    private fun isSetWon(gameSession: GameSession, currentLeg: Leg, winner: Player): Boolean {
        val legsToWin = getConfig(gameSession).legs
        val currentSet = gameSession.sets.first { currentLeg.set.id == it.id }
        val playerWonLegs = currentSet.legs.count { it.winner?.id == winner.id }
        val isSetWon = legsToWin == playerWonLegs
        if (isSetWon) {
            currentSet.winner = winner
        }
        return isSetWon
    }

    private data class LegWinResult(val isSetWon: Boolean, val isGameWon: Boolean)
}
