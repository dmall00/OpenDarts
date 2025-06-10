package io.github.dmall.opendarts.game

import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

@RestController("/app")
class DartAppResource {


    @PostMapping("/calibration")
    fun calibrateDartBoard(@RequestBody calibrationRequest: CalibrationRequest): CalibrationResponse {
        return CalibrationResponse(true)
    }



}