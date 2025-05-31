package io.github.dmall.multidart.service

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service
import io.github.dmall.multidart.repository.UserRepository
import org.springframework.security.core.userdetails.User

@Service
class CustomUserDetailsService @Autowired constructor(
    private val userRepository: UserRepository
) : UserDetailsService {

    @Throws(UsernameNotFoundException::class)
    override fun loadUserByUsername(username: String): UserDetails {
        val user = userRepository.findByUsername(username)
            ?: throw UsernameNotFoundException("User not found with username: $username")

        return User(
            user.username,
            user.password,
            ArrayList<GrantedAuthority>()
        )
    }
}