package com.mednexus.mednexus.storage;

public final class MediaUrlUtils {

	private MediaUrlUtils() {
	}

	public static boolean isCloudinaryUrl(String url) {
		return url != null && url.contains("res.cloudinary.com");
	}

	public static boolean isLocalUploadUrl(String url) {
		return url != null && url.startsWith("/uploads/");
	}

	public static boolean isCustomProfileUpload(String url) {
		return isLocalUploadUrl(url) || isCloudinaryUrl(url);
	}

	public static String normalizeStoredUrl(String url) {
		if (url == null || url.isBlank() || url.startsWith("blob:") || url.startsWith("data:")) {
			return null;
		}
		String trimmed = url.trim();
		if (isCloudinaryUrl(trimmed) || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
			return trimmed;
		}
		int uploadsIndex = trimmed.indexOf("/uploads/");
		if (uploadsIndex >= 0) {
			return trimmed.substring(uploadsIndex);
		}
		if (trimmed.startsWith("/uploads/")) {
			return trimmed;
		}
		return null;
	}

	public static String publicIdFromCloudinaryUrl(String url) {
		if (!isCloudinaryUrl(url)) {
			return null;
		}
		int uploadIdx = url.indexOf("/upload/");
		if (uploadIdx < 0) {
			return null;
		}
		String afterUpload = url.substring(uploadIdx + "/upload/".length());
		int queryIdx = afterUpload.indexOf('?');
		if (queryIdx >= 0) {
			afterUpload = afterUpload.substring(0, queryIdx);
		}
		if (afterUpload.matches("^v\\d+/.*")) {
			afterUpload = afterUpload.replaceFirst("^v\\d+/", "");
		}
		int lastDot = afterUpload.lastIndexOf('.');
		int lastSlash = afterUpload.lastIndexOf('/');
		if (lastDot > lastSlash) {
			afterUpload = afterUpload.substring(0, lastDot);
		}
		return afterUpload.isBlank() ? null : afterUpload;
	}
}
