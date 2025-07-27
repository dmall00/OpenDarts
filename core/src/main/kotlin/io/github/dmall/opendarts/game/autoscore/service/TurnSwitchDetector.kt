import org.springframework.stereotype.Service
import java.util.*

@Service
class TurnSwitchDetector {

    data class DetectionSummary(
        var yoloErrors: Int = 0,
        var missingCalibrations: Int = 0,
        var detectedDarts: Int = 0
    )

    private val previousSummaries: MutableMap<String, DetectionSummary> =
        Collections.synchronizedMap(mutableMapOf())

    fun isTurnSwitch(
        playerId: String,
        sessionId: String,
        currentYoloErrors: Int,
        currentMissingCalibrations: Int,
        currentDetectedDarts: Int,
        dartThreshold: Int = 3
    ): Boolean {
        val key = "$playerId/$sessionId"
        val prevSummary = previousSummaries.getOrPut(key) { DetectionSummary() }

        val yoloErrorDelta = currentYoloErrors - prevSummary.yoloErrors
        val calibrationErrorDelta = currentMissingCalibrations - prevSummary.missingCalibrations
        val dartDelta = currentDetectedDarts - prevSummary.detectedDarts

        prevSummary.yoloErrors = currentYoloErrors
        prevSummary.missingCalibrations = currentMissingCalibrations
        prevSummary.detectedDarts = currentDetectedDarts

        val tooManyErrors = (yoloErrorDelta > 5) || (calibrationErrorDelta > 5)
        val enoughDarts = dartDelta >= dartThreshold

        return enoughDarts && !tooManyErrors
    }
}
