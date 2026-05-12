package com.mednexus.mednexus.user;

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
public class UserFileStorage {

	private static final String UPLOAD_ROOT = "uploads";
	private static final String USER_SUBDIR = "users";
	private static final String PUBLIC_URL_PREFIX = "/uploads/" + USER_SUBDIR + "/";

	public String storeProfileImage(MultipartFile file, Long userId) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Profile image file is required");
		}
		try {
			Path directory = Paths.get(UPLOAD_ROOT, USER_SUBDIR).toAbsolutePath();
			Files.createDirectories(directory);

			String original = file.getOriginalFilename();
			String extension = "";
			if (original != null) {
				int dot = original.lastIndexOf('.');
				if (dot >= 0 && dot < original.length() - 1) {
					extension = original.substring(dot).toLowerCase();
				}
			}
			String filename = "user-" + userId + "-" + UUID.randomUUID() + extension;

			Path target = directory.resolve(filename);
			Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
			return PUBLIC_URL_PREFIX + filename;
		} catch (IOException ex) {
			throw new UncheckedIOException("Failed to store profile image", ex);
		}
	}
}
