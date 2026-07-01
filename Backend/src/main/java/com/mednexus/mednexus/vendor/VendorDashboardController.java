package com.mednexus.mednexus.vendor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.security.PlatformUser;
import com.mednexus.mednexus.vendor.dto.VendorDashboardResponse;

@RestController
@RequestMapping("/api/vendor/dashboard")
@PreAuthorize("hasRole('VENDOR') and principal.vendorAccount")
public class VendorDashboardController {

	private final VendorDashboardService vendorDashboardService;

	public VendorDashboardController(VendorDashboardService vendorDashboardService) {
		this.vendorDashboardService = vendorDashboardService;
	}

	@GetMapping
	public ResponseEntity<VendorDashboardResponse> getDashboard(@AuthenticationPrincipal PlatformUser principal) {
		return ResponseEntity.ok(vendorDashboardService.getDashboard(principal));
	}
}
