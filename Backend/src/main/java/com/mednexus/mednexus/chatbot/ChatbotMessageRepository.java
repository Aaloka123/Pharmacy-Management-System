package com.mednexus.mednexus.chatbot;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatbotMessageRepository extends JpaRepository<ChatbotMessage, Long> {

	@Query("""
			SELECT m FROM ChatbotMessage m
			WHERE m.ownerType = :ownerType AND m.ownerId = :ownerId
			ORDER BY m.createdAt ASC
			""")
	List<ChatbotMessage> findByOwnerOrderByCreatedAtAsc(
			@Param("ownerType") ChatbotOwnerType ownerType,
			@Param("ownerId") Long ownerId);
}
