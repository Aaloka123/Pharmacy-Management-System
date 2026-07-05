package com.mednexus.mednexus.chatbot.dto;

import java.math.BigDecimal;

public record ChatbotProductCard(
		Long id,
		String productName,
		String vendorBusinessName,
		BigDecimal price,
		int stock,
		String category,
		String imageUrl) {
}
