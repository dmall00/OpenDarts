package io.github.dmall.multidart.service

import io.github.dmall.multidart.entity.User
import io.github.dmall.multidart.model.UserDto
import io.github.dmall.multidart.model.mapper.UserMapper
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import io.github.dmall.multidart.repository.UserRepository

@Service
class UserService @Autowired constructor(val userRepository: UserRepository, val passwordEncoder: PasswordEncoder, val userMapper: UserMapper) {

    fun save(user: UserDto): User {
        user.password = passwordEncoder.encode(user.password)
        return userRepository.save(userMapper.dtoToEntity(user))
    }

    fun findByUsername(username: String): User? {
        return userRepository.findByUsername(username)
    }
}