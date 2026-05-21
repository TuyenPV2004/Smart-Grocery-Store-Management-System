package com.grocery.management.service;

import com.grocery.management.dto.ChatConversationSummaryDTO;
import com.grocery.management.dto.ChatMessageDTO;
import com.grocery.management.entity.ChatConversation;
import com.grocery.management.entity.ChatMessage;
import com.grocery.management.repository.ChatConversationRepository;
import com.grocery.management.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatConversationRepository chatConversationRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Transactional
    public synchronized String ensureConversation(String customerKey, String displayName, String role) {
        ChatConversation conversation = chatConversationRepository.findByCustomerKey(customerKey)
                .orElseGet(() -> createConversation(customerKey, displayName, role));

        boolean dirty = false;
        if (!displayName.equals(conversation.getCustomerDisplayName())) {
            conversation.setCustomerDisplayName(displayName);
            dirty = true;
        }
        if (!role.equals(conversation.getCustomerRole())) {
            conversation.setCustomerRole(role);
            dirty = true;
        }

        if (dirty) {
            chatConversationRepository.save(conversation);
        }

        return conversation.getId();
    }

    @Transactional
    public synchronized void updateCustomerPresence(String conversationId, boolean online) {
        ChatConversation conversation = requireConversation(conversationId);
        conversation.setCustomerOnline(online);
        chatConversationRepository.save(conversation);
    }

    @Transactional
    public synchronized ChatMessageDTO appendCustomerMessage(
            String conversationId,
            String senderKey,
            String senderDisplayName,
            String senderRole,
            String content
    ) {
        ChatConversation conversation = requireConversation(conversationId);
        if (conversation.isResolved()) {
            conversation.setResolved(false);
        }
        updateConversationMetadata(conversation, content, senderRole);
        ChatMessage savedMessage = saveMessage(conversation, senderKey, senderDisplayName, senderRole, content);
        return toMessageDto(savedMessage);
    }

    @Transactional
    public synchronized ChatMessageDTO appendStaffMessage(
            String conversationId,
            String senderKey,
            String senderDisplayName,
            String senderRole,
            String content
    ) {
        ChatConversation conversation = requireConversation(conversationId);
        claimConversationInternal(conversation, senderKey, senderDisplayName, senderRole, true);
        if (conversation.isResolved()) {
            conversation.setResolved(false);
        }
        updateConversationMetadata(conversation, content, senderRole);
        ChatMessage savedMessage = saveMessage(conversation, senderKey, senderDisplayName, senderRole, content);
        return toMessageDto(savedMessage);
    }

    @Transactional(readOnly = true)
    public synchronized List<ChatConversationSummaryDTO> getConversationSummaries(String keyword, String scope, String staffKey) {
        String normalizedScope = normalizeScope(scope);
        String normalizedKeyword = keyword == null ? null : keyword.trim();
        return chatConversationRepository.searchConversations(normalizedKeyword, normalizedScope, staffKey).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public synchronized List<ChatMessageDTO> getConversationMessages(String conversationId) {
        requireConversation(conversationId);
        return chatMessageRepository.findByConversation_IdOrderByCreatedAtAsc(conversationId).stream()
                .map(this::toMessageDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public synchronized List<ChatMessageDTO> getCustomerMessages(String customerKey, String displayName, String role) {
        String conversationId = ensureConversation(customerKey, displayName, role);
        return getConversationMessages(conversationId);
    }

    @Transactional(readOnly = true)
    public synchronized boolean conversationExists(String conversationId) {
        return chatConversationRepository.existsById(conversationId);
    }

    @Transactional
    public synchronized void deleteConversation(String conversationId) {
        requireConversation(conversationId);
        chatMessageRepository.deleteByConversation_Id(conversationId);
        chatConversationRepository.deleteById(conversationId);
    }

    @Transactional
    public synchronized String getConversationIdForCustomer(String customerKey) {
        return ensureConversation(customerKey, customerKey, "CUSTOMER");
    }

    @Transactional(readOnly = true)
    public synchronized String getCustomerKeyByConversation(String conversationId) {
        return requireConversation(conversationId).getCustomerKey();
    }

    @Transactional(readOnly = true)
    public synchronized ChatConversationSummaryDTO getConversationSummary(String conversationId) {
        return toSummary(requireConversation(conversationId));
    }

    @Transactional
    public synchronized ChatConversationSummaryDTO claimConversation(
            String conversationId,
            String staffKey,
            String staffDisplayName,
            String staffRole
    ) {
        ChatConversation conversation = requireConversation(conversationId);
        claimConversationInternal(conversation, staffKey, staffDisplayName, staffRole, false);
        return toSummary(chatConversationRepository.save(conversation));
    }

    @Transactional
    public synchronized ChatConversationSummaryDTO releaseConversation(
            String conversationId,
            String staffKey,
            String staffRole
    ) {
        ChatConversation conversation = requireConversation(conversationId);
        if (conversation.getAssignedStaffKey() == null) {
            return toSummary(conversation);
        }

        if (!staffKey.equals(conversation.getAssignedStaffKey()) && !"ADMIN".equals(staffRole)) {
            throw new RuntimeException("Cuoc tro chuyen dang duoc nhan vien khac xu ly");
        }

        conversation.setAssignedStaffKey(null);
        conversation.setAssignedStaffDisplayName(null);
        return toSummary(chatConversationRepository.save(conversation));
    }

    @Transactional
    public synchronized ChatConversationSummaryDTO resolveConversation(
            String conversationId,
            String staffKey,
            String staffRole
    ) {
        ChatConversation conversation = requireConversation(conversationId);
        ensureStaffCanManageConversation(conversation, staffKey, staffRole);
        conversation.setResolved(true);
        return toSummary(chatConversationRepository.save(conversation));
    }

    @Transactional
    public synchronized ChatConversationSummaryDTO reopenConversation(
            String conversationId,
            String staffKey,
            String staffRole
    ) {
        ChatConversation conversation = requireConversation(conversationId);
        ensureStaffCanManageConversation(conversation, staffKey, staffRole);
        conversation.setResolved(false);
        return toSummary(chatConversationRepository.save(conversation));
    }

    @Transactional(readOnly = true)
    public synchronized boolean canStaffReply(String conversationId, String staffKey, String staffRole) {
        ChatConversation conversation = requireConversation(conversationId);
        if ("ADMIN".equals(staffRole)) {
            return true;
        }
        return conversation.getAssignedStaffKey() == null || staffKey.equals(conversation.getAssignedStaffKey());
    }

    private ChatConversation createConversation(String customerKey, String displayName, String role) {
        LocalDateTime now = LocalDateTime.now();
        ChatConversation conversation = new ChatConversation();
        conversation.setId(toConversationId(customerKey));
        conversation.setCustomerKey(customerKey);
        conversation.setCustomerDisplayName(displayName);
        conversation.setCustomerRole(role);
        conversation.setCustomerOnline(false);
        conversation.setResolved(false);
        conversation.setCreatedAt(now);
        conversation.setUpdatedAt(now);

        ChatConversation savedConversation = chatConversationRepository.save(conversation);
        ChatMessage systemMessage = saveMessage(
                savedConversation,
                "system:grocery",
                "G",
                "STAFF",
                "Xin ch\u00e0o qu\u00fd kh\u00e1ch!\nNh\u00e2n vi\u00ean c\u1ee7a ch\u00fang t\u00f4i s\u1ebd h\u1ed7 tr\u1ee3 b\u1ea1n s\u1edbn nh\u1ea5t c\u00f3 th\u1ec3."
        );
        updateConversationMetadata(savedConversation, systemMessage.getContent(), systemMessage.getSenderRole());
        return chatConversationRepository.save(savedConversation);
    }

    private void claimConversationInternal(
            ChatConversation conversation,
            String staffKey,
            String staffDisplayName,
            String staffRole,
            boolean autoClaim
    ) {
        if (conversation.getAssignedStaffKey() == null || conversation.getAssignedStaffKey().equals(staffKey)) {
            conversation.setAssignedStaffKey(staffKey);
            conversation.setAssignedStaffDisplayName(staffDisplayName);
            return;
        }

        if ("ADMIN".equals(staffRole)) {
            conversation.setAssignedStaffKey(staffKey);
            conversation.setAssignedStaffDisplayName(staffDisplayName);
            return;
        }

        if (autoClaim) {
            throw new RuntimeException("Cuoc tro chuyen dang duoc " + conversation.getAssignedStaffDisplayName() + " xu ly");
        }

        throw new RuntimeException("Cuoc tro chuyen da duoc nhan boi nhan vien khac");
    }

    private void ensureStaffCanManageConversation(ChatConversation conversation, String staffKey, String staffRole) {
        if ("ADMIN".equals(staffRole)) {
            return;
        }
        if (conversation.getAssignedStaffKey() != null && !staffKey.equals(conversation.getAssignedStaffKey())) {
            throw new RuntimeException("Cuoc tro chuyen dang duoc nhan vien khac xu ly");
        }
    }

    private void updateConversationMetadata(ChatConversation conversation, String lastMessage, String senderRole) {
        conversation.setLastMessage(lastMessage);
        conversation.setLastSenderRole(senderRole);
        conversation.setUpdatedAt(LocalDateTime.now());
        chatConversationRepository.save(conversation);
    }

    private ChatMessage saveMessage(
            ChatConversation conversation,
            String senderKey,
            String senderDisplayName,
            String senderRole,
            String content
    ) {
        ChatMessage message = new ChatMessage();
        message.setId(UUID.randomUUID().toString());
        message.setConversation(conversation);
        message.setSenderKey(senderKey);
        message.setSenderDisplayName(senderDisplayName);
        message.setSenderRole(senderRole);
        message.setContent(content);
        message.setCreatedAt(LocalDateTime.now());
        return chatMessageRepository.save(message);
    }

    private ChatConversation requireConversation(String conversationId) {
        return chatConversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay hoi thoai"));
    }

    private ChatConversationSummaryDTO toSummary(ChatConversation conversation) {
        return new ChatConversationSummaryDTO(
                conversation.getId(),
                conversation.getCustomerKey(),
                conversation.getCustomerDisplayName(),
                conversation.getCustomerRole(),
                conversation.isCustomerOnline(),
                conversation.getAssignedStaffKey(),
                conversation.getAssignedStaffDisplayName(),
                conversation.isResolved(),
                conversation.getLastMessage(),
                conversation.getLastSenderRole(),
                conversation.getUpdatedAt()
        );
    }

    private ChatMessageDTO toMessageDto(ChatMessage message) {
        return new ChatMessageDTO(
                message.getId(),
                message.getConversation().getId(),
                message.getSenderKey(),
                message.getSenderDisplayName(),
                message.getSenderRole(),
                message.getContent(),
                message.getCreatedAt()
        );
    }

    private String toConversationId(String customerKey) {
        return "conv-" + customerKey.replaceAll("[^a-zA-Z0-9_-]", "-");
    }

    private String normalizeScope(String scope) {
        if (scope == null || scope.isBlank()) {
            return "ALL";
        }

        String normalized = scope.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "UNASSIGNED", "MINE", "RESOLVED", "ACTIVE" -> normalized;
            default -> "ALL";
        };
    }
}
