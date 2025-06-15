package io.github.dmall.opendarts.auth.controller

import io.github.dmall.opendarts.auth.model.AuthenticationRequest
import io.github.dmall.opendarts.auth.model.AuthenticationResponse
import io.github.dmall.opendarts.auth.service.JwtService
import io.github.dmall.opendarts.user.model.UserDto
import io.github.dmall.opendarts.user.service.UserService
import jakarta.validation.Valid
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/auth")
class AuthController @Autowired constructor(val jwtService: JwtService, val userService: UserService) {

    @PostMapping("/login")
    fun createAuthenticationToken(@RequestBody authenticationRequest: AuthenticationRequest): ResponseEntity<*> {
        val jwt = jwtService.createJwtToken(authenticationRequest)
        return ResponseEntity.ok<AuthenticationResponse?>(AuthenticationResponse(jwt))
    }

    @Valid
    @PostMapping("/signup")
    fun registerUser(@RequestBody user: UserDto): ResponseEntity<*> {
        val foundUser = userService.findByUsername(user.username)
        if (foundUser != null) {
            return ResponseEntity.badRequest().body<String>("Username is already taken.")
        }
        userService.save(user)
        return ResponseEntity.ok<String>("User registered successfully.")
    }
}