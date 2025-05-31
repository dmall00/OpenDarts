package io.github.dmall.multidart.service

import io.github.dmall.multidart.model.AuthenticationRequest
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.stereotype.Service
import io.github.dmall.multidart.util.JwtUtil


@Service
class JwtService @Autowired constructor(
    val authenticationManager: AuthenticationManager,
    val userDetailsService: CustomUserDetailsService,
    val jwtUtil: JwtUtil
) {

    fun createJwtToken(authenticationRequest: AuthenticationRequest): String {
        authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken(
                authenticationRequest.username, authenticationRequest.password
            )
        )

        val userDetails = userDetailsService.loadUserByUsername(authenticationRequest.username)
        return jwtUtil.generateToken(userDetails)
    }
}