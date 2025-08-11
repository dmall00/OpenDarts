package io.github.dmall.opendarts.game.autoscore.service

import io.github.dmall.opendarts.game.autoscore.events.CalibrationEvent
import io.github.dmall.opendarts.game.autoscore.model.CalibrationPoint
import io.github.dmall.opendarts.game.autoscore.model.CalibrationResult
import io.github.dmall.opendarts.game.autoscore.model.CalibrationState
import io.github.dmall.opendarts.game.autoscore.model.PipelineDetectionResponse
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import java.util.*

private const val MIN_CALIBRATION = 5
private const val MAX_INVALID_CALIBRATION = 5
private const val POSITION_SIMILARITY_THRESHOLD = 0.01

@Service
class AutoScoreCalibrationService
    @Autowired
    constructor(
        applicationEventPublisher: ApplicationEventPublisher,
    ) : AutoScoreBaseService(applicationEventPublisher) {
        private val logger = KotlinLogging.logger {}

        private val calibrationStates: MutableMap<String, CalibrationState> = Collections.synchronizedMap(mutableMapOf())

        fun isBoardCalibrated(detection: PipelineDetectionResponse): Boolean {
            if (!isValidDetection(detection)) {
                logger.info { "Invalid autoscore result received" }
                return false
            }
            val id = composeId(detection.playerId, detection.sessionId)
            val calibrationState = calibrationStates.getOrPut(id) { CalibrationState() }

            if (detection.detectionResult.calibrationResult == null) {
                calibrationState.consecutiveFailedCalibrations++
                logger.info { "No calibration result received" }
                return false
            }
            return when {
                detection.detectionResult.resultCode.isYoloError() -> {
                    calibrationState.consecutiveFailedCalibrations++

                    false
                }

                detection.detectionResult.resultCode.isMissingCalibration() -> {
                    calibrationState.consecutiveFailedCalibrations++
                    false
                }

                else ->
                    determineCalibration(
                        calibrationState,
                        detection.detectionResult.calibrationResult,
                        detection.playerId,
                        detection.sessionId,
                    )
            }
        }

        private fun determineCalibration(
            calibrationState: CalibrationState,
            calibrationResult: CalibrationResult,
            playerId: String,
            gameId: String,
        ): Boolean {
            val calibrationPoints = calibrationResult.calibrationPoints

            val calibrationList = calibrationState.calibrationList

            if (!hasConsistentClassLabels(calibrationState, calibrationPoints)) {
                handleFailedCalibration(calibrationState, playerId, gameId)
                return false
            }

            if (calibrationList.size < MIN_CALIBRATION) {
                addFirstCalibrations(calibrationList, calibrationPoints)
                calibrationState.consecutiveCalibrations++
                logger.info { "Calibration ${calibrationState.consecutiveCalibrations}/$MIN_CALIBRATION collected" }
                calibrationState.consecutiveFailedCalibrations = 0
                return false
            }

            if (calibrationState.consecutiveCalibrations == MIN_CALIBRATION) {
                logger.info { "Board calibrated with ${calibrationState.consecutiveCalibrations} calibrations" }
                applicationEventPublisher.publishEvent(CalibrationEvent(this, gameId, playerId, true))
            }

            logger.debug { "Passed calibration: $calibrationResult" }
            calibrationState.consecutiveCalibrations++
            calibrationState.consecutiveFailedCalibrations = 0
            return true
        }

        private fun addFirstCalibrations(
            calibrationList: MutableList<Map<Int, Pair<Double, Double>>>,
            calibrationPoints: List<CalibrationPoint>,
        ) {
            val pointMap = mutableMapOf<Int, Pair<Double, Double>>()
            calibrationList.add(pointMap)
            calibrationPoints.forEach {
                pointMap[it.classId] = Pair(it.x, it.y)
            }
            logger.debug { "Added initial calibration: $calibrationList" }
        }

        private fun hasConsistentClassLabels(
            calibrationState: CalibrationState,
            newPoints: List<CalibrationPoint>,
        ): Boolean {
            return calibrationState.calibrationList.all { prevCalibration ->
                newPoints.all { newPoint ->
                    val prevCalibrationPoint = prevCalibration[newPoint.classId]
                    if (prevCalibrationPoint != null) {
                        val distance =
                            calculateDistance(
                                prevCalibrationPoint,
                                Pair(newPoint.x, newPoint.y),
                            )
                        if (distance >= POSITION_SIMILARITY_THRESHOLD) {
                            logger.warn {
                                "Class label inconsistency: classId ${newPoint.classId} with $distance"
                            }
                            return@all false
                        }
                    }
                    true
                }
            }
        }

        private fun handleFailedCalibration(
            calibrationState: CalibrationState,
            playerId: String,
            gameId: String,
        ) {
            calibrationState.consecutiveFailedCalibrations++
            logger.warn { "Failed calibration ${calibrationState.consecutiveFailedCalibrations}/$MAX_INVALID_CALIBRATION" }

            if (calibrationState.consecutiveFailedCalibrations >= MAX_INVALID_CALIBRATION) {
                applicationEventPublisher.publishEvent(CalibrationEvent(this, gameId, playerId, false))
                resetCalibrationState(calibrationState)
                logger.info { "Resetting calibration state after $MAX_INVALID_CALIBRATION consecutive failures" }
            }
        }

        private fun resetCalibrationState(calibrationState: CalibrationState) {
            calibrationState.consecutiveCalibrations = 0
            calibrationState.consecutiveFailedCalibrations++
            calibrationState.calibrationList.clear()
        }
    }
