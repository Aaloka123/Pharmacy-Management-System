package com.mednexus.mednexus.order;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.order.dto.UpdateOrderStatusRequest;
import com.mednexus.mednexus.order.dto.VendorOrderResponse;
import com.mednexus.mednexus.security.PlatformUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/vendor/orders")
@PreAuthorize("hasRole('VENDOR') and principal.vendorAccount")
public class VendorOrderController {

	private final VendorOrderService vendorOrderService;

	@Autowired
	public VendorOrderController(VendorOrderService vendorOrderService) {
		this.vendorOrderService = vendorOrderService;
	}

	@GetMapping
	public ResponseEntity<List<VendorOrderResponse>> list(
			@AuthenticationPrincipal PlatformUser principal) {
		return ResponseEntity.ok(vendorOrderService.listForVendor(principal.getSubjectId()));
	}

	@PatchMapping("/{id}/status")
	public ResponseEntity<VendorOrderResponse> updateStatus(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long id,
			@Valid @RequestBody UpdateOrderStatusRequest request) {
		return ResponseEntity.ok(vendorOrderService.updateStatus(principal.getSubjectId(), id, request));
	}
}
