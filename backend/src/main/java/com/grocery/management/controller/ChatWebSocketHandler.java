package com.grocery.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grocery.management.dto.AdminChatSnapshotDTO;
import com.grocery.management.dto.ChatInboundMessageDTO;
import com.grocery.management.dto.ChatSocketEventDTO;
import com.grocery.management.dto.CustomerChatInitDTO;
import com.grocery.management.dto.StaffStatusDTO;
import com.grocery.management.dto.TypingStatusDTO;
import com.grocery.management.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ChatService chatService;
    private final ObjectMapper objectMapper;

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, ClientIdentity> identities = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> sessionIdsByUserKey = new ConcurrentHashMap<>();
    private final Set<String> staffSessionIds = ConcurrentHashMap.newKeySet();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        ClientIdentity identity = getIdentity(session);

        sessions.put(session.getId(), session);
        identities.put(session.getId(), identity);
        sessionIdsByUserKey.computeIfAbsent(identity.userKey(), key -> ConcurrentHashMap.newKeySet()).add(session.getId());

        if (identity.isStaff()) {
            staffSessionIds.add(session.getId());
            sendEvent(session, "ADMIN_SNAPSHOT", new AdminChatSnapshotDTO(chatService.getConversationSummaries(null, "ALL", identity.userKey())));
            broadcastStaffStatus();
            return;
        }

        String conversationId = chatService.ensureConversation(identity.userKey(), identity.displayName(), identity.role());
        chatService.updateCustomerPresence(conversationId, true);
        var summary = chatService.getConversationSummary(conversationId);

        sendEvent(
                session,
                "INIT_CUSTOMER",
                new CustomerChatInitDTO(
                        conversationId,
                        hasStaffOnline(),
                        summary.getAssignedStaffDisplayName(),
                        summary.isResolved(),
                        chatService.getConversationMessages(conversationId)
                )
        );
        notifyConversationChanged(conversationId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        ClientIdentity identity = getIdentity(session);
        ChatInboundMessageDTO inbound = objectMapper.readValue(message.getPayload(), ChatInboundMessageDTO.class);

        if ("TYPING".equalsIgnoreCase(inbound.getType())) {
            handleTypingEvent(identity, inbound);
            return;
        }

        if (!"CHAT".equalsIgnoreCase(inbound.getType()) || inbound.getContent() == null || inbound.getContent().isBlank()) {
            return;
        }

        String content = inbound.getContent().trim();

        try {
            if (identity.isStaff()) {
                if (inbound.getConversationId() == null || inbound.getConversationId().isBlank()
                        || !chatService.conversationExists(inbound.getConversationId())) {
                    return;
                }

                var savedMessage = chatService.appendStaffMessage(
                        inbound.getConversationId(),
                        identity.userKey(),
                        identity.displayName(),
                        identity.role(),
                        content
                );

                sendToConversationParticipants(inbound.getConversationId(), "MESSAGE", savedMessage);
                notifyConversationChanged(inbound.getConversationId());
                return;
            }

            String conversationId = chatService.ensureConversation(identity.userKey(), identity.displayName(), identity.role());
            var savedMessage = chatService.appendCustomerMessage(
                    conversationId,
                    identity.userKey(),
                    identity.displayName(),
                    identity.role(),
                    content
            );
            sendToConversationParticipants(conversationId, "MESSAGE", savedMessage);
            notifyConversationChanged(conversationId);
        } catch (RuntimeException exception) {
            sendEvent(session, "ERROR", Map.of("message", exception.getMessage()));
        }
    }

    private void handleTypingEvent(ClientIdentity identity, ChatInboundMessageDTO inbound) throws IOException {
        String conversationId;
        if (identity.isStaff()) {
            if (inbound.getConversationId() == null || inbound.getConversationId().isBlank()
                    || !chatService.conversationExists(inbound.getConversationId())
                    || !chatService.canStaffReply(inbound.getConversationId(), identity.userKey(), identity.role())) {
                return;
            }
            conversationId = inbound.getConversationId();
        } else {
            conversationId = chatService.ensureConversation(identity.userKey(), identity.displayName(), identity.role());
        }

        boolean isTyping = Boolean.TRUE.equals(inbound.getTyping());
        TypingStatusDTO payload = new TypingStatusDTO(
                conversationId,
                identity.userKey(),
                identity.displayName(),
                identity.role(),
                isTyping
        );

        sendTypingToConversationParticipants(conversationId, payload, identity.isStaff());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        cleanupSession(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        cleanupSession(session);
    }

    public void notifyConversationChanged(String conversationId) {
        try {
            broadcastConversationState(conversationId);
            broadcastAdminSnapshot();
        } catch (IOException ignored) {
        }
    }

    public void notifyConversationDeleted() {
        try {
            broadcastAdminSnapshot();
        } catch (IOException ignored) {
        }
    }

    private void cleanupSession(WebSocketSession session) throws IOException {
        ClientIdentity identity = identities.remove(session.getId());
        sessions.remove(session.getId());

        if (identity == null) {
            return;
        }

        Set<String> sessionIds = sessionIdsByUserKey.get(identity.userKey());
        if (sessionIds != null) {
            sessionIds.remove(session.getId());
            if (sessionIds.isEmpty()) {
                sessionIdsByUserKey.remove(identity.userKey());
            }
        }

        if (identity.isStaff()) {
            staffSessionIds.remove(session.getId());
            broadcastStaffStatus();
            return;
        }

        String conversationId = chatService.ensureConversation(identity.userKey(), identity.displayName(), identity.role());
        boolean online = sessionIdsByUserKey.containsKey(identity.userKey());
        chatService.updateCustomerPresence(conversationId, online);
        notifyConversationChanged(conversationId);
    }

    private void sendToConversationParticipants(String conversationId, String type, Object payload) throws IOException {
        String customerKey = chatService.getCustomerKeyByConversation(conversationId);
        List<String> targetSessionIds = new ArrayList<>();

        Set<String> customerSessionIds = sessionIdsByUserKey.get(customerKey);
        if (customerSessionIds != null) {
            targetSessionIds.addAll(customerSessionIds);
        }
        targetSessionIds.addAll(staffSessionIds);

        for (String sessionId : targetSessionIds) {
            WebSocketSession targetSession = sessions.get(sessionId);
            if (targetSession != null && targetSession.isOpen()) {
                sendEvent(targetSession, type, payload);
            }
        }
    }

    private void sendTypingToConversationParticipants(
            String conversationId,
            TypingStatusDTO payload,
            boolean fromStaff
    ) throws IOException {
        String customerKey = chatService.getCustomerKeyByConversation(conversationId);
        List<String> targetSessionIds = new ArrayList<>();

        if (fromStaff) {
            Set<String> customerSessionIds = sessionIdsByUserKey.get(customerKey);
            if (customerSessionIds != null) {
                targetSessionIds.addAll(customerSessionIds);
            }
        } else {
            targetSessionIds.addAll(staffSessionIds);
        }

        for (String sessionId : targetSessionIds) {
            WebSocketSession targetSession = sessions.get(sessionId);
            if (targetSession != null && targetSession.isOpen()) {
                sendEvent(targetSession, "TYPING", payload);
            }
        }
    }

    private void broadcastAdminSnapshot() throws IOException {
        AdminChatSnapshotDTO snapshot = new AdminChatSnapshotDTO(chatService.getConversationSummaries(null, "ALL", null));
        for (String sessionId : staffSessionIds) {
            WebSocketSession session = sessions.get(sessionId);
            if (session != null && session.isOpen()) {
                sendEvent(session, "ADMIN_SNAPSHOT", snapshot);
            }
        }
    }

    private void broadcastConversationState(String conversationId) throws IOException {
        if (!chatService.conversationExists(conversationId)) {
            return;
        }
        sendToConversationParticipants(conversationId, "CONVERSATION_STATE", chatService.getConversationSummary(conversationId));
    }

    private void broadcastStaffStatus() throws IOException {
        StaffStatusDTO payload = new StaffStatusDTO(hasStaffOnline());
        for (Map.Entry<String, ClientIdentity> entry : identities.entrySet()) {
            if (entry.getValue().isStaff()) {
                continue;
            }

            WebSocketSession session = sessions.get(entry.getKey());
            if (session != null && session.isOpen()) {
                sendEvent(session, "STAFF_STATUS", payload);
            }
        }
    }

    private boolean hasStaffOnline() {
        return !staffSessionIds.isEmpty();
    }

    private ClientIdentity getIdentity(WebSocketSession session) {
        String userKey = (String) session.getAttributes().get("chatUserKey");
        String displayName = (String) session.getAttributes().get("chatDisplayName");
        String role = (String) session.getAttributes().get("chatRole");
        return new ClientIdentity(
                userKey,
                displayName != null ? displayName : userKey,
                role != null ? role : "GUEST",
                "ADMIN".equals(role) || "STAFF".equals(role)
        );
    }

    private void sendEvent(WebSocketSession session, String type, Object payload) throws IOException {
        if (!session.isOpen()) {
            return;
        }
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(new ChatSocketEventDTO(type, payload))));
    }

    private record ClientIdentity(String userKey, String displayName, String role, boolean isStaff) {
    }
}
