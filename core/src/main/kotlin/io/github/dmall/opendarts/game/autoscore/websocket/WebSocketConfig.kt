package io.github.dmall.opendarts.game.autoscore.websocket

import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.web.socket.config.annotation.EnableWebSocket
import org.springframework.web.socket.config.annotation.WebSocketConfigurer
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean

@Configuration
@EnableWebSocket
class WebSocketConfig(private val appWebSocketHandler: AppWebSocketHandler) : WebSocketConfigurer {
    @Override
    override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
        registry.addHandler(appWebSocketHandler, "/ws/app/{gameId}").setAllowedOrigins("*")
    }

    @Bean
    @Profile("!test")
    @ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
    fun createWebSocketContainer(): ServletServerContainerFactoryBean {
        val container = ServletServerContainerFactoryBean()
        container.setMaxBinaryMessageBufferSize(10 * 1024 * 1024) // 10 MB
        container.setMaxTextMessageBufferSize(10 * 1024 * 1024)
        container.setMaxSessionIdleTimeout(300000L) // 5 minutes
        return container
    }
}
