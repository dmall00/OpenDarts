package io.github.dmall.opendarts.game.model

data class GameConfigTo(val gameMode: GameMode, val score: Int, val players: List<String>)

data class GameSessionResponse(val gameId: String)
