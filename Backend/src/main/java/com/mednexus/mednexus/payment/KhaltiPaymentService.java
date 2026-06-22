package com.mednexus.mednexus.payment;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import com.mednexus.mednexus.cart.Cart;
import com.mednexus.mednexus.cart.CartItemNotFoundException;
import com.mednexus.mednexus.cart.CartRepository;
import com.mednexus.mednexus.cart.InsufficientStockException;
import com.mednexus.mednexus.cart.VendorStoreClosedException;
import com.mednexus.mednexus.order.dto.PaymentMethodDto;
import com.mednexus.mednexus.order.dto.PlaceOrderRequest;
import com.mednexus.mednexus.order.VendorOrderService;
import com.mednexus.mednexus.payment.dto.KhaltiInitiateResponse;
import com.mednexus.mednexus.product.Product;
import com.mednexus.mednexus.product.ProductStatus;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.user.UserNotFoundException;
import com.mednexus.mednexus.user.UserRepository;
import com.mednexus.mednexus.vendor.VendorStatus;
import com.mednexus.mednexus.vendor.StoreStatus;

@Service
public class KhaltiPaymentService {

	private static final Logger log = LoggerFactory.getLogger(KhaltiPaymentService.class);
	private static final BigDecimal TAX_RATE = new BigDecimal("0.13");

	private final KhaltiProperties khaltiProperties;
	private final PaymentTransactionRepository paymentTransactionRepository;
	private final CartRepository cartRepository;
	private final UserRepository userRepository;
	private final VendorOrderService vendorOrderService;
	private final RestClient restClient;
	private final String backendBaseUrl;

	@Autowired
	public KhaltiPaymentService(
			KhaltiProperties khaltiProperties,
			PaymentTransactionRepository paymentTransactionRepository,
			CartRepository cartRepository,
			UserRepository userRepository,
			VendorOrderService vendorOrderService,
			@Value("${mednexus.backend.base-url:http://localhost:8080}") String backendBaseUrl) {
		this.khaltiProperties = khaltiProperties;
		this.paymentTransactionRepository = paymentTransactionRepository;
		this.cartRepository = cartRepository;
		this.userRepository = userRepository;
		this.vendorOrderService = vendorOrderService;
		this.backendBaseUrl = backendBaseUrl.replaceAll("/$", "");
		this.restClient = RestClient.create();
	}

