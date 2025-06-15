package io.github.dmall.opendarts.config

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.PropertyNamingStrategies
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder

@Configuration
class ObjectMapperConfig {

    @Bean
    @SnakeCase
    fun pythonApiObjectMapper(): ObjectMapper {
        return ObjectMapper().apply {
            propertyNamingStrategy = PropertyNamingStrategies.SNAKE_CASE
            configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
        }
    }

    @Bean
    @Primary
    fun defaultObjectMapper(builder: Jackson2ObjectMapperBuilder): ObjectMapper {
        return builder.build()
    }
}