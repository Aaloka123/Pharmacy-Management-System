package com.mednexus.mednexus.vendor;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.vendor.dto.VendorLoginRequest;
import com.mednexus.mednexus.vendor.dto.VendorResponse;

@RestController
@RequestMapping("/api/vendors")
public class VendorController {

	private final VendorService vendorService;

	public VendorController(VendorService vendorService) {
		this.vendorService = vendorService;
	}

	@PostMapping(value = "/signup", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<VendorResponse> signup(
			@RequestParam("name") String name,
			@RequestParam("email") String email,
			@RequestParam("phoneNumber") String phoneNumber,
			@RequestParam("location") String location,
			@RequestParam("businessPanVatId") String businessPanVatId,
			@RequestParam("businessName") String businessName,
			@RequestParam("businessLocation") String businessLocation,
			@RequestParam("pharmacyLicense") String pharmacyLicense,
			@RequestParam("password") String password,
			@RequestParam("pharmacyManagementCertificate") MultipartFile pharmacyManagementCertificate,
			@RequestParam("panVatCertificate") MultipartFile panVatCertificate) {

		VendorResponse body = vendorService.register(
				name,
				email,
				phoneNumber,
				location,
				businessPanVatId,
				businessName,
				businessLocation,
				pharmacyLicense,
				password,
				pharmacyManagementCertificate,
				panVatCertificate);
		return ResponseEntity.status(HttpStatus.CREATED).body(body);
	}

	@PostMapping("/login")
	public ResponseEntity<VendorResponse> login(@RequestBody VendorLoginRequest request) {
		return ResponseEntity.ok(vendorService.login(request));
	}

	@GetMapping
	public ResponseEntity<List<VendorResponse>> list(
			@RequestParam(name = "status", required = false) VendorStatus status) {
		return ResponseEntity.ok(vendorService.list(status));
	}

	@PostMapping("/{id}/approve")
	public ResponseEntity<VendorResponse> approve(@PathVariable Long id) {
		return ResponseEntity.ok(vendorService.approve(id));
	}

	@PostMapping("/{id}/reject")
	public ResponseEntity<VendorResponse> reject(@PathVariable Long id) {
		return ResponseEntity.ok(vendorService.reject(id));
	}
}
