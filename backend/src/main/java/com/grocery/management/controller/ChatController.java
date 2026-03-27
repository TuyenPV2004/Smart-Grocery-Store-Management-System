package com.grocery.management.controller;

import com.grocery.management.dto.ChatSocketTicketRequestDTO;
import com.grocery.management.dto.ChatSocketTicketResponseDTO;
import com.grocery.management.entity.User;
import com.grocery.management.service.ChatService;
import com.grocery.management.service.ChatSocketTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ChatSocketTicketService chatSocketTicketService;
    private final ChatWebSocketHandler chatWebSocketHandler;

    @PostMapping("/socket-ticket")
    public ResponseEntity<?> createSocketTicket(@RequestBody(required = false) ChatSocketTicketRequestDTO request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User user) {
            var result = chatSocketTicketService.issueAuthenticatedTicket(
                    user.getUsername(),
                    user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getUsername(),
                    user.getRole().name()
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
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var summary = chatService.claimConversation(
                conversationId,
                user.getUsername(),
                user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getUsername(),
                user.getRole().name()
        );
        chatWebSocketHandler.notifyConversationChanged(conversationId);
        return ResponseEntity.ok(
                summary
        );
    }

    @PostMapping("/conversations/{conversationId}/release")
    public ResponseEntity<?> releaseConversation(@PathVariable String conversationId) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var summary = chatService.releaseConversation(conversationId, user.getUsername(), user.getRole().name());
        chatWebSocketHandler.notifyConversationChanged(conversationId);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/conversations/{conversationId}/resolve")
    public ResponseEntity<?> resolveConversation(@PathVariable String conversationId) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var summary = chatService.resolveConversation(conversationId, user.getUsername(), user.getRole().name());
        chatWebSocketHandler.notifyConversationChanged(conversationId);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/conversations/{conversationId}/reopen")
    public ResponseEntity<?> reopenConversation(@PathVariable String conversationId) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var summary = chatService.reopenConversation(conversationId, user.getUsername(), user.getRole().name());
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
}
