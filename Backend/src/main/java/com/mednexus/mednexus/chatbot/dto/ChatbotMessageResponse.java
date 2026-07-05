package com.mednexus.mednexus.chatbot.dto;

import java.time.Instant;
import java.util.List;

public record ChatbotMessageResponse(
		Long id,
		String role,
		String body,
		List<ChatbotProductCard> products,
		Instant createdAt) {
}
