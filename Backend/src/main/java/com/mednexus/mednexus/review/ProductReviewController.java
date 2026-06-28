package com.mednexus.mednexus.review;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.review.dto.CreateReviewRequest;
import com.mednexus.mednexus.review.dto.ProductReviewsResponse;
import com.mednexus.mednexus.review.dto.ReviewEligibilityResponse;
import com.mednexus.mednexus.review.dto.ReviewResponse;
import com.mednexus.mednexus.security.PlatformUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
public class ProductReviewController {

	private final ReviewService reviewService;

	@Autowired
	public ProductReviewController(ReviewService reviewService) {
		this.reviewService = reviewService;
	}

	@GetMapping
	public ResponseEntity<ProductReviewsResponse> listReviews(@PathVariable Long productId) {
		return ResponseEntity.ok(reviewService.listForProduct(productId));
	}

	@GetMapping("/eligibility")
	@PreAuthorize("isAuthenticated() and !principal.vendorAccount")
	public ResponseEntity<ReviewEligibilityResponse> eligibility(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long productId) {
		return ResponseEntity.ok(reviewService.eligibility(productId, principal.getSubjectId()));
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("isAuthenticated() and !principal.vendorAccount")
	public ResponseEntity<ReviewResponse> createReview(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long productId,
			@Valid @RequestPart("review") CreateReviewRequest request,
			@RequestPart(value = "image", required = false) MultipartFile image) {
		ReviewResponse created = reviewService.createReview(
				principal.getSubjectId(),
				productId,
				request,
				image);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}
}
