package com.mednexus.mednexus.review.dto;

public record ReviewEligibilityResponse(
		boolean canReview,
		boolean hasReviewed,
		String message) {
}
