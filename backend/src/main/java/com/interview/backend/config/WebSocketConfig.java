package com.interview.backend.config;

import com.interview.backend.controller.SignalingHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import java.util.List;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final SignalingHandler signalingHandler;

    @Value("#{'${app.websocket.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}'.split(',')}")
    private List<String> allowedOrigins;

    public WebSocketConfig(SignalingHandler signalingHandler) {
        this.signalingHandler = signalingHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(signalingHandler, "/ws/live")
                .setAllowedOriginPatterns(allowedOrigins.stream()
                        .map(String::trim)
                        .filter(origin -> !origin.isBlank())
                        .toArray(String[]::new));
    }
}
