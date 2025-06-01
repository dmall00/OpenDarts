package io.github.dmall.multidart.user.repository

import io.github.dmall.multidart.user.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository


@Repository
interface UserRepository : JpaRepository<User, Long> {

    fun findByUsername(username: String): User?
}