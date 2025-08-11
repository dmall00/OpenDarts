package io.github.dmall.opendarts.game.autoscore.events

import io.github.dmall.opendarts.game.model.DartThrow
import org.springframework.context.ApplicationEvent

enum class EventType(
    val type: String,
) {
    DART_THROW_DETECTED("dartProcessedResult"),
    TURN_SWITCH_DETECTED("turnSwitch"),
}

class DartThrowDetectedEvent(
    source: Any,
    val sessionId: String,
    val playerId: String,
    val dartThrow: DartThrow,
    val type: EventType = EventType.DART_THROW_DETECTED,
) : ApplicationEvent(source)

class TurnSwitchDetectedEvent(
    source: Any,
    val sessionId: String,
    val playerId: String,
    val type: EventType = EventType.TURN_SWITCH_DETECTED,
) : ApplicationEvent(source)
