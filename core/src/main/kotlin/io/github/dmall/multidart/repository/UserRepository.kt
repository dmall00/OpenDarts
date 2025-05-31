package io.github.dmall.multidart.repository

import io.github.dmall.multidart.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository


@Repository
interface UserRepository : JpaRepository<User, Long> {

    fun findByUsername(username: String): User?
}