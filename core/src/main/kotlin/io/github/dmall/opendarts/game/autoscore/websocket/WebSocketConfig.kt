package io.github.dmall.opendarts.game.autoscore.websocket

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.config.annotation.EnableWebSocket
import org.springframework.web.socket.config.annotation.WebSocketConfigurer
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean

@Configuration
@EnableWebSocket
class WebSocketConfig : WebSocketConfigurer {

    @Override
    override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
        registry.addHandler(AppWebSocketHandler(), "/ws/app").setAllowedOrigins("*")
    }

    @Bean
    fun createWebSocketContainer(): ServletServerContainerFactoryBean {
        val container = ServletServerContainerFactoryBean()
        // Set max message size to 10MB (10 * 1024 * 1024 bytes)
        container.setMaxBinaryMessageBufferSize(10 * 1024 * 1024)
        container.setMaxTextMessageBufferSize(10 * 1024 * 1024)
        container.setMaxSessionIdleTimeout(30000L) // 30 seconds timeout
        return container
    }
}