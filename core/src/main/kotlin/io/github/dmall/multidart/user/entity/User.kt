package io.github.dmall.multidart.user.entity

import jakarta.persistence.*

@Entity
@Table(name = "\"user\"")
class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    var username: String? = null

    var password: String? = null
}