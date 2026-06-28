package com.mednexus.mednexus.review;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.review.dto.ReviewResponse;
import com.mednexus.mednexus.security.PlatformUser;

@RestController
@RequestMapping("/api/reviews")
@PreAuthorize("isAuthenticated() and !principal.vendorAccount")
public class ReviewInteractionController {

	private final ReviewService reviewService;

	@Autowired
	public ReviewInteractionController(ReviewService reviewService) {
		this.reviewService = reviewService;
	}

	@PostMapping("/{reviewId}/like")
	public ResponseEntity<ReviewResponse> toggleLike(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long reviewId) {
		return ResponseEntity.ok(reviewService.toggleLike(principal.getSubjectId(), reviewId));
	}
}
