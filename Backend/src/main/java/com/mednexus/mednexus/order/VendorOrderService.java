package com.mednexus.mednexus.order;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mednexus.mednexus.cart.Cart;
import com.mednexus.mednexus.cart.CartItemNotFoundException;
import com.mednexus.mednexus.cart.CartRepository;
import com.mednexus.mednexus.cart.InsufficientStockException;
import com.mednexus.mednexus.cart.VendorStoreClosedException;
import com.mednexus.mednexus.notification.NotificationService;
import com.mednexus.mednexus.order.dto.PaymentMethodDto;
import com.mednexus.mednexus.order.dto.PlaceOrderRequest;
import com.mednexus.mednexus.order.dto.UpdateOrderStatusRequest;
import com.mednexus.mednexus.order.dto.VendorOrderResponse;
import com.mednexus.mednexus.product.Product;
import com.mednexus.mednexus.product.ProductStatus;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.user.UserNotFoundException;
import com.mednexus.mednexus.user.UserRepository;
import com.mednexus.mednexus.vendor.InvalidVendorStateException;
import com.mednexus.mednexus.vendor.StoreStatus;
import com.mednexus.mednexus.vendor.VendorStatus;

@Service
public class VendorOrderService {

	private final VendorOrderRepository vendorOrderRepository;
	private final CartRepository cartRepository;
	private final UserRepository userRepository;
	private final NotificationService notificationService;

	@Autowired
	public VendorOrderService(
			VendorOrderRepository vendorOrderRepository,
			CartRepository cartRepository,
			UserRepository userRepository,
			NotificationService notificationService) {
		this.vendorOrderRepository = vendorOrderRepository;
		this.cartRepository = cartRepository;
		this.userRepository = userRepository;
		this.notificationService = notificationService;
	}

	@Transactional
	public List<VendorOrderResponse> placeOrder(Long userId, PlaceOrderRequest request) {
		User user = userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
		if (!user.hasDeliveryLocation()) {
			throw new IllegalArgumentException("Please put location first");
		}
		List<Long> cartItemIds = request.cartItemIds().stream().distinct().toList();
		if (cartItemIds.isEmpty()) {
			throw new IllegalArgumentException("At least one cart item is required");
		}

		List<Cart> cartItems = new ArrayList<>();
		for (Long cartItemId : cartItemIds) {
			Cart cart = cartRepository.findByIdAndUserId(cartItemId, userId)
					.orElseThrow(CartItemNotFoundException::new);
			cartItems.add(cart);
		}

		PaymentMethod paymentMethod = toPaymentMethod(request.paymentMethod());
		List<VendorOrderResponse> created = new ArrayList<>();

		for (Cart cart : cartItems) {
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

			VendorOrder order = new VendorOrder();
			order.setUser(user);
			order.setVendor(product.getVendor());
			order.setProduct(product);
			order.setProductName(product.getProductName());
			order.setProductSku(product.getSku());
			order.setProductImage(product.getImages().isEmpty() ? null : product.getImages().get(0));
			order.setUnitPrice(product.getPrice());
			order.setQuantity(cart.getQuantity());
			order.setPaymentMethod(paymentMethod);
			order.setStatus(OrderStatus.PENDING);

			product.setStock(product.getStock() - cart.getQuantity());
			VendorOrder saved = vendorOrderRepository.save(order);
			cartRepository.delete(cart);
			created.add(toResponse(saved));
		}

		return created;
	}

	@Transactional(readOnly = true)
	public List<VendorOrderResponse> listForVendor(Long vendorId) {
		return vendorOrderRepository.findByVendorIdWithDetails(vendorId).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<VendorOrderResponse> listForUser(Long userId) {
		return vendorOrderRepository.findByUserIdWithDetails(userId).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public VendorOrderResponse updateStatus(Long vendorId, Long orderId, UpdateOrderStatusRequest request) {
		VendorOrder order = vendorOrderRepository.findByIdAndVendorIdWithDetails(orderId, vendorId)
				.orElseThrow(OrderNotFoundException::new);
		if (order.getStatus() == OrderStatus.CANCELED) {
			throw new InvalidVendorStateException("Canceled orders cannot be updated");
		}
		OrderStatus newStatus = request.status();
		if (order.getStatus() != newStatus) {
			order.setStatus(newStatus);
			notificationService.notifyOrderStatusUpdated(order, newStatus);
		}
		return toResponse(order);
	}

	@Transactional
	public VendorOrderResponse cancelByUser(Long userId, Long orderId) {
		VendorOrder order = vendorOrderRepository.findByIdAndUserIdWithDetails(orderId, userId)
				.orElseThrow(OrderNotFoundException::new);
		if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
			throw new IllegalArgumentException("Only pending or confirmed orders can be canceled");
		}
		Product product = order.getProduct();
		product.setStock(product.getStock() + order.getQuantity());
		order.setStatus(OrderStatus.CANCELED);
		return toResponse(order);
	}

	private PaymentMethod toPaymentMethod(PaymentMethodDto dto) {
		return switch (dto) {
			case COD -> PaymentMethod.COD;
			case ESEWA -> PaymentMethod.ESEWA;
			case KHALTI -> PaymentMethod.KHALTI;
		};
	}

	private VendorOrderResponse toResponse(VendorOrder order) {
		User user = order.getUser();
		String location = user.getLocation();
		if (location == null || location.isBlank()) {
			location = "Not provided";
		}
		return new VendorOrderResponse(
				order.getId(),
				order.getProduct().getId(),
				user.getFullName(),
				user.getEmail(),
				user.getPhoneNumber(),
				location,
				order.getVendor().getBusinessName(),
				order.getProductName(),
				order.getProductSku(),
				order.getProductImage(),
				order.getUnitPrice(),
				order.getQuantity(),
				order.getPaymentMethod(),
				order.getCreatedAt(),
				order.getStatus());
	}
}
