package io.github.dmall.opendarts.auth.config

import io.github.dmall.opendarts.auth.service.CustomUserDetailsService
import io.github.dmall.opendarts.auth.util.JwtUtil
import jakarta.servlet.FilterChain
import jakarta.servlet.ServletException
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.web.filter.OncePerRequestFilter
import java.io.IOException

class JwtAuthenticationFilter(private val jwtUtil: JwtUtil, private val userDetailsService: CustomUserDetailsService) :
    OncePerRequestFilter() {

    @Throws(ServletException::class, IOException::class)
    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, chain: FilterChain) {
        val tokenInfo = extractJwtTokenFromRequest(request)

        if (tokenInfo.username != null && isAuthenticationRequired()) {
            authenticateUser(tokenInfo, request)
        }

        chain.doFilter(request, response)
    }

    private fun extractJwtTokenFromRequest(request: HttpServletRequest): TokenInfo {
        val authorizationHeader = request.getHeader(HttpHeaders.AUTHORIZATION)

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            val token = authorizationHeader.substring(7)
            val username = jwtUtil.extractUsername(token)
            return TokenInfo(token, username)
        }

        return TokenInfo(null, null)
    }

    private fun isAuthenticationRequired(): Boolean {
        return SecurityContextHolder.getContext().authentication == null
    }

    private fun authenticateUser(tokenInfo: TokenInfo, request: HttpServletRequest) {
        val userDetails = userDetailsService.loadUserByUsername(tokenInfo.username!!)

        if (jwtUtil.validateToken(tokenInfo.token, userDetails)) {
            setAuthenticationContext(userDetails, request)
        }
    }

    private fun setAuthenticationContext(userDetails: UserDetails, request: HttpServletRequest) {
        val authentication = UsernamePasswordAuthenticationToken(
            userDetails,
            null,
            userDetails.authorities
        )
        authentication.details = WebAuthenticationDetailsSource().buildDetails(request)
        SecurityContextHolder.getContext().authentication = authentication
    }

    private data class TokenInfo(
        val token: String?,
        val username: String?
    )
}