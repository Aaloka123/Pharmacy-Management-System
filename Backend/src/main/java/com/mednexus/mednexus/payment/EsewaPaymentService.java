package com.mednexus.mednexus.payment;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import com.mednexus.mednexus.cart.Cart;
import com.mednexus.mednexus.cart.CartItemNotFoundException;
import com.mednexus.mednexus.cart.CartRepository;
import com.mednexus.mednexus.cart.InsufficientStockException;
import com.mednexus.mednexus.cart.VendorStoreClosedException;
import com.mednexus.mednexus.order.dto.PaymentMethodDto;
import com.mednexus.mednexus.order.dto.PlaceOrderRequest;
import com.mednexus.mednexus.order.VendorOrderService;
import com.mednexus.mednexus.payment.dto.EsewaInitiateResponse;
import com.mednexus.mednexus.product.Product;
import com.mednexus.mednexus.product.ProductStatus;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.user.UserNotFoundException;
import com.mednexus.mednexus.user.UserRepository;
import com.mednexus.mednexus.vendor.VendorStatus;
import com.mednexus.mednexus.vendor.StoreStatus;

@Service
public class EsewaPaymentService {

	private static final Logger log = LoggerFactory.getLogger(EsewaPaymentService.class);
	private static final BigDecimal TAX_RATE = new BigDecimal("0.13");
	private static final String INIT_SIGNED_FIELDS = "total_amount,transaction_uuid,product_code";

	private final EsewaProperties esewaProperties;
	private final PaymentTransactionRepository paymentTransactionRepository;
	private final CartRepository cartRepository;
	private final UserRepository userRepository;
	private final VendorOrderService vendorOrderService;
	private final RestClient restClient;
	private final String backendBaseUrl;

	@Autowired
	public EsewaPaymentService(
			EsewaProperties esewaProperties,
			PaymentTransactionRepository paymentTransactionRepository,
			CartRepository cartRepository,
			UserRepository userRepository,
			VendorOrderService vendorOrderService,
			@Value("${mednexus.backend.base-url:http://localhost:8080}") String backendBaseUrl) {
		this.esewaProperties = esewaProperties;
		this.paymentTransactionRepository = paymentTransactionRepository;
		this.cartRepository = cartRepository;
		this.userRepository = userRepository;
		this.vendorOrderService = vendorOrderService;
		this.backendBaseUrl = backendBaseUrl.replaceAll("/$", "");
		this.restClient = RestClient.create();
	}

	@Transactional
	public EsewaInitiateResponse initiate(Long userId, List<Long> cartItemIds) {
		User user = userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
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

		String transactionUuid = UUID.randomUUID().toString();
		String amountText = formatAmount(amount);
		String taxText = formatAmount(taxAmount);
		String totalText = formatAmount(totalAmount);

		Map<String, String> signFields = Map.of(
				"total_amount", totalText,
				"transaction_uuid", transactionUuid,
				"product_code", esewaProperties.getProductCode());
		String signature = EsewaSignatureUtil.sign(
				EsewaSignatureUtil.buildSignedMessage(signFields, INIT_SIGNED_FIELDS),
				esewaProperties.getSecretKey());

		PaymentTransaction payment = new PaymentTransaction();
		payment.setUser(user);
		payment.setTransactionUuid(transactionUuid);
		payment.setAmount(amount);
		payment.setTaxAmount(taxAmount);
		payment.setTotalAmount(totalAmount);
		payment.setCartItemIds(distinctIds.stream().map(String::valueOf).collect(Collectors.joining(",")));
		payment.setStatus(PaymentStatus.PENDING);
		payment.setProvider(PaymentProvider.ESEWA);
		paymentTransactionRepository.save(payment);

		Map<String, String> fields = new LinkedHashMap<>();
		fields.put("amount", amountText);
		fields.put("tax_amount", taxText);
		fields.put("total_amount", totalText);
		fields.put("transaction_uuid", transactionUuid);
		fields.put("product_code", esewaProperties.getProductCode());
		fields.put("product_service_charge", "0");
		fields.put("product_delivery_charge", "0");
		fields.put("success_url", esewaProperties.successCallbackUrl(backendBaseUrl));
		fields.put("failure_url", esewaProperties.failureCallbackUrl(backendBaseUrl));
		fields.put("signed_field_names", INIT_SIGNED_FIELDS);
		fields.put("signature", signature);

		return new EsewaInitiateResponse(esewaProperties.getFormUrl(), fields);
	}

