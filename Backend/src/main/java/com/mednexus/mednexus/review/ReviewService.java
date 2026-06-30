package com.mednexus.mednexus.review;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.notification.NotificationService;
import com.mednexus.mednexus.order.OrderStatus;
import com.mednexus.mednexus.order.VendorOrder;
import com.mednexus.mednexus.order.VendorOrderRepository;
import com.mednexus.mednexus.product.Product;
import com.mednexus.mednexus.product.ProductNotFoundException;
import com.mednexus.mednexus.product.ProductRepository;
import com.mednexus.mednexus.review.dto.CreateReviewReplyRequest;
import com.mednexus.mednexus.review.dto.CreateReviewRequest;
import com.mednexus.mednexus.review.dto.ProductReviewsResponse;
import com.mednexus.mednexus.review.dto.ReviewEligibilityResponse;
import com.mednexus.mednexus.review.dto.ReviewResponse;
import com.mednexus.mednexus.security.PlatformUser;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.user.UserNotFoundException;
import com.mednexus.mednexus.user.UserRepository;
import com.mednexus.mednexus.vendor.Vendor;
import com.mednexus.mednexus.vendor.VendorNotFoundException;
import com.mednexus.mednexus.vendor.VendorRepository;

@Service
public class ReviewService {

	private static final Set<OrderStatus> REVIEWABLE_ORDER_STATUSES = EnumSet.of(OrderStatus.DELIVERED);

