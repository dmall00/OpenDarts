package io.github.dmall.opendarts.game.autoscore.model

import org.springframework.boot.context.properties.ConfigurationProperties


@ConfigurationProperties(prefix = "autoscore")
data class AutoScoreProperties(
    val host: String,
    val port: Int
)