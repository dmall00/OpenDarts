package io.github.dmall.multidart.util

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Component
import java.util.*
import java.util.function.Function
import javax.crypto.SecretKey

@Component
class JwtUtil {

    @Value("\${jwt.secret}")
    private lateinit var secret: String

    private fun getSigningKey(): SecretKey {
        val keyBytes = Base64.getDecoder().decode(secret)
        return Keys.hmacShaKeyFor(keyBytes)
    }

    fun extractUsername(token: String): String {
        return extractClaim(token) { obj: Claims -> obj.subject }
    }

    fun <T> extractClaim(token: String, claimsResolver: Function<Claims, T>): T {
        val claims = extractAllClaims(token)
        return claimsResolver.apply(claims)
    }

    fun extractAllClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .payload
    }

    fun validateToken(token: String?, userDetails: UserDetails): Boolean =
        token?.let {
            extractUsername(it) == userDetails.username && !isTokenExpired(it)
        } ?: false

    private fun isTokenExpired(token: String): Boolean {
        return extractExpiration(token).before(Date())
    }

    fun extractExpiration(token: String): Date {
        return extractClaim(token) { obj: Claims -> obj.expiration }
    }

    fun generateToken(userDetails: UserDetails): String {
        val claims: MutableMap<String, Any> = HashMap()
        return createToken(claims, userDetails.username)
    }

    private fun createToken(claims: MutableMap<String, Any>, subject: String): String {
        val now = Date()
        val expirationTime = Date(now.time + 1000 * 60 * 60 * 10)

        return Jwts.builder()
            .claims()
            .add(claims)
            .subject(subject)
            .issuedAt(now)
            .expiration(expirationTime)
            .and()
            .signWith(getSigningKey(), Jwts.SIG.HS256).compact()
    }
}