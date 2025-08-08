package io.github.dmall.opendarts.game.autoscore.service

import io.github.dmall.opendarts.game.autoscore.model.DetectionState
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Service

// Constants for miss detection
private const val EMPTY_FRAMES_THRESHOLD = 3
private const val MAX_DARTS_PER_TURN = 3

@Service
class TurnSwitchDetector {
    private val logger = KotlinLogging.logger {}
    private val zeroFramesCounter = mutableMapOf<String, Int>()

    /**
     * Checks if the board is cleared for a new turn after three darts have been thrown
     */
    fun handleThreeDartsState(
        currentImageDartsCount: Int,
        detectionState: DetectionState,
        playerId: String,
        sessionId: String,
    ): Boolean {
        if (currentImageDartsCount == 0) {
            logger.info { "Board cleared after 3 darts, ready for next turn." }
            detectionState.isNewTurnAndBoardCleared = true
            return true
        } else {
            logger.info { "3 darts already confirmed, waiting for board to be cleared." }
            detectionState.isNewTurnAndBoardCleared = false
            return false
        }
    }

    /**
     * Resets the detection state for a new turn
     */
    fun resetStateForNewTurn(
        playerId: String,
        sessionId: String,
        detectionState: DetectionState,
    ) {
        val sessionPlayerId = "$playerId/$sessionId"
        detectionState.yoloErrors = 0
        detectionState.missingCalibrations = 0
        detectionState.isNewTurnAndBoardCleared = true
        resetMissCounter(sessionPlayerId)
        logger.info {
            "Turn switch detected for player $playerId in session $sessionId. Resetting error counts."
        }
    }

    /**
     * Check if the maximum number of darts per turn has been reached
     */
    fun checkMaximumDartsReached(
        confirmedDartsCount: Int,
        detectionState: DetectionState,
    ): Boolean {
        if (confirmedDartsCount >= MAX_DARTS_PER_TURN) {
            logger.info { "3 darts confirmed, blocking detection until board is cleared." }
            detectionState.isNewTurnAndBoardCleared = false
            return true
        }
        return false
    }

    /**
     * Detects if a player has missed the dartboard completely.
     * If there were darts previously and now we see 0 darts for multiple consecutive frames,
     * we assume the player missed and should register the remaining throws as zero.
     *
     * @param sessionPlayerId Combined session and player ID to track per player
     * @param confirmedDartsCount Number of darts confirmed for the current player's turn
     * @param currentImageDartsCount Number of darts currently detected in the image
     * @return Pair of (should register missed darts, number of missed darts to register)
     */
    fun detectMissedDarts(
        sessionPlayerId: String,
        confirmedDartsCount: Int,
        currentImageDartsCount: Int,
        hasDartsOnBoardBefore: Boolean,
    ): Pair<Boolean, Int> {
        // If we already have all darts or there are darts on the board, reset counter
        if (confirmedDartsCount >= MAX_DARTS_PER_TURN || currentImageDartsCount > 0) {
            zeroFramesCounter[sessionPlayerId] = 0
            return Pair(false, 0)
        }

        // If there were no darts on the board before, don't count as misses
        if (!hasDartsOnBoardBefore) {
            return Pair(false, 0)
        }

        // Increment counter for consecutive empty frames
        val currentCount = zeroFramesCounter.getOrDefault(sessionPlayerId, 0) + 1
        zeroFramesCounter[sessionPlayerId] = currentCount

        // If we've seen enough consecutive empty frames, register misses
        if (currentCount >= EMPTY_FRAMES_THRESHOLD) {
            val missedDartsCount = MAX_DARTS_PER_TURN - confirmedDartsCount

            if (missedDartsCount > 0) {
                logger.info { "Detected $missedDartsCount missed dart(s) after $currentCount consecutive empty frames" }
                zeroFramesCounter[sessionPlayerId] = 0 // Reset counter
                return Pair(true, missedDartsCount)
            }
        }

        return Pair(false, 0)
    }

    /**
     * Resets the zero frames counter for a specific player/session
     */
    fun resetMissCounter(sessionPlayerId: String) {
        zeroFramesCounter[sessionPlayerId] = 0
    }
}
