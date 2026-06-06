package com.mednexus.mednexus.cart;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.cart.dto.AddToCartRequest;
import com.mednexus.mednexus.cart.dto.CartItemResponse;
import com.mednexus.mednexus.cart.dto.RemoveCartItemsRequest;
import com.mednexus.mednexus.cart.dto.UpdateCartQuantityRequest;
import com.mednexus.mednexus.security.PlatformUser;

@RestController
@RequestMapping("/api/cart")
@PreAuthorize("isAuthenticated() and !principal.vendorAccount")
public class CartController {

	private final CartService cartService;

	@Autowired
	public CartController(CartService cartService) {
		this.cartService = cartService;
	}

	@GetMapping
	public ResponseEntity<List<CartItemResponse>> list(@AuthenticationPrincipal PlatformUser principal) {
		return ResponseEntity.ok(cartService.listForUser(principal.getSubjectId()));
	}

	@PostMapping
	public ResponseEntity<CartItemResponse> add(
			@AuthenticationPrincipal PlatformUser principal,
			@RequestBody AddToCartRequest request) {
		return ResponseEntity.ok(cartService.addItem(principal.getSubjectId(), request));
	}

	@PatchMapping("/{id}")
	public ResponseEntity<CartItemResponse> updateQuantity(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long id,
			@RequestBody UpdateCartQuantityRequest request) {
		return ResponseEntity.ok(cartService.updateQuantity(principal.getSubjectId(), id, request));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> remove(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long id) {
		cartService.removeItem(principal.getSubjectId(), id);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/remove")
	public ResponseEntity<Void> removeMany(
			@AuthenticationPrincipal PlatformUser principal,
			@RequestBody RemoveCartItemsRequest request) {
		cartService.removeItems(principal.getSubjectId(), request.ids());
		return ResponseEntity.noContent().build();
	}
}
