package com.mednexus.mednexus.payment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.payment.dto.EsewaInitiateRequest;
import com.mednexus.mednexus.payment.dto.EsewaInitiateResponse;
import com.mednexus.mednexus.security.PlatformUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments/esewa")
public class EsewaPaymentController {

	private final EsewaPaymentService esewaPaymentService;

	@Autowired
	public EsewaPaymentController(EsewaPaymentService esewaPaymentService) {
		this.esewaPaymentService = esewaPaymentService;
	}

	@PostMapping("/initiate")
	@PreAuthorize("isAuthenticated() and !principal.vendorAccount")
	public ResponseEntity<EsewaInitiateResponse> initiate(
			@AuthenticationPrincipal PlatformUser principal,
			@Valid @RequestBody EsewaInitiateRequest request) {
		EsewaInitiateResponse response = esewaPaymentService.initiate(
				principal.getSubjectId(),
				request.cartItemIds());
		return ResponseEntity.ok(response);
	}

	@RequestMapping(value = "/success", method = { RequestMethod.GET, RequestMethod.POST })
	public ResponseEntity<Void> success(@RequestParam(name = "data", required = false) String data) {
		String redirectUrl = esewaPaymentService.handleSuccess(data);
		return ResponseEntity.status(HttpStatus.FOUND).location(java.net.URI.create(redirectUrl)).build();
	}

	@RequestMapping(value = "/failure", method = { RequestMethod.GET, RequestMethod.POST })
	public ResponseEntity<Void> failure(@RequestParam(name = "data", required = false) String data) {
		String redirectUrl = esewaPaymentService.handleFailure(data);
		return ResponseEntity.status(HttpStatus.FOUND).location(java.net.URI.create(redirectUrl)).build();
	}
}
