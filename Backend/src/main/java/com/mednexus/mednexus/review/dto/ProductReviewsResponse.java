package com.mednexus.mednexus.review.dto;

import java.util.List;

public record ProductReviewsResponse(
		List<ReviewResponse> reviews,
		double averageRating,
		int totalReviews) {
}
