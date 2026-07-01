package com.mednexus.mednexus.chat;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

	List<ChatMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

	java.util.Optional<ChatMessage> findByIdAndConversationId(Long id, Long conversationId);

	java.util.Optional<ChatMessage> findTopByConversationIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long conversationId);

	@Query("""
			SELECT COUNT(m) FROM ChatMessage m
			WHERE m.conversation.id = :conversationId
			AND m.senderType = :senderType
			AND m.createdAt > :lastReadAt
			""")
	long countByConversationIdAndSenderTypeAndCreatedAtAfter(
			@Param("conversationId") Long conversationId,
			@Param("senderType") MessageSenderType senderType,
			@Param("lastReadAt") Instant lastReadAt);
}
