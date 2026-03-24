package com.grocery.management.service;

import com.grocery.management.dto.ChatConversationSummaryDTO;
import com.grocery.management.dto.ChatMessageDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatService {

    private final Map<String, ConversationState> conversations = new ConcurrentHashMap<>();

    public synchronized String ensureConversation(String customerKey, String displayName, String role) {
        String conversationId = toConversationId(customerKey);
        conversations.computeIfAbsent(conversationId, key -> {
            ConversationState state = new ConversationState(conversationId, customerKey, displayName, role);
            state.messages.add(createSystemMessage(conversationId));
            state.lastMessage = state.messages.get(0).getContent();
            state.updatedAt = state.messages.get(0).getCreatedAt();
            return state;
        });
        return conversationId;
    }

    public synchronized void updateCustomerPresence(String conversationId, boolean online) {
        ConversationState state = conversations.get(conversationId);
        if (state == null) {
            return;
        }
        state.customerOnline = online;
    }

    public synchronized ChatMessageDTO appendCustomerMessage(
            String conversationId,
            String senderKey,
            String senderDisplayName,
            String senderRole,
            String content
    ) {
        ConversationState state = requireConversation(conversationId);
        ChatMessageDTO message = createMessage(
                conversationId,
                senderKey,
                senderDisplayName,
                senderRole,
                content
        );
        state.messages.add(message);
        state.lastMessage = content;
        state.updatedAt = message.getCreatedAt();
        return message;
    }

    public synchronized ChatMessageDTO appendStaffMessage(
            String conversationId,
            String senderKey,
            String senderDisplayName,
            String senderRole,
            String content
    ) {
        return appendCustomerMessage(conversationId, senderKey, senderDisplayName, senderRole, content);
    }

    public synchronized List<ChatConversationSummaryDTO> getConversationSummaries() {
        return conversations.values().stream()
                .sorted(Comparator.comparing(ConversationState::getUpdatedAt).reversed())
                .map(this::toSummary)
                .toList();
    }

    public synchronized List<ChatMessageDTO> getConversationMessages(String conversationId) {
        ConversationState state = requireConversation(conversationId);
        return new ArrayList<>(state.messages);
    }

    public synchronized List<ChatMessageDTO> getCustomerMessages(String customerKey, String displayName, String role) {
        String conversationId = ensureConversation(customerKey, displayName, role);
        return getConversationMessages(conversationId);
    }

    public synchronized boolean conversationExists(String conversationId) {
        return conversations.containsKey(conversationId);
    }

    public synchronized void deleteConversation(String conversationId) {
        if (conversations.remove(conversationId) == null) {
            throw new RuntimeException("KhÃ´ng tÃ¬m tháº¥y há»™i thoáº¡i");
        }
    }

    public synchronized String getConversationIdForCustomer(String customerKey) {
        return ensureConversation(customerKey, customerKey, "CUSTOMER");
    }

    public synchronized String getCustomerKeyByConversation(String conversationId) {
        return requireConversation(conversationId).customerKey;
    }

    public synchronized ChatConversationSummaryDTO getConversationSummary(String conversationId) {
        return toSummary(requireConversation(conversationId));
    }

    private ChatMessageDTO createSystemMessage(String conversationId) {
        return new ChatMessageDTO(
                UUID.randomUUID().toString(),
                conversationId,
                "system:grocery",
                "G",
                "STAFF",
                "Xin chào quý khách!\nKết nối với chúng tôi để được tư vấn và phục vụ nhanh chóng!",
                LocalDateTime.now()
        );
    }

    private ChatMessageDTO createMessage(
            String conversationId,
            String senderKey,
            String senderDisplayName,
            String senderRole,
            String content
    ) {
        return new ChatMessageDTO(
                UUID.randomUUID().toString(),
                conversationId,
                senderKey,
                senderDisplayName,
                senderRole,
                content,
                LocalDateTime.now()
        );
    }

    private ConversationState requireConversation(String conversationId) {
        ConversationState state = conversations.get(conversationId);
        if (state == null) {
            throw new RuntimeException("Không tìm thấy hội thoại");
        }
        return state;
    }

    private ChatConversationSummaryDTO toSummary(ConversationState state) {
        return new ChatConversationSummaryDTO(
                state.conversationId,
                state.customerKey,
                state.customerDisplayName,
                state.customerRole,
                state.customerOnline,
                state.lastMessage,
                state.updatedAt
        );
    }

    private String toConversationId(String customerKey) {
        return "conv-" + customerKey.replaceAll("[^a-zA-Z0-9_-]", "-");
    }

    private static class ConversationState {
        private final String conversationId;
        private final String customerKey;
        private final String customerDisplayName;
        private final String customerRole;
        private final List<ChatMessageDTO> messages = new ArrayList<>();
        private boolean customerOnline;
        private String lastMessage;
        private LocalDateTime updatedAt = LocalDateTime.now();

        private ConversationState(String conversationId, String customerKey, String customerDisplayName, String customerRole) {
            this.conversationId = conversationId;
            this.customerKey = customerKey;
            this.customerDisplayName = customerDisplayName;
            this.customerRole = customerRole;
        }

        public LocalDateTime getUpdatedAt() {
            return updatedAt;
        }
    }
}
