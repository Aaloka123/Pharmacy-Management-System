package com.mednexus.mednexus.review.dto;

public record ReviewResponse(
		Long id,
		Long productId,
		Long authorId,
		String productName,
		String author,
		String authorProfileImage,
		String body,
		int rating,
		int likes,
		boolean likedByMe,
		String imageUrl,
		String createdAt) {
}
