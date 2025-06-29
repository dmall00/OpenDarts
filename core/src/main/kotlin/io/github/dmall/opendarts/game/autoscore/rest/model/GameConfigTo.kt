package io.github.dmall.opendarts.game.autoscore.rest.model

import io.github.dmall.opendarts.game.model.GameMode

data class GameConfigTo(val gameMode: GameMode, val score: Int, val players: List<String>)

data class GameSessionResponse(val gameId: String)
