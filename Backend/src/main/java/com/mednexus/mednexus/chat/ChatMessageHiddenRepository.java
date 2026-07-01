package com.mednexus.mednexus.chat;

import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageHiddenRepository extends JpaRepository<ChatMessageHidden, ChatMessageHiddenId> {

	boolean existsByIdMessageIdAndIdHiderTypeAndIdHiderId(
			Long messageId,
			MessageSenderType hiderType,
			Long hiderId);

	@Query("""
			SELECT h.id.messageId FROM ChatMessageHidden h
			WHERE h.id.hiderType = :hiderType
			AND h.id.hiderId = :hiderId
			AND h.id.messageId IN (
			  SELECT m.id FROM ChatMessage m WHERE m.conversation.id = :conversationId
			)
			""")
	Set<Long> findHiddenMessageIds(
			@Param("conversationId") Long conversationId,
			@Param("hiderType") MessageSenderType hiderType,
			@Param("hiderId") Long hiderId);
}
