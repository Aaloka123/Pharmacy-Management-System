package com.mednexus.mednexus.storage;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

@Service
public class CloudinaryStorageService {

	private static final Logger log = LoggerFactory.getLogger(CloudinaryStorageService.class);

	private final Cloudinary cloudinary;
	private final CloudinaryProperties properties;

	public CloudinaryStorageService(Cloudinary cloudinary, CloudinaryProperties properties) {
		this.cloudinary = cloudinary;
		this.properties = properties;
	}

	public String upload(MultipartFile file, String subfolder, String publicIdPrefix) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("File is required");
		}
		if (!properties.isConfigured()) {
			throw new IllegalStateException(
					"Cloudinary is not configured. Set cloudinary.cloud-name, cloudinary.api-key, and cloudinary.api-secret.");
		}
		try {
			String safePrefix = sanitizePrefix(publicIdPrefix);
			String folder = properties.getFolder().replaceAll("/$", "") + "/" + subfolder.replaceAll("^/|/$", "");
			String publicId = safePrefix + "-" + UUID.randomUUID();

			@SuppressWarnings("unchecked")
			Map<String, Object> result = cloudinary.uploader().upload(
					file.getBytes(),
					ObjectUtils.asMap(
							"folder", folder,
							"public_id", publicId,
							"resource_type", "auto",
							"overwrite", true));

			Object secureUrl = result.get("secure_url");
			if (secureUrl == null) {
				throw new IllegalStateException("Cloudinary upload did not return a secure URL");
			}
			return secureUrl.toString();
		} catch (IOException ex) {
			throw new UncheckedIOException("Failed to upload file to Cloudinary", ex);
		}
	}

	public void deleteByUrl(String url) {
		if (url == null || url.isBlank()) {
			return;
		}
		if (MediaUrlUtils.isCloudinaryUrl(url)) {
			deleteFromCloudinary(url);
			return;
		}
		if (MediaUrlUtils.isLocalUploadUrl(url)) {
			deleteLocalFile(url);
		}
	}

	private void deleteFromCloudinary(String url) {
		String publicId = MediaUrlUtils.publicIdFromCloudinaryUrl(url);
		if (publicId == null) {
			log.warn("Could not parse Cloudinary public_id from URL: {}", url);
			return;
		}
		try {
			cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image"));
		} catch (Exception ex) {
			log.warn("Failed to delete Cloudinary asset {}: {}", publicId, ex.getMessage());
		}
	}

	private void deleteLocalFile(String publicUrl) {
		try {
			if (!publicUrl.startsWith("/uploads/")) {
				return;
			}
			String relative = publicUrl.substring("/uploads/".length());
			Path target = Paths.get("uploads", relative).toAbsolutePath();
			Files.deleteIfExists(target);
		} catch (IOException ex) {
			log.warn("Failed to delete local file {}: {}", publicUrl, ex.getMessage());
		}
	}

	private static String sanitizePrefix(String prefix) {
		if (prefix == null || prefix.isBlank()) {
			return "file";
		}
		return prefix.replaceAll("[^a-zA-Z0-9_-]", "");
	}
}
