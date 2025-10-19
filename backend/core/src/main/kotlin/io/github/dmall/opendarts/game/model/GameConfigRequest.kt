package io.github.dmall.opendarts.game.model

data class GameConfigRequest(val gameMode: GameMode, val score: Int, val players: List<PlayerRequest>)

data class GameSessionResponse(val gameId: String)