	private static final DateTimeFormatter REVIEW_DATE_FORMAT =
			DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH)
					.withZone(ZoneId.systemDefault());

	private final ProductReviewRepository productReviewRepository;
	private final ReviewLikeRepository reviewLikeRepository;
	private final VendorReviewLikeRepository vendorReviewLikeRepository;
	private final ReviewReplyRepository reviewReplyRepository;
	private final ProductRepository productRepository;
	private final VendorOrderRepository vendorOrderRepository;
	private final UserRepository userRepository;
	private final VendorRepository vendorRepository;
	private final ReviewFileStorage reviewFileStorage;
	private final NotificationService notificationService;

	public ReviewService(
			ProductReviewRepository productReviewRepository,
			ReviewLikeRepository reviewLikeRepository,
			VendorReviewLikeRepository vendorReviewLikeRepository,
			ReviewReplyRepository reviewReplyRepository,
			ProductRepository productRepository,
			VendorOrderRepository vendorOrderRepository,
			UserRepository userRepository,
			VendorRepository vendorRepository,
			ReviewFileStorage reviewFileStorage,
			NotificationService notificationService) {
		this.productReviewRepository = productReviewRepository;
		this.reviewLikeRepository = reviewLikeRepository;
		this.vendorReviewLikeRepository = vendorReviewLikeRepository;
		this.reviewReplyRepository = reviewReplyRepository;
		this.productRepository = productRepository;
		this.vendorOrderRepository = vendorOrderRepository;
		this.userRepository = userRepository;
		this.vendorRepository = vendorRepository;
		this.reviewFileStorage = reviewFileStorage;
		this.notificationService = notificationService;
	}

	@Transactional(readOnly = true)
	public ProductReviewsResponse listForProduct(Long productId) {
		ensureProductExists(productId);
		Long viewerUserId = currentUserId();
		List<ProductReview> reviews = productReviewRepository.findByProductIdWithUser(productId);
		Map<Long, Vendor> vendorLikers = loadVendorLikersByReviewIds(
				reviews.stream().map(ProductReview::getId).toList());
		Map<Long, ReviewReply> replies = loadRepliesByReviewIds(
				reviews.stream().map(ProductReview::getId).toList());
		List<ReviewResponse> responses = reviews.stream()
				.map(review -> toResponseForUser(
						review,
						viewerUserId,
						vendorLikers.get(review.getId()),
						replies.get(review.getId())))
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
					"You can review this product after your order is delivered.");
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
		return toResponseForUser(saved, userId, findVendorLiker(saved.getId()), null);
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
		return toResponseForUser(
				review,
				userId,
				findVendorLiker(reviewId),
				findReply(reviewId));
	}

	@Transactional
	public ReviewResponse toggleVendorLike(Long vendorId, Long reviewId) {
		ProductReview review = productReviewRepository
				.findByIdAndProduct_Vendor_Id(reviewId, vendorId)
				.orElseThrow(ReviewNotFoundException::new);

		var existing = vendorReviewLikeRepository.findByReviewIdAndVendorId(reviewId, vendorId);
		if (existing.isPresent()) {
			vendorReviewLikeRepository.delete(existing.get());
		} else {
			Vendor vendor = vendorRepository.findById(vendorId).orElseThrow(VendorNotFoundException::new);
			VendorReviewLike like = new VendorReviewLike();
			like.setReview(review);
			like.setVendor(vendor);
			vendorReviewLikeRepository.save(like);
		}
		return toResponseForVendor(
				review,
				vendorId,
				findVendorLiker(reviewId),
				findReply(reviewId));
	}

	@Transactional
	public ReviewResponse upsertVendorReply(Long vendorId, Long reviewId, CreateReviewReplyRequest request) {
		ProductReview review = productReviewRepository
				.findByIdAndVendorIdWithDetails(reviewId, vendorId)
				.orElseThrow(ReviewNotFoundException::new);

		String body = request.body().trim();
		if (body.isBlank()) {
			throw new IllegalArgumentException("Reply cannot be empty.");
		}

		boolean isNewReply = reviewReplyRepository.findByReviewId(reviewId).isEmpty();
		Vendor vendor = vendorRepository.findById(vendorId).orElseThrow(VendorNotFoundException::new);
		ReviewReply reply = reviewReplyRepository.findByReviewId(reviewId).orElseGet(() -> {
			ReviewReply created = new ReviewReply();
			created.setReview(review);
			created.setVendor(vendor);
			return created;
		});
		reply.setBody(body);
		reply.setVendor(vendor);
		ReviewReply saved = reviewReplyRepository.save(reply);

		notificationService.notifyReviewReplyFromVendor(review, vendor, !isNewReply);

		return toResponseForVendor(review, vendorId, findVendorLiker(reviewId), saved);
	}

	@Transactional(readOnly = true)
	public List<ReviewResponse> listForAdmin() {
		List<ProductReview> reviews = productReviewRepository.findAllWithDetails();
		Map<Long, Vendor> vendorLikers = loadVendorLikersByReviewIds(
				reviews.stream().map(ProductReview::getId).toList());
		Map<Long, ReviewReply> replies = loadRepliesByReviewIds(
				reviews.stream().map(ProductReview::getId).toList());
		return reviews.stream()
				.map(review -> toResponseForAdmin(
						review,
						vendorLikers.get(review.getId()),
						replies.get(review.getId())))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<ReviewResponse> listForVendor(Long vendorId) {
		List<ProductReview> reviews = productReviewRepository.findByVendorIdWithDetails(vendorId);
		Map<Long, Vendor> vendorLikers = loadVendorLikersByReviewIds(
				reviews.stream().map(ProductReview::getId).toList());
		Map<Long, ReviewReply> replies = loadRepliesByReviewIds(
				reviews.stream().map(ProductReview::getId).toList());
		return reviews.stream()
				.map(review -> toResponseForVendor(
						review,
						vendorId,
						vendorLikers.get(review.getId()),
						replies.get(review.getId())))
				.toList();
	}

	private ReviewResponse toResponseForUser(
			ProductReview review,
			Long viewerUserId,
			Vendor vendorLiker,
			ReviewReply vendorReply) {
		long likes = totalLikes(review.getId());
		boolean likedByMe = viewerUserId != null
				&& reviewLikeRepository.existsByReviewIdAndUserId(review.getId(), viewerUserId);
		return buildResponse(review, likes, likedByMe, vendorLiker, vendorReply);
	}

	private ReviewResponse toResponseForVendor(
			ProductReview review,
			Long viewerVendorId,
			Vendor vendorLiker,
			ReviewReply vendorReply) {
		long likes = totalLikes(review.getId());
		boolean likedByMe = viewerVendorId != null
				&& vendorReviewLikeRepository.existsByReviewIdAndVendorId(review.getId(), viewerVendorId);
		return buildResponse(review, likes, likedByMe, vendorLiker, vendorReply);
	}

	private ReviewResponse toResponseForAdmin(ProductReview review, Vendor vendorLiker, ReviewReply vendorReply) {
		long likes = totalLikes(review.getId());
		return buildResponse(review, likes, false, vendorLiker, vendorReply);
	}

	private Map<Long, ReviewReply> loadRepliesByReviewIds(List<Long> reviewIds) {
		if (reviewIds.isEmpty()) {
			return Map.of();
		}
		return reviewReplyRepository.findByReviewIdInWithVendor(reviewIds).stream()
				.collect(Collectors.toMap(reply -> reply.getReview().getId(), reply -> reply, (a, b) -> a));
	}

	private ReviewReply findReply(Long reviewId) {
		return reviewReplyRepository.findByReviewIdWithVendor(reviewId).orElse(null);
	}

	private Map<Long, Vendor> loadVendorLikersByReviewIds(List<Long> reviewIds) {
		if (reviewIds.isEmpty()) {
			return Map.of();
		}
		return vendorReviewLikeRepository.findByReviewIdInWithVendor(reviewIds).stream()
				.collect(Collectors.toMap(like -> like.getReview().getId(), VendorReviewLike::getVendor, (a, b) -> a));
	}

	private Vendor findVendorLiker(Long reviewId) {
		return vendorReviewLikeRepository.findByReviewIdWithVendor(reviewId)
				.map(VendorReviewLike::getVendor)
				.orElse(null);
	}

	private long totalLikes(Long reviewId) {
		return reviewLikeRepository.countByReviewId(reviewId)
				+ vendorReviewLikeRepository.countByReviewId(reviewId);
	}

	private ReviewResponse buildResponse(
			ProductReview review,
			long likes,
			boolean likedByMe,
			Vendor vendorLiker,
			ReviewReply vendorReply) {
		User author = review.getUser();
		Product product = review.getProduct();
		Vendor replyVendor = vendorReply != null ? vendorReply.getVendor() : null;
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
				vendorLiker != null ? displayVendorName(vendorLiker) : null,
				vendorLiker != null ? vendorLiker.getProfileImage() : null,
				review.getImageUrl(),
				REVIEW_DATE_FORMAT.format(review.getCreatedAt()),
				vendorReply != null ? vendorReply.getBody() : null,
				replyVendor != null ? displayVendorName(replyVendor) : null,
				replyVendor != null ? replyVendor.getProfileImage() : null,
				vendorReply != null ? REVIEW_DATE_FORMAT.format(vendorReply.getCreatedAt()) : null);
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

	private static String displayVendorName(Vendor vendor) {
		if (vendor.getBusinessName() != null && !vendor.getBusinessName().isBlank()) {
			return vendor.getBusinessName().trim();
		}
		if (vendor.getName() != null && !vendor.getName().isBlank()) {
			return vendor.getName().trim();
		}
		return "Vendor";
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
