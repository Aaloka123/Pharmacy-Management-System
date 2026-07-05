package com.mednexus.mednexus.chat.dto;

public record ConversationResponse(
		Long id,
		Long peerId,
		String peerName,
		String peerProfileImage,
		String lastMessagePreview,
		String lastMessageAt,
		long unreadCount,
		boolean pinned,
		boolean muted,
		boolean blocked) {
}
