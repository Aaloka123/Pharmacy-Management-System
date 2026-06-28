package com.mednexus.mednexus.order;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.mednexus.mednexus.order.dto.OrderEmailDetails;
import com.mednexus.mednexus.order.dto.OrderEmailLineItem;
import com.mednexus.mednexus.otp.AfterCommitMailDispatcher;
import com.mednexus.mednexus.otp.EmailService;
import com.mednexus.mednexus.product.ProductImageUtils;
import com.mednexus.mednexus.storage.MediaUrlUtils;
import com.mednexus.mednexus.user.User;

@Service
public class OrderEmailService {

	private static final BigDecimal TAX_RATE = new BigDecimal("0.13");

	private final EmailService emailService;
	private final AfterCommitMailDispatcher mailDispatcher;
	private final String backendBaseUrl;

	public OrderEmailService(
			EmailService emailService,
			AfterCommitMailDispatcher mailDispatcher,
			@Value("${mednexus.backend.base-url:http://localhost:8080}") String backendBaseUrl) {
		this.emailService = emailService;
		this.mailDispatcher = mailDispatcher;
		this.backendBaseUrl = backendBaseUrl == null ? "http://localhost:8080" : backendBaseUrl.replaceAll("/$", "");
	}

	public void sendPlacedOrdersEmail(User user, List<VendorOrder> orders, PaymentMethod paymentMethod) {
		if (orders == null || orders.isEmpty()) {
			return;
		}
		sendAfterCommit(user, orders, OrderStatus.PENDING, paymentMethod);
	}

	public void sendStatusUpdateEmail(VendorOrder order, OrderStatus status) {
		if (order == null || status == OrderStatus.CANCELED) {
			return;
		}
		sendAfterCommit(order.getUser(), List.of(order), status, order.getPaymentMethod());
	}

	private void sendAfterCommit(
			User user,
			List<VendorOrder> orders,
			OrderStatus status,
			PaymentMethod paymentMethod) {
		OrderEmailPayload payload = buildPayload(user, orders, status, paymentMethod);
		OrderEmailDetails details = toDetails(payload, user.getEmail());
		mailDispatcher.sendAfterCommit(() -> emailService.sendOrderStatusEmail(details));
	}

	private static OrderEmailDetails toDetails(OrderEmailPayload payload, String customerEmail) {
		return new OrderEmailDetails(
				payload.toEmail(),
				payload.customerName(),
				customerEmail,
				payload.phone(),
				payload.deliveryAddress(),
				payload.paymentMethodLabel(),
				payload.status(),
				payload.lineItems(),
				payload.subtotal(),
				payload.tax(),
				payload.total(),
				payload.primaryOrderId());
	}

	private OrderEmailPayload buildPayload(
			User user,
			List<VendorOrder> orders,
			OrderStatus status,
			PaymentMethod paymentMethod) {
		List<OrderEmailLineItem> lineItems = new ArrayList<>();
		BigDecimal subtotal = BigDecimal.ZERO;
		for (VendorOrder order : orders) {
			BigDecimal lineTotal = order.getUnitPrice()
					.multiply(BigDecimal.valueOf(order.getQuantity()))
					.setScale(2, RoundingMode.HALF_UP);
			subtotal = subtotal.add(lineTotal);
			lineItems.add(new OrderEmailLineItem(
					order.getProductName(),
					order.getProductSku(),
					resolveEmailImageUrl(order),
					order.getQuantity(),
					order.getUnitPrice(),
					lineTotal));
		}
		BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
		BigDecimal total = subtotal.add(tax).setScale(2, RoundingMode.HALF_UP);
		String location = user.getLocation();
		if (location == null || location.isBlank()) {
			location = "Not provided";
		}
		Long primaryOrderId = orders.get(0).getId();
		return new OrderEmailPayload(
				user.getEmail(),
				user.getFullName(),
				user.getPhoneNumber(),
				location,
				formatPaymentMethod(paymentMethod),
				status,
				lineItems,
				subtotal,
				tax,
				total,
				primaryOrderId);
	}

	private String resolveEmailImageUrl(VendorOrder order) {
		String stored = ProductImageUtils.resolveOrderProductImage(order.getProductImage(), order.getProduct());
		return toPublicMediaUrl(stored);
	}

	private String toPublicMediaUrl(String stored) {
		if (stored == null || stored.isBlank()) {
			return null;
		}
		String trimmed = stored.trim();
		if (MediaUrlUtils.isCloudinaryUrl(trimmed)
				|| trimmed.startsWith("http://")
				|| trimmed.startsWith("https://")) {
			return trimmed;
		}
		if (MediaUrlUtils.isLocalUploadUrl(trimmed)) {
			return backendBaseUrl + trimmed;
		}
		return null;
	}

	private static String formatPaymentMethod(PaymentMethod method) {
		return switch (method) {
			case COD -> "Cash on Delivery (COD)";
			case ESEWA -> "eSewa";
			case KHALTI -> "Khalti";
		};
	}

	record OrderEmailPayload(
			String toEmail,
			String customerName,
			String phone,
			String deliveryAddress,
			String paymentMethodLabel,
			OrderStatus status,
			List<OrderEmailLineItem> lineItems,
			BigDecimal subtotal,
			BigDecimal tax,
			BigDecimal total,
			Long primaryOrderId) {
	}
}
