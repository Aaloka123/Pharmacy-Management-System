package com.mednexus.mednexus.user;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.storage.CloudinaryStorageService;

@Component
public class UserFileStorage {

	private final CloudinaryStorageService cloudinaryStorage;

	public UserFileStorage(CloudinaryStorageService cloudinaryStorage) {
		this.cloudinaryStorage = cloudinaryStorage;
	}

	public String storeProfileImage(MultipartFile file, Long userId) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Profile image file is required");
		}
		return cloudinaryStorage.upload(file, "users", "user-" + userId);
	}

	public void deleteByUrl(String url) {
		cloudinaryStorage.deleteByUrl(url);
	}
}
