package io.github.dmall.opendarts

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan
class OpenDartsApplication

fun main(args: Array<String>) {
    runApplication<OpenDartsApplication>(*args)
}
