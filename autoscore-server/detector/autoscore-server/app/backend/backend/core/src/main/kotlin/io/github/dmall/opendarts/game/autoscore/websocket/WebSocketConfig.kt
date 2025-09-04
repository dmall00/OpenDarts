package io.github.dmall.opendarts.game.autoscore.websocket

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.config.annotation.EnableWebSocket
import org.springframework.web.socket.config.annotation.WebSocketConfigurer
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean

@Configuration
@EnableWebSocket
class WebSocketConfig(
    private val appWebSocketHandler: AppWebSocketHandler,
) : WebSocketConfigurer {
    @Override
    override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
        registry
            .addHandler(appWebSocketHandler, "/ws/app/{playerId}/{gameId}")
            .setAllowedOrigins("*")
    }

    @Bean
    fun createWebSocketContainer(): ServletServerContainerFactoryBean {
        val container = ServletServerContainerFactoryBean()
        container.setMaxBinaryMessageBufferSize(15 * 1024 * 1024) // 15 MB
        container.setMaxTextMessageBufferSize(15 * 1024 * 1024) // 15 MB
        container.setMaxSessionIdleTimeout(600000L) // 10 minutes
        container.setAsyncSendTimeout(30000L) // 30 seconds
        return container
    }
}
