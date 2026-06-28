package com.mednexus.mednexus.product;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.storage.CloudinaryStorageService;

@Component
public class ProductFileStorage {

	private static final int MAX_IMAGES = 4;

	private final CloudinaryStorageService cloudinaryStorage;

	public ProductFileStorage(CloudinaryStorageService cloudinaryStorage) {
		this.cloudinaryStorage = cloudinaryStorage;
	}

	public List<String> storeAll(MultipartFile[] files, Long vendorId, Long productId) {
		if (files == null || files.length == 0) {
			return List.of();
		}
		List<String> urls = new ArrayList<>();
		Set<String> seen = new HashSet<>();
		int count = 0;
		for (MultipartFile file : files) {
			if (file == null || file.isEmpty()) {
				continue;
			}
			String dedupeKey = file.getOriginalFilename() + ":" + file.getSize();
			if (!seen.add(dedupeKey)) {
				continue;
			}
			if (count >= MAX_IMAGES) {
				break;
			}
			urls.add(cloudinaryStorage.upload(file, "products", "vendor-" + vendorId + "-product-" + productId));
			count++;
		}
		return urls;
	}

	public void deleteByPublicUrls(List<String> publicUrls) {
		if (publicUrls == null) {
			return;
		}
		for (String publicUrl : publicUrls) {
			deleteByPublicUrl(publicUrl);
		}
	}

	public void deleteByPublicUrl(String publicUrl) {
		cloudinaryStorage.deleteByUrl(publicUrl);
	}
}
