package com.grocery.management.config;

import com.grocery.management.entity.User;
import com.grocery.management.repository.UserRepository;
import com.grocery.management.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.lang.Nullable;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ChatHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

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

        String token = servletRequest.getServletRequest().getParameter("token");
        String guestId = servletRequest.getServletRequest().getParameter("guestId");

        if (token != null && !token.isBlank()) {
            try {
                String username = jwtUtils.extractUsername(token);
                Optional<User> userOptional = userRepository.findByUsername(username);
                if (userOptional.isEmpty()) {
                    return false;
                }

                User user = userOptional.get();
                attributes.put("chatUserKey", username);
                attributes.put("chatDisplayName", user.getFullName() != null && !user.getFullName().isBlank()
                        ? user.getFullName()
                        : user.getUsername());
                attributes.put("chatRole", user.getRole().name());
                return true;
            } catch (Exception exception) {
                return false;
            }
        }

        if (guestId != null && !guestId.isBlank()) {
            String safeGuestId = guestId.replaceAll("[^a-zA-Z0-9_-]", "");
            if (safeGuestId.isBlank()) {
                return false;
            }
            attributes.put("chatUserKey", "guest-" + safeGuestId);
            attributes.put("chatDisplayName", "Khách " + safeGuestId);
            attributes.put("chatRole", "GUEST");
            return true;
        }

        return false;
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
