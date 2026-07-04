package com.mednexus.mednexus.bill;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.bill.dto.BillResponse;
import com.mednexus.mednexus.bill.dto.CreateBillRequest;
import com.mednexus.mednexus.security.PlatformUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/vendor/bills")
@PreAuthorize("hasRole('VENDOR') and principal.vendorAccount")
public class BillController {

	private final BillService billService;

	@Autowired
	public BillController(BillService billService) {
		this.billService = billService;
	}

	@GetMapping
	public ResponseEntity<List<BillResponse>> list(@AuthenticationPrincipal PlatformUser principal) {
		return ResponseEntity.ok(billService.listForVendor(principal.getSubjectId()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<BillResponse> get(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long id) {
		return ResponseEntity.ok(billService.getForVendor(principal.getSubjectId(), id));
	}

	@PostMapping
	public ResponseEntity<BillResponse> create(
			@AuthenticationPrincipal PlatformUser principal,
			@Valid @RequestBody CreateBillRequest request) {
		BillResponse created = billService.create(principal.getSubjectId(), request);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long id) {
		billService.delete(principal.getSubjectId(), id);
		return ResponseEntity.noContent().build();
	}
}
