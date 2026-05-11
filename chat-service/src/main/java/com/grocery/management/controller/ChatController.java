package com.grocery.management.controller;

import com.grocery.management.dto.ChatSocketTicketRequestDTO;
import com.grocery.management.dto.ChatSocketTicketResponseDTO;
import com.grocery.management.service.ChatService;
import com.grocery.management.service.ChatSocketTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ChatSocketTicketService chatSocketTicketService;
    private final ChatWebSocketHandler chatWebSocketHandler;

    @PostMapping("/socket-ticket")
    public ResponseEntity<?> createSocketTicket(@RequestBody(required = false) ChatSocketTicketRequestDTO request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(String.valueOf(authentication.getPrincipal()))) {
            CurrentChatUser user = currentUser(authentication);
            var result = chatSocketTicketService.issueAuthenticatedTicket(
                    user.username(),
                    user.displayName(),
                    user.role()
            );
            return ResponseEntity.ok(new ChatSocketTicketResponseDTO(
                    result.ticket(),
                    null,
                    null,
                    result.authenticated()
            ));
        }

        String guestToken = request != null ? request.getGuestToken() : null;
        String guestDisplayName = request != null ? request.getGuestDisplayName() : null;
        var result = chatSocketTicketService.issueGuestTicket(guestToken, guestDisplayName);
        return ResponseEntity.ok(new ChatSocketTicketResponseDTO(
                result.ticket(),
                result.guestToken(),
                result.guestDisplayName(),
                result.authenticated()
        ));
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String scope
    ) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(chatService.getConversationSummaries(keyword, scope, username));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<?> getConversationMessages(@PathVariable String conversationId) {
        return ResponseEntity.ok(chatService.getConversationMessages(conversationId));
    }

    @PostMapping("/conversations/{conversationId}/claim")
    public ResponseEntity<?> claimConversation(@PathVariable String conversationId) {
        CurrentChatUser user = currentUser(SecurityContextHolder.getContext().getAuthentication());
        var summary = chatService.claimConversation(
                conversationId,
                user.username(),
                user.displayName(),
                user.role()
        );
        chatWebSocketHandler.notifyConversationChanged(conversationId);
        return ResponseEntity.ok(
                summary
        );
    }

    @PostMapping("/conversations/{conversationId}/release")
    public ResponseEntity<?> releaseConversation(@PathVariable String conversationId) {
        CurrentChatUser user = currentUser(SecurityContextHolder.getContext().getAuthentication());
        var summary = chatService.releaseConversation(conversationId, user.username(), user.role());
        chatWebSocketHandler.notifyConversationChanged(conversationId);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/conversations/{conversationId}/resolve")
    public ResponseEntity<?> resolveConversation(@PathVariable String conversationId) {
        CurrentChatUser user = currentUser(SecurityContextHolder.getContext().getAuthentication());
        var summary = chatService.resolveConversation(conversationId, user.username(), user.role());
        chatWebSocketHandler.notifyConversationChanged(conversationId);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/conversations/{conversationId}/reopen")
    public ResponseEntity<?> reopenConversation(@PathVariable String conversationId) {
        CurrentChatUser user = currentUser(SecurityContextHolder.getContext().getAuthentication());
        var summary = chatService.reopenConversation(conversationId, user.username(), user.role());
        chatWebSocketHandler.notifyConversationChanged(conversationId);
        return ResponseEntity.ok(summary);
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<?> deleteConversation(@PathVariable String conversationId) {
        chatService.deleteConversation(conversationId);
        chatWebSocketHandler.notifyConversationDeleted();
        return ResponseEntity.ok(Map.of("message", "Xoa cuoc tro chuyen thanh cong"));
    }

    @GetMapping("/status")
    public ResponseEntity<?> getChatStatus() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(Map.of("username", username));
    }

    private CurrentChatUser currentUser(Authentication authentication) {
        String username = authentication.getName();
        String displayName = username;
        if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
            Object nameClaim = jwtAuthentication.getTokenAttributes().get("name");
            Object fullNameClaim = jwtAuthentication.getTokenAttributes().get("full_name");
            Object preferredUsername = jwtAuthentication.getTokenAttributes().get("preferred_username");
            displayName = firstNonBlank(fullNameClaim, nameClaim, preferredUsername, username);
        }

        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> "ADMIN".equals(authority) || "STAFF".equals(authority) || "CUSTOMER".equals(authority))
                .findFirst()
                .orElse("CUSTOMER");
        return new CurrentChatUser(username, displayName, role);
    }

    private String firstNonBlank(Object... values) {
        for (Object value : values) {
            if (value != null && !value.toString().isBlank()) {
                return value.toString();
            }
        }
        return "";
    }

    private record CurrentChatUser(String username, String displayName, String role) {
    }
}