	@Transactional
	public KhaltiInitiateResponse initiate(Long userId, List<Long> cartItemIds) {
		if (khaltiProperties.getSecretKey() == null || khaltiProperties.getSecretKey().isBlank()) {
			throw new IllegalStateException("Khalti secret key is not configured.");
		}

		User user = userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
		if (!user.hasDeliveryLocation()) {
			throw new IllegalArgumentException("Please put location first");
		}
		List<Long> distinctIds = cartItemIds.stream().distinct().toList();
		if (distinctIds.isEmpty()) {
			throw new IllegalArgumentException("At least one cart item is required");
		}

		List<Cart> cartItems = new ArrayList<>();
		BigDecimal subtotal = BigDecimal.ZERO;
		for (Long cartItemId : distinctIds) {
			Cart cart = cartRepository.findByIdAndUserId(cartItemId, userId)
					.orElseThrow(CartItemNotFoundException::new);
			Product product = cart.getProduct();
			if (product.getStatus() != ProductStatus.ACTIVE) {
				throw new IllegalArgumentException("Product is no longer available: " + product.getProductName());
			}
			if (product.getVendor().getStatus() != VendorStatus.APPROVED
					|| product.getVendor().getStoreStatus() != StoreStatus.OPEN) {
				throw new VendorStoreClosedException(product.getVendor().getBusinessName());
			}
			if (cart.getQuantity() > product.getStock()) {
				throw new InsufficientStockException(product.getStock());
			}
			cartItems.add(cart);
			subtotal = subtotal.add(product.getPrice().multiply(BigDecimal.valueOf(cart.getQuantity())));
		}

		BigDecimal amount = subtotal.setScale(2, RoundingMode.HALF_UP);
		BigDecimal taxAmount = amount.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
		BigDecimal totalAmount = amount.add(taxAmount).setScale(2, RoundingMode.HALF_UP);
		long amountPaisa = toPaisa(totalAmount);

		String purchaseOrderId = UUID.randomUUID().toString();
		PaymentTransaction payment = new PaymentTransaction();
		payment.setUser(user);
		payment.setTransactionUuid(purchaseOrderId);
		payment.setAmount(amount);
		payment.setTaxAmount(taxAmount);
		payment.setTotalAmount(totalAmount);
		payment.setCartItemIds(distinctIds.stream().map(String::valueOf).collect(Collectors.joining(",")));
		payment.setStatus(PaymentStatus.PENDING);
		payment.setProvider(PaymentProvider.KHALTI);
		paymentTransactionRepository.save(payment);

		String payload = buildInitiatePayload(
				user,
				purchaseOrderId,
				amountPaisa,
				amount,
				taxAmount);

		String responseBody = restClient.post()
				.uri(khaltiProperties.initiateUrl())
				.header("Authorization", "key " + khaltiProperties.getSecretKey())
				.contentType(MediaType.APPLICATION_JSON)
				.body(payload)
				.retrieve()
				.body(String.class);

		if (responseBody == null || responseBody.isBlank()) {
			throw new IllegalStateException("Empty response from Khalti.");
		}

		Map<String, String> response = SimpleJsonParser.parseObject(responseBody);
		if (response.containsKey("error_key")) {
			log.warn("Khalti initiate failed: {}", responseBody);
			throw new IllegalStateException("Khalti payment could not be started.");
		}

		String pidx = SimpleJsonParser.stringValue(response, "pidx");
		String paymentUrl = SimpleJsonParser.stringValue(response, "payment_url");
		if (pidx.isBlank() || paymentUrl.isBlank()) {
			log.warn("Khalti initiate missing fields: {}", responseBody);
			throw new IllegalStateException("Khalti payment could not be started.");
		}

		payment.setPidx(pidx);
		return new KhaltiInitiateResponse(paymentUrl);
	}

	@Transactional
	public String handleCallback(
			String pidx,
			String status,
			String purchaseOrderId,
			String amountPaisaText) {
		if (purchaseOrderId == null || purchaseOrderId.isBlank()) {
			return failureRedirect("missing-order");
		}

		PaymentTransaction payment = paymentTransactionRepository.findByTransactionUuid(purchaseOrderId.trim())
				.orElse(null);
		if (payment == null || payment.getProvider() != PaymentProvider.KHALTI) {
			return failureRedirect("unknown-transaction");
		}

		if (payment.getStatus() == PaymentStatus.SUCCESS) {
			return successRedirect();
		}

		if (pidx == null || pidx.isBlank()) {
			pidx = payment.getPidx();
		}
		if (pidx == null || pidx.isBlank()) {
			markFailed(payment);
			return failureRedirect("missing-pidx");
		}

		if (status != null && !"Completed".equalsIgnoreCase(status.trim())) {
			markFailed(payment);
			return failureRedirect("not-complete");
		}

		if (!verifyWithLookup(pidx, payment.getTotalAmount())) {
			markFailed(payment);
			return failureRedirect("verification-failed");
		}

		if (amountPaisaText != null && !amountPaisaText.isBlank()) {
			long expectedPaisa = toPaisa(payment.getTotalAmount());
			long receivedPaisa = Long.parseLong(amountPaisaText.trim());
			if (expectedPaisa != receivedPaisa) {
				markFailed(payment);
				return failureRedirect("amount-mismatch");
			}
		}

		List<Long> cartItemIds = parseCartItemIds(payment.getCartItemIds());
		vendorOrderService.placeOrder(
				payment.getUser().getId(),
				new PlaceOrderRequest(PaymentMethodDto.KHALTI, cartItemIds));

		payment.setStatus(PaymentStatus.SUCCESS);
		payment.setCompletedAt(Instant.now());
		if (payment.getPidx() == null) {
			payment.setPidx(pidx);
		}
		return successRedirect();
	}

