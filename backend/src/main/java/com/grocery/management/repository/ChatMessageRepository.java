package com.grocery.management.repository;

import com.grocery.management.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {

    List<ChatMessage> findByConversation_IdOrderByCreatedAtAsc(String conversationId);

    void deleteByConversation_Id(String conversationId);
}
