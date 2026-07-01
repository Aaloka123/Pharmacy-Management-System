package com.mednexus.mednexus.chat.dto;

public record AttachmentUploadResponse(
		String url,
		String fileName,
		String mimeType,
		String kind) {
}
