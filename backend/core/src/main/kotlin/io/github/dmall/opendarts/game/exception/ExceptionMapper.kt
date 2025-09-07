package io.github.dmall.opendarts.game.exception

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseStatus

@ControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(DartGameException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleGameException(ex: Exception): ResponseEntity<ErrorMessage> {
        val message = ex.message ?: "Bad request"
        return ResponseEntity(ErrorMessage(message), HttpStatus.BAD_REQUEST)
    }

    @ExceptionHandler(Exception::class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    fun handleAllExceptions(ex: Exception): ResponseEntity<ErrorMessage> {
        val message = ex.message ?: "Internal Server Error"
        return ResponseEntity(ErrorMessage(message), HttpStatus.INTERNAL_SERVER_ERROR)
    }
}

data class ErrorMessage(val message: String)
