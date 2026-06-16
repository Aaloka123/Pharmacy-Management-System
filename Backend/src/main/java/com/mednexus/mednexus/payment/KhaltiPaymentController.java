package com.mednexus.mednexus.payment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.payment.dto.EsewaInitiateRequest;
import com.mednexus.mednexus.payment.dto.KhaltiInitiateResponse;
import com.mednexus.mednexus.security.PlatformUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments/khalti")
public class KhaltiPaymentController {

	private final KhaltiPaymentService khaltiPaymentService;

	@Autowired
	public KhaltiPaymentController(KhaltiPaymentService khaltiPaymentService) {
		this.khaltiPaymentService = khaltiPaymentService;
	}

	@PostMapping("/initiate")
	@PreAuthorize("isAuthenticated() and !principal.vendorAccount")
	public ResponseEntity<KhaltiInitiateResponse> initiate(
			@AuthenticationPrincipal PlatformUser principal,
			@Valid @RequestBody EsewaInitiateRequest request) {
		KhaltiInitiateResponse response = khaltiPaymentService.initiate(
				principal.getSubjectId(),
				request.cartItemIds());
		return ResponseEntity.ok(response);
	}

	@GetMapping("/callback")
	public ResponseEntity<Void> callback(
			@RequestParam(name = "pidx", required = false) String pidx,
			@RequestParam(name = "status", required = false) String status,
			@RequestParam(name = "purchase_order_id", required = false) String purchaseOrderId,
			@RequestParam(name = "amount", required = false) String amount) {
		String redirectUrl = khaltiPaymentService.handleCallback(pidx, status, purchaseOrderId, amount);
		return ResponseEntity.status(HttpStatus.FOUND).location(java.net.URI.create(redirectUrl)).build();
	}
}
