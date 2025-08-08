package io.github.dmall.opendarts.game.autoscore.service

import io.github.dmall.opendarts.game.autoscore.model.DetectionState
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Service

@Service
class TurnSwitchDetector {
    private val logger = KotlinLogging.logger {}

    /**
     * Determines if a turn switch should occur based on the detection state and current board condition
     */
    fun isTurnSwitch(
        detectionState: DetectionState,
        stableDartsSize: Int,
        currentInImageDartsSize: Int,
    ): Boolean {
        val yoloErrors = detectionState.yoloErrors
        val missingCalibrations = detectionState.missingCalibrations

        val tooManyErrors = (yoloErrors > 15) || (missingCalibrations > 15)
        val enoughDarts = stableDartsSize == 3 && currentInImageDartsSize == 0

        return enoughDarts && !tooManyErrors
    }

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
        detectionState.yoloErrors = 0
        detectionState.missingCalibrations = 0
        detectionState.isNewTurnAndBoardCleared = true
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
        if (confirmedDartsCount >= 3) {
            logger.info { "3 darts confirmed, blocking detection until board is cleared." }
            detectionState.isNewTurnAndBoardCleared = false
            return true
        }
        return false
    }
}
