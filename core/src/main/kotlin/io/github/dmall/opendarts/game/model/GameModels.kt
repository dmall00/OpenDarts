package io.github.dmall.opendarts.game.model

data class DartThrow(val multiplier: Int, val score: Int) {
    val computedScore: Int
        get() = score * multiplier
}