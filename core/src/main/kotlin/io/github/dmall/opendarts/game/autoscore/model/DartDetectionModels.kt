package io.github.dmall.opendarts.game.autoscore.model

enum class RequestType {
    CALIBRATION,
    SCORING,
    FULL,
    PING

}

class CalibrationResult(

    val homographyMatrix: Array<IntArray>,
    val calibrationPoints: List<CalibrationPoint>,
    val preprocessingResult: PreprocessingResult

)

class PreprocessingResult(val cropInfo: CropInformation) {

}

class CropInformation(val xOffset: Int, val yOffset: Int, val width: Int, val height: Int) {

}

class CalibrationPoint(val classId: Int, val pointType: String, val message: String) {


}

class ScoringResult(val dartDetections: List<DartDetection>)

class DartDetection(
    val dartScore: DartScore,
    val originalPosition: DartPosition,
    val transformedPosition: DartPosition
) {

}

class DartPosition(val x: Int, val y: Int)

class DartScore(val scoreString: String, val scoreValue: Int) {

}

class DetectionResult(val scoringResult: ScoringResult, val calibrationResult: CalibrationResult)
