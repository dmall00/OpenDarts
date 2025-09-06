package io.github.dmall.opendarts.user.repository

import io.github.dmall.opendarts.user.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface UserRepository : JpaRepository<User, Long> {

    fun findByUsername(username: String): User?
}
