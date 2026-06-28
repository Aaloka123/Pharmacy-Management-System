package com.mednexus.mednexus.vendor;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.storage.CloudinaryStorageService;

@Component
public class VendorFileStorage {

	private final CloudinaryStorageService cloudinaryStorage;

	public VendorFileStorage(CloudinaryStorageService cloudinaryStorage) {
		this.cloudinaryStorage = cloudinaryStorage;
	}

	public String store(MultipartFile file, String prefix) {
		if (file == null || file.isEmpty()) {
			throw new InvalidVendorStateException("Required certificate file is missing");
		}
		return cloudinaryStorage.upload(file, "vendors", prefix);
	}

	public String storeProfileImage(MultipartFile file, Long vendorId) {
		if (file == null || file.isEmpty()) {
			throw new InvalidVendorStateException("Profile image file is required");
		}
		return cloudinaryStorage.upload(file, "vendors", "vendor-" + vendorId + "-profile");
	}

	public void deleteByPublicUrl(String publicUrl) {
		cloudinaryStorage.deleteByUrl(publicUrl);
	}
}