	private boolean verifyWithLookup(String pidx, BigDecimal totalAmount) {
		try {
			String payload = "{\"pidx\":\"" + escapeJson(pidx) + "\"}";
			String responseBody = restClient.post()
					.uri(khaltiProperties.lookupUrl())
					.header("Authorization", "key " + khaltiProperties.getSecretKey())
					.contentType(MediaType.APPLICATION_JSON)
					.body(payload)
					.retrieve()
					.body(String.class);

			if (responseBody == null || responseBody.isBlank()) {
				return false;
			}

			Map<String, String> response = SimpleJsonParser.parseObject(responseBody);
			String status = SimpleJsonParser.stringValue(response, "status");
			if (!"Completed".equalsIgnoreCase(status)) {
				return false;
			}

			String totalText = SimpleJsonParser.stringValue(response, "total_amount");
			if (totalText.isBlank()) {
				return false;
			}
			return toPaisa(totalAmount) == Long.parseLong(totalText);
		} catch (Exception ex) {
			log.error("Khalti lookup failed for pidx={}", pidx, ex);
			return false;
		}
	}

	private String buildInitiatePayload(
			User user,
			String purchaseOrderId,
			long amountPaisa,
			BigDecimal subtotal,
			BigDecimal taxAmount) {
		String name = escapeJson(user.getFullName() == null ? "Customer" : user.getFullName());
		String email = escapeJson(user.getEmail() == null ? "customer@mednexus.com" : user.getEmail());
		String phone = escapeJson(user.getPhoneNumber() == null ? "9800000000" : user.getPhoneNumber());
		long subtotalPaisa = toPaisa(subtotal);
		long taxPaisa = toPaisa(taxAmount);

		return """
				{
				  "return_url": "%s",
				  "website_url": "%s",
				  "amount": %d,
				  "purchase_order_id": "%s",
				  "purchase_order_name": "MedNexus Pharmacy Order",
				  "customer_info": {
				    "name": "%s",
				    "email": "%s",
				    "phone": "%s"
				  },
				  "amount_breakdown": [
				    {"label": "Subtotal", "amount": %d},
				    {"label": "Tax (13%%)", "amount": %d}
				  ]
				}
				""".formatted(
				escapeJson(khaltiProperties.callbackUrl(backendBaseUrl)),
				escapeJson(khaltiProperties.getFrontendBaseUrl()),
				amountPaisa,
				escapeJson(purchaseOrderId),
				name,
				email,
				phone,
				subtotalPaisa,
				taxPaisa);
	}

	private static long toPaisa(BigDecimal amount) {
		return amount.multiply(BigDecimal.valueOf(100))
				.setScale(0, RoundingMode.HALF_UP)
				.longValueExact();
	}

	private static String escapeJson(String value) {
		return value
				.replace("\\", "\\\\")
				.replace("\"", "\\\"");
	}

	private void markFailed(PaymentTransaction payment) {
		payment.setStatus(PaymentStatus.FAILED);
		payment.setCompletedAt(Instant.now());
	}

	private static List<Long> parseCartItemIds(String raw) {
		List<Long> ids = new ArrayList<>();
		for (String part : raw.split(",")) {
			if (!part.isBlank()) {
				ids.add(Long.parseLong(part.trim()));
			}
		}
		return ids;
	}

	private String successRedirect() {
		return khaltiProperties.getFrontendBaseUrl() + "/payment/success";
	}

	private String failureRedirect(String reason) {
		return khaltiProperties.getFrontendBaseUrl() + "/checkout?payment=failed&reason=" + reason;
	}
}
