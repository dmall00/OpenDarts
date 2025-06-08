package io.github.dmall.opendarts.user.service

import io.github.dmall.opendarts.user.entity.User
import io.github.dmall.opendarts.user.model.UserDto
import io.github.dmall.opendarts.user.model.mapper.UserMapper
import io.github.dmall.opendarts.user.repository.UserRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

@Service
class UserService @Autowired constructor(
    val userRepository: UserRepository,
    val passwordEncoder: PasswordEncoder,
    val userMapper: UserMapper
) {

    fun save(user: UserDto): User {
        user.password = passwordEncoder.encode(user.password)
        return userRepository.save(userMapper.dtoToEntity(user))
    }

    fun findByUsername(username: String): User? {
        return userRepository.findByUsername(username)
    }
}