package io.github.dmall.opendarts.game.model

import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.persistence.*

enum class GameMode {
    X01,
}

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "config_type", discriminatorType = DiscriminatorType.STRING)
abstract class GameConfig {
    @Id
    @GeneratedValue
    open var id: Long? = null

    @ManyToOne
    @JoinColumn(name = "starting_player_id")
    open lateinit var startingPlayer: Player

    @ElementCollection
    @CollectionTable(
        name = "game_config_player_order",
        joinColumns = [JoinColumn(name = "game_config_id")],
    )
    @Column(name = "player_id")
    @OrderColumn(name = "turn_order")
    open var playerOrder: MutableList<String> = mutableListOf()
}

@Entity
@DiscriminatorValue("X01")
class X01Config(
    @Column var startingScore: Int = 501,
    @Column var doubleOut: Boolean = true,
    @Column var legs: Int = 1,
    @Column var sets: Int = 1,
) : GameConfig()

@Entity
class Game {
    @Id
    @GeneratedValue
    var id: Long? = null

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    lateinit var gameMode: GameMode

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "game_config_id", nullable = false)
    lateinit var gameConfig: GameConfig
}

@Entity
class Player {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: String? = null

    @Column(nullable = false)
    lateinit var name: String

    @ManyToMany(mappedBy = "players")
    var gameSessions: MutableList<GameSession> = mutableListOf()

    override fun toString(): String = "Player(name='$name')"
}

@Entity
class GameSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: String? = null

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    lateinit var game: Game

    @OneToMany(mappedBy = "gameSession", cascade = [CascadeType.ALL], fetch = FetchType.EAGER, orphanRemoval = true)
    var dartSets: MutableList<DartSet> = mutableListOf()

    @ManyToMany
    @JoinTable(
        name = "game_session_players",
        joinColumns = [JoinColumn(name = "game_session_id")],
        inverseJoinColumns = [JoinColumn(name = "player_id")],
    )
    var players: MutableList<Player> = mutableListOf()
}

@Entity
class DartSet {
    @Id
    @GeneratedValue
    var id: Long? = null

    @ManyToOne(optional = false)
    @JoinColumn(name = "game_session_id", nullable = false)
    lateinit var gameSession: GameSession

    @ManyToOne
    @JoinColumn(name = "winner_id")
    var winner: Player? = null

    @OneToMany(mappedBy = "dartSet", cascade = [CascadeType.ALL], orphanRemoval = true)
    var legs: MutableList<Leg> = mutableListOf()
}

@Entity
class Leg {
    @Id
    @GeneratedValue
    var id: Long? = null

    @ManyToOne
    @JoinColumn(name = "winner_id")
    var winner: Player? = null

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    lateinit var dartSet: DartSet

    @OneToMany(mappedBy = "leg", cascade = [CascadeType.ALL], orphanRemoval = true)
    var turns: MutableList<Turn> = mutableListOf()
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

    // Track the order of this turn within the leg (0-based index)
    @Column(nullable = false)
    var turnOrderIndex: Int = 0

    @OneToMany(mappedBy = "turn", cascade = [CascadeType.ALL], orphanRemoval = true)
    val darts: MutableList<Dart> = mutableListOf()
}

@Entity
class Dart {
    @Id
    @GeneratedValue
    var id: Long? = null

    @Column(nullable = false)
    var score: Int = 0

    @Column(nullable = false)
    var multiplier: Int = 1

    @Column(nullable = false)
    var autoScore: Boolean = false

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    lateinit var turn: Turn

    @get:Transient
    @get:JsonProperty(access = JsonProperty.Access.READ_ONLY)
    val computedScore: Int
        get() = when {
            isMiss() -> 0
            isBull() -> 50
            isOuterBull() -> 25
            else -> score * multiplier
        }

    @get:Transient
    @get:JsonProperty(access = JsonProperty.Access.READ_ONLY)
    val scoreString: String
        get() = when {
            isMiss() -> "MISS"
            isBull() -> "BULL"
            else -> when (multiplier) {
                1 -> "S$score"
                2 -> "D$score"
                3 -> "T$score"
                else -> throw IllegalArgumentException("Invalid dart throw: $multiplier * $score")
            }
        }

    private fun isBull() = score == 25 && multiplier == 1

    private fun isOuterBull() = score == 25 && multiplier == 2

    private fun isMiss() = score == 0
}
