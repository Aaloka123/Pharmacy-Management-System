package com.mednexus.mednexus.prescription;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.storage.CloudinaryStorageService;

@Component
public class PrescriptionFileStorage {

	private final CloudinaryStorageService cloudinaryStorage;

	public PrescriptionFileStorage(CloudinaryStorageService cloudinaryStorage) {
		this.cloudinaryStorage = cloudinaryStorage;
	}

	public String store(MultipartFile file, Long userId) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Prescription image file is required");
		}
		return cloudinaryStorage.upload(file, "prescriptions", "user-" + userId);
	}

	public void deleteByUrl(String imageUrl) {
		cloudinaryStorage.deleteByUrl(imageUrl);
	}
}
