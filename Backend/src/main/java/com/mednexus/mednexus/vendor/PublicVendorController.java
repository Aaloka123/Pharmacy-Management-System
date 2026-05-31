package com.mednexus.mednexus.vendor;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.vendor.dto.PublicVendorResponse;

@RestController
@RequestMapping("/api/public/vendors")
public class PublicVendorController {

	private final VendorService vendorService;

	@Autowired
	public PublicVendorController(VendorService vendorService) {
		this.vendorService = vendorService;
	}

	@GetMapping
	public ResponseEntity<List<PublicVendorResponse>> listPublic() {
		return ResponseEntity.ok(vendorService.listPublicVendors());
	}

	@GetMapping("/{id:\\d+}")
	public ResponseEntity<PublicVendorResponse> getPublicProfile(@PathVariable Long id) {
		return ResponseEntity.ok(vendorService.getPublicProfile(id));
	}
}
