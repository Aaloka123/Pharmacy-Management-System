package com.mednexus.mednexus.chat;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.storage.CloudinaryStorageService;

@Component
public class MessageFileStorage {

	private static final long MAX_BYTES = 10L * 1024 * 1024;

	private final CloudinaryStorageService cloudinaryStorage;

	public MessageFileStorage(CloudinaryStorageService cloudinaryStorage) {
		this.cloudinaryStorage = cloudinaryStorage;
	}

	public String store(MultipartFile file, Long conversationId, Long senderId) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("File is required");
		}
		if (file.getSize() > MAX_BYTES) {
			throw new IllegalArgumentException("File must be 10 MB or smaller");
		}
		String contentType = file.getContentType();
		if (contentType == null || (!contentType.startsWith("image/") && !"application/pdf".equals(contentType))) {
			throw new IllegalArgumentException("Only images and PDF files are allowed");
		}
		return cloudinaryStorage.upload(
				file,
				"messages",
				"conv-" + conversationId + "-sender-" + senderId + "-" + System.currentTimeMillis());
	}

	public void deleteByUrl(String url) {
		if (url == null || url.isBlank()) {
			return;
		}
		cloudinaryStorage.deleteByUrl(url);
	}
}
