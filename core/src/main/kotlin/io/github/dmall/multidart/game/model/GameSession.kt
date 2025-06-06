package io.github.dmall.multidart.game.model

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id

@Entity
class GameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var gameId: String? = null


}