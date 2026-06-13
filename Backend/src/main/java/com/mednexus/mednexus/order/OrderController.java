package com.mednexus.mednexus.order;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.order.dto.PlaceOrderRequest;
import com.mednexus.mednexus.order.dto.VendorOrderResponse;
import com.mednexus.mednexus.security.PlatformUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/orders")
@PreAuthorize("isAuthenticated() and !principal.vendorAccount")
public class OrderController {

	private final VendorOrderService vendorOrderService;

	@Autowired
	public OrderController(VendorOrderService vendorOrderService) {
		this.vendorOrderService = vendorOrderService;
	}

	@PostMapping
	public ResponseEntity<List<VendorOrderResponse>> placeOrder(
			@AuthenticationPrincipal PlatformUser principal,
			@Valid @RequestBody PlaceOrderRequest request) {
		List<VendorOrderResponse> created = vendorOrderService.placeOrder(principal.getSubjectId(), request);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	@GetMapping
	public ResponseEntity<List<VendorOrderResponse>> listMyOrders(
			@AuthenticationPrincipal PlatformUser principal) {
		return ResponseEntity.ok(vendorOrderService.listForUser(principal.getSubjectId()));
	}

	@PostMapping("/{id}/cancel")
	public ResponseEntity<VendorOrderResponse> cancelOrder(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long id) {
		return ResponseEntity.ok(vendorOrderService.cancelByUser(principal.getSubjectId(), id));
	}
}
