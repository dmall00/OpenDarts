package io.github.dmall.opendarts.game.model

import jakarta.persistence.*

enum class GameMode {
    X01,
    AROUND_THE_WORLD,
    PRACTICE
}

@Entity
class Game {
    @Id
    @GeneratedValue
    var id: Long? = null

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    lateinit var gameMode: GameMode
}

@Entity
class Player {
    @Id
    @GeneratedValue
    var id: Long? = null

    @Column(nullable = false)
    lateinit var name: String

    @ManyToMany(mappedBy = "players")
    val gameSessions: MutableList<GameSession> = mutableListOf()
}

@Entity
class GameSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: String? = null

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    lateinit var game: Game

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

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    lateinit var gameSession: GameSession

    @OneToMany(mappedBy = "leg", cascade = [CascadeType.ALL])
    val turns: MutableList<Turn> = mutableListOf()
}

@Entity
class Turn {
    @Id
    @GeneratedValue
    var id: Long? = null

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    lateinit var player: Player

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    lateinit var leg: Leg

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

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    lateinit var turn: Turn
}
