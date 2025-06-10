package io.github.dmall.opendarts

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class OpenDartsApplication

fun main(args: Array<String>) {
    runApplication<OpenDartsApplication>(*args)
}
