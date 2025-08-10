package io.github.dmall.opendarts.game.autoscore.events

import io.github.dmall.opendarts.game.model.DartThrow
import org.springframework.context.ApplicationEvent

class DartThrowDetectedEvent(
    source: Any,
    val sessionId: String,
    val playerId: String,
    val dartThrow: DartThrow,
) : ApplicationEvent(source)

class TurnSwitchDetectedEvent(
    source: Any,
    val sessionId: String,
    val playerId: String,
) : ApplicationEvent(source)
