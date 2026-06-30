package com.mednexus.mednexus.review;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.review.dto.CreateReviewReplyRequest;
import com.mednexus.mednexus.review.dto.ReviewResponse;
import com.mednexus.mednexus.security.PlatformUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/vendor/reviews")
@PreAuthorize("hasRole('VENDOR') and principal.vendorAccount")
public class VendorReviewController {

	private final ReviewService reviewService;

	@Autowired
	public VendorReviewController(ReviewService reviewService) {
		this.reviewService = reviewService;
	}

	@GetMapping
	public ResponseEntity<List<ReviewResponse>> listReviews(@AuthenticationPrincipal PlatformUser principal) {
		return ResponseEntity.ok(reviewService.listForVendor(principal.getSubjectId()));
	}

	@PostMapping("/{reviewId}/like")
	public ResponseEntity<ReviewResponse> toggleLike(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long reviewId) {
		return ResponseEntity.ok(reviewService.toggleVendorLike(principal.getSubjectId(), reviewId));
	}

	@PostMapping("/{reviewId}/reply")
	public ResponseEntity<ReviewResponse> reply(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long reviewId,
			@Valid @RequestBody CreateReviewReplyRequest request) {
		return ResponseEntity.ok(reviewService.upsertVendorReply(principal.getSubjectId(), reviewId, request));
	}
}
