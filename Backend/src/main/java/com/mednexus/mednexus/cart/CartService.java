package com.mednexus.mednexus.cart;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mednexus.mednexus.cart.dto.AddToCartRequest;
import com.mednexus.mednexus.cart.dto.CartItemResponse;
import com.mednexus.mednexus.cart.dto.UpdateCartQuantityRequest;
import com.mednexus.mednexus.product.Product;
import com.mednexus.mednexus.product.ProductNotFoundException;
import com.mednexus.mednexus.product.ProductRepository;
import com.mednexus.mednexus.product.ProductStatus;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.user.UserNotFoundException;
import com.mednexus.mednexus.user.UserRepository;
import com.mednexus.mednexus.vendor.VendorStatus;
import com.mednexus.mednexus.vendor.StoreStatus;

@Service
public class CartService {

	private final CartRepository cartRepository;
	private final ProductRepository productRepository;
	private final UserRepository userRepository;

	@Autowired
	public CartService(
			CartRepository cartRepository,
			ProductRepository productRepository,
			UserRepository userRepository) {
		this.cartRepository = cartRepository;
		this.productRepository = productRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<CartItemResponse> listForUser(Long userId) {
		return cartRepository.findByUserIdWithProduct(userId).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public CartItemResponse addItem(Long userId, AddToCartRequest request) {
		if (request.productId() == null) {
			throw new IllegalArgumentException("productId is required");
		}
		int addQty = request.quantity() != null && request.quantity() > 0 ? request.quantity() : 1;

		Product product = productRepository
				.findCatalogById(request.productId(), VendorStatus.APPROVED, StoreStatus.OPEN, ProductStatus.ACTIVE)
				.orElseThrow(ProductNotFoundException::new);

		User user = userRepository.findById(userId).orElseThrow(UserNotFoundException::new);

		Cart cart = cartRepository.findByUserIdAndProductId(userId, product.getId()).orElse(null);
		if (cart != null) {
			int newQty = cart.getQuantity() + addQty;
			ensureQuantityWithinStock(product, newQty);
			cart.setQuantity(newQty);
			return toResponse(cartRepository.save(cart));
		}

		ensureQuantityWithinStock(product, addQty);
		cart = new Cart();
		cart.setUser(user);
		cart.setProduct(product);
		cart.setQuantity(addQty);
		return toResponse(cartRepository.save(cart));
	}

	@Transactional
	public CartItemResponse updateQuantity(Long userId, Long cartItemId, UpdateCartQuantityRequest request) {
		if (request.quantity() < 1) {
			throw new IllegalArgumentException("quantity must be at least 1");
		}
		Cart cart = cartRepository.findByIdAndUserId(cartItemId, userId)
				.orElseThrow(CartItemNotFoundException::new);
		Product product = cart.getProduct();
		ensureQuantityWithinStock(product, request.quantity());
		cart.setQuantity(request.quantity());
		return toResponse(cartRepository.save(cart));
	}

	@Transactional
	public void removeItem(Long userId, Long cartItemId) {
		Cart cart = cartRepository.findByIdAndUserId(cartItemId, userId)
				.orElseThrow(CartItemNotFoundException::new);
		cartRepository.delete(cart);
	}

	@Transactional
	public void removeItems(Long userId, List<Long> cartItemIds) {
		if (cartItemIds == null || cartItemIds.isEmpty()) {
			return;
		}
		cartRepository.deleteByUserIdAndIdIn(userId, cartItemIds);
	}

	private void ensureQuantityWithinStock(Product product, int requestedQty) {
		if (requestedQty > product.getStock()) {
			throw new InsufficientStockException(product.getStock());
		}
	}

	private CartItemResponse toResponse(Cart cart) {
		Product product = cart.getProduct();
		String image = product.getImages().isEmpty() ? null : product.getImages().get(0);
		return new CartItemResponse(
				cart.getId(),
				product.getId(),
				product.getProductName(),
				product.getCategory(),
				product.getForm(),
				product.getStrength(),
				product.getQuantity(),
				product.getPrice(),
				image,
				cart.getQuantity(),
				product.getStock());
	}
}
