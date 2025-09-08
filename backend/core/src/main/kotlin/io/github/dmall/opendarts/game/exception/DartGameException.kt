package io.github.dmall.opendarts.game.exception

open class DartGameException(message: String) : RuntimeException(message)

class NotFoundException(message: String) : DartGameException(message)