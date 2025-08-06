package io.github.dmall.opendarts.game.events

import io.github.dmall.opendarts.game.model.DartThrow
import org.springframework.context.ApplicationEvent

/**
 * Event published when a dart throw is detected by the auto-scoring system
 */
class DartThrowDetectedEvent(
    source: Any,
    val sessionId: String,
    val playerId: String,
    val dartThrow: DartThrow,
) : ApplicationEvent(source)
