package com.mednexus.mednexus.vendor;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class VendorFileStorage {

	private static final String UPLOAD_ROOT = "uploads";
	private static final String VENDOR_SUBDIR = "vendors";
	private static final String PUBLIC_URL_PREFIX = "/uploads/" + VENDOR_SUBDIR + "/";

	public String store(MultipartFile file, String prefix) {
		if (file == null || file.isEmpty()) {
			throw new InvalidVendorStateException("Required certificate file is missing");
		}
		try {
			Path directory = Paths.get(UPLOAD_ROOT, VENDOR_SUBDIR).toAbsolutePath();
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
