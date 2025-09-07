package io.github.dmall.opendarts.game.autoscore.events

import io.github.dmall.opendarts.game.model.DartThrowRequest
import org.springframework.context.ApplicationEvent

enum class EventType(
    val type: String,
) {
    DART_THROW_DETECTED("dartProcessedResult"),
    TURN_SWITCH_DETECTED("turnSwitch"),
    CALIBRATION("calibration"),
}

abstract class GameEvent(
    source: Any,
    val sessionId: String,
    val playerId: String,
    val type: EventType,
) : ApplicationEvent(source)

class DartThrowDetectedEvent(
    source: Any,
    sessionId: String,
    playerId: String,
    val dartThrowRequest: DartThrowRequest,
) : GameEvent(source, sessionId, playerId, EventType.DART_THROW_DETECTED)

class TurnSwitchDetectedEvent(
    source: Any,
    sessionId: String,
    playerId: String,
) : GameEvent(source, sessionId, playerId, EventType.TURN_SWITCH_DETECTED)

class CalibrationEvent(
    source: Any,
    sessionId: String,
    playerId: String,
    val calibrated: Boolean,
) : GameEvent(source, sessionId, playerId, EventType.CALIBRATION)
