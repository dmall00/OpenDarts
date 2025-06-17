package io.github.dmall.opendarts.game.autoscore.rest.model

import io.github.dmall.opendarts.game.model.GameType

data class GameTo(val gameType: GameType, val players: List<PlayerTo>)

data class PlayerTo(val username: String)
