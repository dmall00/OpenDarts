package io.github.dmall.opendarts.game.autoscore.service

import io.github.dmall.opendarts.game.autoscore.events.DartThrowDetectedEvent
import io.github.dmall.opendarts.game.autoscore.events.ManualDartAdjustment
import io.github.dmall.opendarts.game.autoscore.events.TurnSwitchDetectedEvent
import io.github.dmall.opendarts.game.autoscore.model.*
import io.github.dmall.opendarts.game.model.DartThrowRequest
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.ApplicationEventPublisher
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Service
import java.util.*

private const val DISTANCE_THRESHOLD = 0.04
private const val CONFIDENCE_THRESHOLD = 0.4
private const val MISS_DART_CONFIDENCE_THRESHOLD = 0.8
private const val FPS = 1
private const val REQUIRED_APPEARANCES = 2
private const val MAX_FRAMES_WITHOUT_APPEARANCE = 2

/**
 * Service that receives the results of the autoscoring python server and manages a state of
 * confirmed darts for a player.
 */
// TODO handle case where two darts are close to each other and same score
// TODO bug with bust where 1 - 2 misses go into next turn
// TODO feature to block dart that was removed from being recognized again in the same turn
@Service
class AutoScoreStabilizer
@Autowired
constructor(
  applicationEventPublisher: ApplicationEventPublisher,
  private val turnSwitchDetector: TurnSwitchDetector,
) : AutoScoreBaseService(applicationEventPublisher) {

  private val logger = KotlinLogging.logger {}
  private val detectionStates: MutableMap<String, DetectionState> =
    Collections.synchronizedMap(mutableMapOf())

  /** Main entry point to process a dart detection result from the autoscore pipeline */
  fun processDartDetectionResult(detection: PipelineDetectionResponse) {
    if (!isValidDetection(detection)) {
      logger.info { "Invalid autoscore result received" }
      return
    }

    val id = composeId(detection.playerId, detection.sessionId)
    val detectionState = detectionStates.getOrPut(id) { DetectionState() }
    detectionState.frameIndex++
    when {
      detection.detectionResult.resultCode.isYoloError() -> handleYoloError(detectionState)
      detection.detectionResult.resultCode.isMissingCalibration() ->
        handleMissingCalibration(detectionState)

      else ->
        handleDartRecognition(
          detection.detectionResult,
          detectionState,
          id,
          detection.playerId,
          detection.sessionId,
        )
    }
  }

  /** Event listener to sync back from manual scoring */
  @EventListener
  fun consumeManualDartTrackedEvent(manualDartAdjustment: ManualDartAdjustment) {
    val id = composeId(manualDartAdjustment.playerId, manualDartAdjustment.sessionId)
    val detectionState = detectionStates.getOrPut(id) { DetectionState() }
    if (manualDartAdjustment.dartThrowRequest != null) {
      if (detectionState.confirmedDarts.size < 3) {
        if (manualDartAdjustment.bust) {
          logger.info { "Manual bust detected, filling up to 3 darts with misses." }
          repeat(3 - detectionState.confirmedDarts.size) {
            logger.info { "Registering missed dart for bust." }
            detectionState.confirmedDarts.add(
              ConfirmedDart(
                Pair(0.0, 0.0),
                score = 0,
                multiplier = 0,
                origin = DartOrigin.MANUAL_BUST,
              )
            )
          }
        } else {
          logger.info { "Manual dart detected, adding to confirmed darts." }
          detectionState.confirmedDarts +=
            ConfirmedDart(
              Pair(0.0, 0.0),
              score = manualDartAdjustment.dartThrowRequest.score,
              multiplier = manualDartAdjustment.dartThrowRequest.multiplier,
              origin = DartOrigin.MANUAL_SCORING,
            )
        }
      }
    }
    val dartRevertRequest = manualDartAdjustment.dartRevertRequest
    if (dartRevertRequest != null) {
      detectionState.confirmedDarts.removeLastOrNull()
    }
  }

  private fun handleYoloError(detectionState: DetectionState) {
    detectionState.yoloErrors++
  }

  private fun handleMissingCalibration(detectionState: DetectionState) {
    detectionState.missingCalibrations++
  }

  private fun handleDartRecognition(
    detectionResult: DetectionResult,
    detectionState: DetectionState,
    id: String,
    playerId: String,
    sessionId: String,
  ) {
    val imageDarts = detectionResult.scoringResult?.dartDetections ?: return
    val dartInfo =
      imageDarts
        .mapIndexed { index, dart ->
          val scoreText =
            if (dart.dartScore.multiplier == 1) {
              "${dart.dartScore.singleValue}"
            } else {
              "${dart.dartScore.multiplier}x${dart.dartScore.singleValue}"
            }

          "Dart ${index + 1}: $scoreText (confidence: ${
                        String.format(
                            "%.3f",
                            dart.originalPosition.confidence,
                        )
                    })"
        }
        .joinToString(", ")
    logger.info { "Recognized ${imageDarts.size} darts on board: [$dartInfo]" }

    val confirmedDarts = detectionState.confirmedDarts
    val currentImageDarts = extractDartPositions(imageDarts)

    if (confirmedDarts.size >= 3) {
      handleThreeDartsConfirmed(currentImageDarts, detectionState, playerId, sessionId)
      return
    }

    val hasDartsOnBoardBefore =
      !detectionState.isNewTurnAndBoardCleared || confirmedDarts.isNotEmpty()
    val (shouldRegisterMisses, missCount) =
      turnSwitchDetector.detectMissedDarts(
        id,
        confirmedDarts.size,
        currentImageDarts.size,
        hasDartsOnBoardBefore,
      )

    if (shouldRegisterMisses) {
      registerMissedDarts(missCount, playerId, sessionId, confirmedDarts)
      handleThreeDartsConfirmed(currentImageDarts, detectionState, playerId, sessionId)
      return
    }

    if (detectionState.isNewTurnAndBoardCleared) {
      updatePendingDarts(imageDarts, detectionState)
      promoteConfirmedPendingDarts(detectionState, playerId, sessionId)
    } else {
      logger.info { "Waiting for board to be cleared before accepting new darts." }
    }
  }

  private fun updatePendingDarts(imageDarts: List<DartDetection>, detectionState: DetectionState) {
    val pendingDarts = detectionState.pendingDarts
    val confirmedDarts = detectionState.confirmedDarts

    pendingDarts.forEach { pending -> pending.framesSinceLastSeen++ }

    for (dart in imageDarts) {
      val pos = toPair(dart)
      val confidence = dart.originalPosition.confidence
      val multiplier = dart.dartScore.multiplier
      val score = dart.dartScore.singleValue
      val imageDart = AutoScoreDart(pos, score, multiplier)

      if (!isWithinConfidenceThreshold(confidence, score)) {
        continue
      }

      if (confirmedDarts.any { confirmedDart -> isSameDart(imageDart, confirmedDart) }) {
        continue
      }

      val matchingPending = pendingDarts.find { pendingDart -> isSameDart(imageDart, pendingDart) }

      if (matchingPending != null) {
        matchingPending.appearanceCount++
        matchingPending.lastSeenFrameIndex = detectionState.frameIndex
        matchingPending.framesSinceLastSeen = 0
        logger.info {
          "Updated pending dart at $pos with score ${multiplier}x$score, count: ${matchingPending.appearanceCount}"
        }
      } else {
        val newPending =
          PendingDart(
            position = pos,
            score = score,
            multiplier = multiplier,
            appearanceCount = 1,
            lastSeenFrameIndex = detectionState.frameIndex,
            framesSinceLastSeen = 0,
          )
        pendingDarts.add(newPending)
        logger.info { "Added new pending dart at $pos with score ${multiplier}x$score" }
      }
    }

    pendingDarts.removeAll { pending ->
      pending.framesSinceLastSeen > MAX_FRAMES_WITHOUT_APPEARANCE
    }
  }

  private fun promoteConfirmedPendingDarts(
    detectionState: DetectionState,
    playerId: String,
    sessionId: String,
  ) {
    val pendingDarts = detectionState.pendingDarts
    val confirmedDarts = detectionState.confirmedDarts

    val dartsToPromote = pendingDarts.filter { it.appearanceCount >= REQUIRED_APPEARANCES }

    for (pending in dartsToPromote) {
      logger.info {
        "Promoting pending dart to confirmed: ${pending.position}, score: ${pending.multiplier}x${pending.score}, appeared ${pending.appearanceCount} times"
      }
      confirmedDarts.add(
        ConfirmedDart(
          pending.position,
          score = pending.score,
          multiplier = pending.multiplier,
          origin = DartOrigin.AUTO_SCORE,
        )
      )
      val dartThrowRequest = DartThrowRequest(pending.multiplier, pending.score, true)
      applicationEventPublisher.publishEvent(
        DartThrowDetectedEvent(this, sessionId, playerId, dartThrowRequest)
      )
    }
    pendingDarts.removeAll(dartsToPromote)
    turnSwitchDetector.checkMaximumDartsReached(confirmedDarts.size, detectionState)
  }

  private fun registerMissedDarts(
    missCount: Int,
    playerId: String,
    sessionId: String,
    confirmedDarts: MutableList<ConfirmedDart>,
  ) {
    logger.info { "Registering $missCount missed dart(s) for player $playerId" }
    for (i in 0 until missCount) {
      val dartThrowRequest = DartThrowRequest(1, 0, true)
      applicationEventPublisher.publishEvent(
        DartThrowDetectedEvent(this, sessionId, playerId, dartThrowRequest)
      )

      confirmedDarts.add(
        ConfirmedDart(
          (-1.0 - i) to -1.0,
          score = 0,
          multiplier = 0,
          origin = DartOrigin.AUTO_SCORE_MISS,
        )
      )
    }
  }

  private fun handleThreeDartsConfirmed(
    currentImageDarts: List<Pair<Double, Double>>,
    detectionState: DetectionState,
    playerId: String,
    sessionId: String,
  ) {
    if (
      turnSwitchDetector.handleThreeDartsState(
        currentImageDarts.size,
        detectionState,
        playerId,
        sessionId,
      )
    ) {
      resetStateForNewTurn(playerId, sessionId, detectionState)
    }
  }

  private fun extractDartPositions(darts: List<DartDetection>): List<Pair<Double, Double>> =
    darts.map { dart -> toPair(dart) }

  private fun isWithinConfidenceThreshold(confidence: Float, score: Int): Boolean =
    (confidence > CONFIDENCE_THRESHOLD && score != 0) ||
      (confidence > MISS_DART_CONFIDENCE_THRESHOLD && score == 0)

  private fun toPair(dart: DartDetection): Pair<Double, Double> =
    dart.transformedPosition.x.toDouble() to dart.transformedPosition.y.toDouble()

  private fun resetStateForNewTurn(
    playerId: String,
    sessionId: String,
    detectionState: DetectionState,
  ) {
    detectionState.confirmedDarts.clear()
    detectionState.pendingDarts.clear()
    turnSwitchDetector.resetStateForNewTurn(playerId, sessionId, detectionState)
    logger.info { "Cleared tracked darts for new turn." }
    applicationEventPublisher.publishEvent(TurnSwitchDetectedEvent(this, sessionId, playerId))
  }

  private fun isSameDart(current: AutoScoreDart, previous: AutoScoreDart): Boolean =
    calculateDistance(current.position, previous.position) < DISTANCE_THRESHOLD &&
      current.score == previous.score &&
      current.multiplier == previous.multiplier
}
