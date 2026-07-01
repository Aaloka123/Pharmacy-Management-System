package com.mednexus.mednexus.chat.dto;

public record ChatSendPayload(
		Long conversationId,
		SendMessageRequest message) {
}
