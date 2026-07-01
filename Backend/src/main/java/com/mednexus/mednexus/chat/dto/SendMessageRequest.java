package com.mednexus.mednexus.chat.dto;

public record SendMessageRequest(
		String body,
		String attachmentUrl,
		String attachmentName,
		String attachmentMimeType,
		Long replyToMessageId) {
}
