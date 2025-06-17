package io.github.dmall.opendarts.game.model

import jakarta.persistence.*

enum class GameType {
    X01
}

@Entity
class Game {
    @Id
    @GeneratedValue
    var id: Long? = null

    @Enumerated(EnumType.STRING)
    var gameType: GameType? = null
}

@Entity
class Player {
    @Id
    @GeneratedValue
    var id: Long? = null

    var name: String? = null

    @ManyToMany(mappedBy = "players")
    val gameSessions: MutableList<GameSession> = mutableListOf()
}

@Entity
class GameSession {
    @Id
    @GeneratedValue
    var id: Long? = null

    @ManyToOne
    var game: Game? = null

    @OneToMany(mappedBy = "gameSession", cascade = [CascadeType.ALL])
    val legs: MutableList<Leg> = mutableListOf()

    @ManyToMany
    @JoinTable(
        name = "game_session_players",
        joinColumns = [JoinColumn(name = "game_session_id")],
        inverseJoinColumns = [JoinColumn(name = "player_id")]
    )
    val players: MutableList<Player> = mutableListOf()
}

@Entity
class Leg {
    @Id
    @GeneratedValue
    var id: Long? = null

    @ManyToOne
    var gameSession: GameSession? = null

    @OneToMany(mappedBy = "leg", cascade = [CascadeType.ALL])
    val turns: MutableList<Turn> = mutableListOf()
}

@Entity
class Turn {
    @Id
    @GeneratedValue
    var id: Long? = null

    @ManyToOne
    var player: Player? = null

    @ManyToOne
    var leg: Leg? = null

    @OneToMany(mappedBy = "turn", cascade = [CascadeType.ALL])
    val darts: MutableList<Dart> = mutableListOf()
}

@Entity
class Dart {
    @Id
    @GeneratedValue
    var id: Long? = null

    var score: Int = 0
    var multiplier: Int = 1

    @ManyToOne
    var turn: Turn? = null
}