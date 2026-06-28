package com.mednexus.mednexus.review;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.order.OrderStatus;
import com.mednexus.mednexus.order.VendorOrder;
import com.mednexus.mednexus.order.VendorOrderRepository;
import com.mednexus.mednexus.product.Product;
import com.mednexus.mednexus.product.ProductNotFoundException;
import com.mednexus.mednexus.product.ProductRepository;
import com.mednexus.mednexus.review.dto.CreateReviewRequest;
import com.mednexus.mednexus.review.dto.ProductReviewsResponse;
import com.mednexus.mednexus.review.dto.ReviewEligibilityResponse;
import com.mednexus.mednexus.review.dto.ReviewResponse;
import com.mednexus.mednexus.security.PlatformUser;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.user.UserNotFoundException;
import com.mednexus.mednexus.user.UserRepository;

@Service
public class ReviewService {

	private static final Set<OrderStatus> REVIEWABLE_ORDER_STATUSES = EnumSet.of(
			OrderStatus.CONFIRMED,
			OrderStatus.SHIPPED,
			OrderStatus.DELIVERED);

	private static final DateTimeFormatter REVIEW_DATE_FORMAT =
			DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH)
					.withZone(ZoneId.systemDefault());

	private final ProductReviewRepository productReviewRepository;
	private final ReviewLikeRepository reviewLikeRepository;
	private final ProductRepository productRepository;
	private final VendorOrderRepository vendorOrderRepository;
	private final UserRepository userRepository;
	private final ReviewFileStorage reviewFileStorage;

	public ReviewService(
			ProductReviewRepository productReviewRepository,
			ReviewLikeRepository reviewLikeRepository,
			ProductRepository productRepository,
			VendorOrderRepository vendorOrderRepository,
			UserRepository userRepository,
			ReviewFileStorage reviewFileStorage) {
		this.productReviewRepository = productReviewRepository;
		this.reviewLikeRepository = reviewLikeRepository;
		this.productRepository = productRepository;
		this.vendorOrderRepository = vendorOrderRepository;
		this.userRepository = userRepository;
		this.reviewFileStorage = reviewFileStorage;
	}

	@Transactional(readOnly = true)
	public ProductReviewsResponse listForProduct(Long productId) {
		ensureProductExists(productId);
		Long viewerUserId = currentUserId();
		List<ProductReview> reviews = productReviewRepository.findByProductIdWithUser(productId);
		List<ReviewResponse> responses = reviews.stream()
				.map(review -> toResponse(review, viewerUserId))
				.toList();
		double average = reviews.isEmpty()
				? 0
				: reviews.stream().mapToInt(ProductReview::getRating).average().orElse(0);
		return new ProductReviewsResponse(responses, Math.round(average * 10.0) / 10.0, reviews.size());
	}

	@Transactional(readOnly = true)
	public ReviewEligibilityResponse eligibility(Long productId, Long userId) {
		ensureProductExists(productId);
		if (productReviewRepository.existsByUser_IdAndProduct_Id(userId, productId)) {
			return new ReviewEligibilityResponse(
					false,
					true,
					"You have already reviewed this product.");
		}
		boolean hasPurchased = vendorOrderRepository.existsByUserIdAndProductIdAndStatusIn(
				userId, productId, REVIEWABLE_ORDER_STATUSES);
		if (!hasPurchased) {
			return new ReviewEligibilityResponse(
					false,
					false,
					"You can review this product after your order is confirmed or delivered.");
		}
		return new ReviewEligibilityResponse(true, false, null);
	}

	@Transactional
	public ReviewResponse createReview(
			Long userId,
			Long productId,
			CreateReviewRequest request,
			MultipartFile imageFile) {
		ReviewEligibilityResponse eligibility = eligibility(productId, userId);
		if (!eligibility.canReview()) {
			throw new IllegalArgumentException(
					eligibility.message() != null
							? eligibility.message()
							: "You are not eligible to review this product.");
		}

		Product product = productRepository.findById(productId).orElseThrow(ProductNotFoundException::new);
		User user = userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
		VendorOrder order = vendorOrderRepository
				.findFirstByUserIdAndProductIdAndStatusInOrderByCreatedAtDesc(
						userId, productId, REVIEWABLE_ORDER_STATUSES)
				.orElseThrow(() -> new IllegalArgumentException("No eligible order found for this product."));

		ProductReview review = new ProductReview();
		review.setProduct(product);
		review.setUser(user);
		review.setVendorOrder(order);
		review.setRating(request.rating());
		review.setBody(request.body().trim());
		review.setImageUrl(reviewFileStorage.store(imageFile, userId, productId));

		ProductReview saved = productReviewRepository.save(review);
		return toResponse(saved, userId);
	}

	@Transactional
	public ReviewResponse toggleLike(Long userId, Long reviewId) {
		ProductReview review = productReviewRepository.findById(reviewId).orElseThrow(ReviewNotFoundException::new);

		var existing = reviewLikeRepository.findByReviewIdAndUserId(reviewId, userId);
		if (existing.isPresent()) {
			reviewLikeRepository.delete(existing.get());
		} else {
			User user = userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
			ReviewLike like = new ReviewLike();
			like.setReview(review);
			like.setUser(user);
			reviewLikeRepository.save(like);
		}
		return toResponse(review, userId);
	}

	@Transactional(readOnly = true)
	public List<ReviewResponse> listForVendor(Long vendorId) {
		return productReviewRepository.findByVendorIdWithDetails(vendorId).stream()
				.map(review -> toResponse(review, currentUserId()))
				.toList();
	}

	private ReviewResponse toResponse(ProductReview review, Long viewerUserId) {
		long likes = reviewLikeRepository.countByReviewId(review.getId());
		boolean likedByMe = viewerUserId != null
				&& reviewLikeRepository.existsByReviewIdAndUserId(review.getId(), viewerUserId);
		User author = review.getUser();
		Product product = review.getProduct();
		return new ReviewResponse(
				review.getId(),
				product.getId(),
				author.getId(),
				product.getProductName(),
				displayAuthorName(author.getFullName()),
				author.getProfileImage(),
				review.getBody(),
				review.getRating(),
				(int) likes,
				likedByMe,
				review.getImageUrl(),
				REVIEW_DATE_FORMAT.format(review.getCreatedAt()));
	}

	private void ensureProductExists(Long productId) {
		if (!productRepository.existsById(productId)) {
			throw new ProductNotFoundException();
		}
	}

	private static Long currentUserId() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !(authentication.getPrincipal() instanceof PlatformUser principal)) {
			return null;
		}
		if (principal.isVendorAccount()) {
			return null;
		}
		return principal.getSubjectId();
	}

	private static String displayAuthorName(String fullName) {
		if (fullName == null || fullName.isBlank()) {
			return "Customer";
		}
		String trimmed = fullName.trim();
		String[] parts = trimmed.split("\\s+");
		if (parts.length == 1) {
			return parts[0];
		}
		char initial = parts[parts.length - 1].charAt(0);
		return parts[0] + " " + Character.toUpperCase(initial) + ".";
	}
}
