package com.mednexus.mednexus.product;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class ProductFileStorage {

	private static final String UPLOAD_ROOT = "uploads";
	private static final String PRODUCT_SUBDIR = "products";
	private static final String PUBLIC_URL_PREFIX = "/uploads/" + PRODUCT_SUBDIR + "/";
	private static final int MAX_IMAGES = 4;

	public List<String> storeAll(MultipartFile[] files, Long vendorId, Long productId) {
		if (files == null || files.length == 0) {
			return List.of();
		}
		List<String> urls = new ArrayList<>();
		int count = 0;
		for (MultipartFile file : files) {
			if (file == null || file.isEmpty()) {
				continue;
			}
			if (count >= MAX_IMAGES) {
				break;
			}
			urls.add(writeFile(file, "vendor-" + vendorId + "-product-" + productId));
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
		if (publicUrl == null || publicUrl.isBlank() || !publicUrl.startsWith(PUBLIC_URL_PREFIX)) {
			return;
		}
		try {
			String filename = publicUrl.substring(PUBLIC_URL_PREFIX.length());
			Path target = Paths.get(UPLOAD_ROOT, PRODUCT_SUBDIR, filename).toAbsolutePath();
			Files.deleteIfExists(target);
		} catch (IOException ex) {
			System.err.println("Failed to delete product file " + publicUrl + ": " + ex.getMessage());
		}
	}

	private String writeFile(MultipartFile file, String prefix) {
		try {
			Path directory = Paths.get(UPLOAD_ROOT, PRODUCT_SUBDIR).toAbsolutePath();
			Files.createDirectories(directory);

			String original = file.getOriginalFilename();
			String extension = "";
			if (original != null) {
				int dot = original.lastIndexOf('.');
				if (dot >= 0 && dot < original.length() - 1) {
					extension = original.substring(dot).toLowerCase();
				}
			}
			String safePrefix = prefix == null || prefix.isBlank() ? "file" : prefix.replaceAll("[^a-zA-Z0-9_-]", "");
			String filename = safePrefix + "-" + UUID.randomUUID() + extension;

			Path target = directory.resolve(filename);
			Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
			return PUBLIC_URL_PREFIX + filename;
		} catch (IOException ex) {
			throw new UncheckedIOException("Failed to store uploaded file", ex);
		}
	}
}
