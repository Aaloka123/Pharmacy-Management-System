package com.mednexus.mednexus.review;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.review.dto.ReviewResponse;
import com.mednexus.mednexus.security.PlatformUser;

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
}
