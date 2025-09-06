package io.github.dmall.opendarts.game.autoscore.model

import org.springframework.context.annotation.Configuration

@Configuration
data class StabilizerConfig(

    var clearThreshold: Int = 8,


    )