	@Transactional
	public String handleSuccess(String encodedData) {
		if (encodedData == null || encodedData.isBlank()) {
			return failureRedirect("missing-data");
		}
		try {
			Map<String, String> callback = decodeCallback(encodedData);
			if (!EsewaSignatureUtil.verify(
					callback,
					callback.get("signed_field_names"),
					callback.get("signature"),
					esewaProperties.getSecretKey())) {
				log.warn("eSewa callback signature verification failed for uuid={}", callback.get("transaction_uuid"));
				return failureRedirect("invalid-signature");
			}

			String transactionUuid = callback.get("transaction_uuid");
			PaymentTransaction payment = paymentTransactionRepository.findByTransactionUuid(transactionUuid)
					.orElse(null);
			if (payment == null) {
				return failureRedirect("unknown-transaction");
			}

			if (payment.getStatus() == PaymentStatus.SUCCESS) {
				return successRedirect();
			}

			if (!"COMPLETE".equalsIgnoreCase(callback.get("status"))) {
				markFailed(payment);
				return failureRedirect("not-complete");
			}

			if (!amountsMatch(payment.getTotalAmount(), callback.get("total_amount"))) {
				markFailed(payment);
				return failureRedirect("amount-mismatch");
			}

			if (!verifyWithEsewaStatusApi(transactionUuid, payment.getTotalAmount())) {
				markFailed(payment);
				return failureRedirect("verification-failed");
			}

			List<Long> cartItemIds = parseCartItemIds(payment.getCartItemIds());
			vendorOrderService.placeOrder(
					payment.getUser().getId(),
					new PlaceOrderRequest(PaymentMethodDto.ESEWA, cartItemIds));

			payment.setStatus(PaymentStatus.SUCCESS);
			payment.setCompletedAt(Instant.now());
			return successRedirect();
		} catch (Exception ex) {
			log.error("Failed to complete eSewa payment", ex);
			return failureRedirect("error");
		}
	}

	@Transactional
	public String handleFailure(String encodedData) {
		if (encodedData != null && !encodedData.isBlank()) {
			try {
				Map<String, String> callback = decodeCallback(encodedData);
				String transactionUuid = callback.get("transaction_uuid");
				if (transactionUuid != null) {
					paymentTransactionRepository.findByTransactionUuid(transactionUuid)
							.ifPresent(this::markFailed);
				}
			} catch (Exception ex) {
				log.debug("Could not parse eSewa failure callback", ex);
			}
		}
		return failureRedirect("cancelled");
	}

	private Map<String, String> decodeCallback(String encodedData) {
		String decoded = new String(Base64.getDecoder().decode(encodedData), StandardCharsets.UTF_8);
		return SimpleJsonParser.parseObject(decoded);
	}

	private boolean verifyWithEsewaStatusApi(String transactionUuid, BigDecimal totalAmount) {
		try {
			URI uri = UriComponentsBuilder.fromUriString(esewaProperties.getStatusUrl())
					.queryParam("product_code", esewaProperties.getProductCode())
					.queryParam("total_amount", formatAmount(totalAmount))
					.queryParam("transaction_uuid", transactionUuid)
					.build(true)
					.toUri();

			String body = restClient.get()
					.uri(uri)
					.retrieve()
					.body(String.class);

			if (body == null || body.isBlank()) {
				return false;
			}
			Map<String, String> response = SimpleJsonParser.parseObject(body);
			String status = SimpleJsonParser.stringValue(response, "status");
			return "COMPLETE".equalsIgnoreCase(status);
		} catch (Exception ex) {
			log.error("eSewa status API check failed for uuid={}", transactionUuid, ex);
			return false;
		}
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

	private static boolean amountsMatch(BigDecimal expected, String actualText) {
		if (actualText == null || actualText.isBlank()) {
			return false;
		}
		BigDecimal actual = new BigDecimal(actualText).setScale(2, RoundingMode.HALF_UP);
		return expected.setScale(2, RoundingMode.HALF_UP).compareTo(actual) == 0;
	}

	private static String formatAmount(BigDecimal amount) {
		return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
	}

	private String successRedirect() {
		return esewaProperties.getFrontendBaseUrl() + "/payment/success";
	}

	private String failureRedirect(String reason) {
		return esewaProperties.getFrontendBaseUrl() + "/checkout?payment=failed&reason=" + reason;
	}
}
