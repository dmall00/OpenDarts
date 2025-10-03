package io.github.dmall.opendarts.config

import org.apache.catalina.connector.Connector
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory
import org.springframework.boot.web.servlet.server.ServletWebServerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class HttpsConfig {

    @Bean
    fun servletContainer(): ServletWebServerFactory {
        val tomcat = TomcatServletWebServerFactory()

        // Add HTTP connector that redirects to HTTPS
        tomcat.addAdditionalTomcatConnectors(createStandardConnector())

        return tomcat
    }

    private fun createStandardConnector(): Connector {
        val connector = Connector("org.apache.coyote.http11.Http11NioProtocol")
        connector.scheme = "http"
        connector.port = 8080
        connector.secure = false
        connector.redirectPort = 8443 // Redirect HTTP to HTTPS
        return connector
    }
}
