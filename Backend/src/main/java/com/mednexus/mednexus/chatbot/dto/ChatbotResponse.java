package com.mednexus.mednexus.chatbot.dto;

import java.time.Instant;
import java.util.List;

public record ChatbotResponse(
		String reply,
		List<ChatbotProductCard> products,
		Long userMessageId,
		Long assistantMessageId,
		Instant userCreatedAt,
		Instant assistantCreatedAt) {
}
