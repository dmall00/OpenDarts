package io.github.dmall.opendarts.auth.service

import io.github.dmall.opendarts.auth.model.AuthenticationRequest
import io.github.dmall.opendarts.auth.util.JwtUtil
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.stereotype.Service

@Service
class JwtService
@Autowired
constructor(
    val authenticationManager: AuthenticationManager,
    val userDetailsService: CustomUserDetailsService,
    val jwtUtil: JwtUtil,
) {

    fun createJwtToken(authenticationRequest: AuthenticationRequest): String {
        authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken(
                authenticationRequest.username,
                authenticationRequest.password,
            )
        )

        val userDetails = userDetailsService.loadUserByUsername(authenticationRequest.username)
        return jwtUtil.generateToken(userDetails)
    }
}
