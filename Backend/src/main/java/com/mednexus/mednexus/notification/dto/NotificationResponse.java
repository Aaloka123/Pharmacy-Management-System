package com.mednexus.mednexus.notification.dto;

import java.time.Instant;

public record NotificationResponse(
		Long id,
		Long orderId,
		String message,
		String productImage,
		boolean read,
		Instant createdAt) {
}
