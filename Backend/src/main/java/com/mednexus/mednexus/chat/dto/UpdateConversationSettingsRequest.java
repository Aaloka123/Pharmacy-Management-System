package com.mednexus.mednexus.chat.dto;

public record UpdateConversationSettingsRequest(
		Boolean pinned,
		Boolean muted,
		Boolean blocked,
		Boolean hidden) {
}
