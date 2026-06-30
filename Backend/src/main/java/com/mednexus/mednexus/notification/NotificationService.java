package com.mednexus.mednexus.notification;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mednexus.mednexus.notification.dto.NotificationResponse;
import com.mednexus.mednexus.product.Product;
import com.mednexus.mednexus.product.ProductImageUtils;
import com.mednexus.mednexus.order.OrderEmailService;
import com.mednexus.mednexus.order.OrderStatus;
import com.mednexus.mednexus.order.VendorOrder;
import com.mednexus.mednexus.review.ProductReview;
import com.mednexus.mednexus.user.User;

@Service
public class NotificationService {

	private static final int LIST_LIMIT = 30;

	private final NotificationRepository notificationRepository;
	private final OrderEmailService orderEmailService;

	@Autowired
	public NotificationService(
			NotificationRepository notificationRepository,
			OrderEmailService orderEmailService) {
		this.notificationRepository = notificationRepository;
		this.orderEmailService = orderEmailService;
	}

	@Transactional
	public void notifyOrderStatusUpdated(VendorOrder order, OrderStatus newStatus) {
		User user = order.getUser();
		String vendorName = order.getVendor().getBusinessName();
		String productName = order.getProductName();
		String statusLabel = formatStatus(newStatus);

		Notification notification = new Notification();
		notification.setUser(user);
		notification.setOrderId(order.getId());
		notification.setMessage(
				"%s updated your order for %s to %s."
						.formatted(vendorName, productName, statusLabel));
		notification.setProductImage(
				ProductImageUtils.resolveOrderProductImage(order.getProductImage(), order.getProduct()));
		notification.setRead(false);
		notificationRepository.save(notification);
		orderEmailService.sendStatusUpdateEmail(order, newStatus);
	}

	@Transactional
	public void notifyReviewLikedByAdmin(ProductReview review) {
		User author = review.getUser();
		Product product = review.getProduct();
		if (author == null || product == null) {
			return;
		}

		Notification notification = new Notification();
		notification.setUser(author);
		notification.setOrderId(null);
		notification.setMessage(
				"MedNexus admin liked your review for %s.".formatted(product.getProductName()));
		notification.setProductImage(ProductImageUtils.preferredImageUrl(product));
		notification.setRead(false);
		notificationRepository.save(notification);
	}

	@Transactional(readOnly = true)
	public List<NotificationResponse> listForUser(Long userId) {
		return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
				.limit(LIST_LIMIT)
				.map(this::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public long unreadCount(Long userId) {
		return notificationRepository.countByUserIdAndReadFalse(userId);
	}

	@Transactional
	public boolean markRead(Long userId, Long notificationId) {
		return notificationRepository.markRead(notificationId, userId) > 0;
	}

	@Transactional
	public void markAllRead(Long userId) {
		notificationRepository.markAllRead(userId);
	}

	private NotificationResponse toResponse(Notification notification) {
		return new NotificationResponse(
				notification.getId(),
				notification.getOrderId(),
				notification.getMessage(),
				notification.getProductImage(),
				notification.isRead(),
				notification.getCreatedAt());
	}

	private static String formatStatus(OrderStatus status) {
		return switch (status) {
			case PENDING -> "Pending";
			case CONFIRMED -> "Confirmed";
			case SHIPPED -> "Shipped";
			case DELIVERED -> "Delivered";
			case CANCELED -> "Canceled";
		};
	}
}
