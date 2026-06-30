package com.mednexus.mednexus.notification.dto;

import java.time.Instant;

public record NotificationResponse(
		Long id,
		Long orderId,
		Long productId,
		String message,
		String productImage,
		boolean read,
		Instant createdAt) {
}
