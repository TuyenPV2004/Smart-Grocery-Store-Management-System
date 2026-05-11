package com.grocery.management.config;

import com.grocery.management.service.ChatSocketTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ChatHandshakeInterceptor implements HandshakeInterceptor {

    private final ChatSocketTicketService chatSocketTicketService;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            return false;
        }

        String ticket = servletRequest.getServletRequest().getParameter("ticket");
        ChatSocketTicketService.ChatSocketPrincipal principal = chatSocketTicketService.consumeTicket(ticket);
        if (principal == null) {
            return false;
        }

        attributes.put("chatUserKey", principal.userKey());
        attributes.put("chatDisplayName", principal.displayName());
        attributes.put("chatRole", principal.role());
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            @Nullable Exception exception
    ) {
    }
}
