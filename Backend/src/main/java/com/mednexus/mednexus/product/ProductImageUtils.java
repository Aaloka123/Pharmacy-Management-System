package com.mednexus.mednexus.product;

import java.util.List;

import com.mednexus.mednexus.storage.MediaUrlUtils;

public final class ProductImageUtils {

	private ProductImageUtils() {
	}

	public static String firstImageUrl(Product product) {
		if (product == null) {
			return null;
		}
		return firstImageUrl(product.getImages());
	}

	public static String firstImageUrl(List<String> images) {
		if (images == null) {
			return null;
		}
		for (String raw : images) {
			String normalized = MediaUrlUtils.normalizeStoredUrl(raw);
			if (normalized != null) {
				return normalized;
			}
		}
		return null;
	}

	/** Prefer the latest Cloudinary URL (newest upload), otherwise the first stored URL. */
	public static String preferredImageUrl(Product product) {
		if (product == null || product.getImages() == null || product.getImages().isEmpty()) {
			return null;
		}
		List<String> images = product.getImages();
		for (int i = images.size() - 1; i >= 0; i--) {
			String normalized = MediaUrlUtils.normalizeStoredUrl(images.get(i));
			if (normalized != null && MediaUrlUtils.isCloudinaryUrl(normalized)) {
				return normalized;
			}
		}
		return firstImageUrl(images);
	}

	/**
	 * Resolve the image for orders, emails, and notifications. Uses the live product
	 * image when Cloudinary URLs exist; otherwise falls back to the order snapshot.
	 */
	public static String resolveOrderProductImage(String storedSnapshot, Product product) {
		String fromProduct = preferredImageUrl(product);
		if (fromProduct != null && MediaUrlUtils.isCloudinaryUrl(fromProduct)) {
			return fromProduct;
		}
		String normalizedSnapshot = MediaUrlUtils.normalizeStoredUrl(storedSnapshot);
		if (normalizedSnapshot != null) {
			return normalizedSnapshot;
		}
		return fromProduct;
	}

}
