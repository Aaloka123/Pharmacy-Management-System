package com.mednexus.mednexus.review;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.storage.CloudinaryStorageService;

@Component
public class ReviewFileStorage {

	private final CloudinaryStorageService cloudinaryStorage;

	public ReviewFileStorage(CloudinaryStorageService cloudinaryStorage) {
		this.cloudinaryStorage = cloudinaryStorage;
	}

	public String store(MultipartFile file, Long userId, Long productId) {
		if (file == null || file.isEmpty()) {
			return null;
		}
		return cloudinaryStorage.upload(
				file,
				"reviews",
				"user-" + userId + "-product-" + productId + "-" + System.currentTimeMillis());
	}

	public void deleteByPublicUrl(String publicUrl) {
		if (publicUrl != null && !publicUrl.isBlank()) {
			cloudinaryStorage.deleteByUrl(publicUrl);
		}
	}
}
