package com.mednexus.mednexus.chat.dto;

public record ChatMessageResponse(
		Long id,
		Long conversationId,
		MessageSenderTypeDto senderType,
		Long senderId,
		String body,
		String attachmentUrl,
		String attachmentName,
		String attachmentMimeType,
		String attachmentKind,
		Long replyToMessageId,
		String createdAt,
		boolean deleted) {

	public enum MessageSenderTypeDto {
		USER,
		VENDOR
	}
}
