package com.mednexus.mednexus.review;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.review.dto.ReviewResponse;
import com.mednexus.mednexus.security.PlatformUser;

@RestController
@RequestMapping("/api/admin/reviews")
@PreAuthorize("hasRole('ADMIN') and !principal.vendorAccount")
public class AdminReviewController {

	private final ReviewService reviewService;

	@Autowired
	public AdminReviewController(ReviewService reviewService) {
		this.reviewService = reviewService;
	}

	@GetMapping
	public ResponseEntity<List<ReviewResponse>> listReviews(@AuthenticationPrincipal PlatformUser principal) {
		return ResponseEntity.ok(reviewService.listForAdmin(principal.getSubjectId()));
	}

	@PostMapping("/{reviewId}/like")
	public ResponseEntity<ReviewResponse> toggleLike(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long reviewId) {
		return ResponseEntity.ok(reviewService.toggleAdminLike(principal.getSubjectId(), reviewId));
	}
}
