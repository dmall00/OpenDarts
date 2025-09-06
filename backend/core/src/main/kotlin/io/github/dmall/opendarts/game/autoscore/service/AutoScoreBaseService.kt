package io.github.dmall.opendarts.game.autoscore.service

import io.github.dmall.opendarts.game.autoscore.model.PipelineDetectionResponse
import org.springframework.context.ApplicationEventPublisher
import kotlin.math.sqrt

abstract class AutoScoreBaseService(
    protected val applicationEventPublisher: ApplicationEventPublisher,
) {
    protected fun isValidDetection(detection: PipelineDetectionResponse): Boolean = detection.status.isSuccess()

    protected fun composeId(
        playerId: String,
        sessionId: String,
    ): String = "$playerId/$sessionId"

    protected fun calculateDistance(
        pos1: Pair<Double, Double>,
        pos2: Pair<Double, Double>,
    ): Double {
        val dx = pos1.first - pos2.first
        val dy = pos1.second - pos2.second
        return sqrt(dx * dx + dy * dy)
    }
}
