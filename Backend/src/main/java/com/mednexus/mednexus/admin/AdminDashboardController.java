package com.mednexus.mednexus.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.admin.dto.AdminDashboardResponse;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN') and !principal.vendorAccount")
public class AdminDashboardController {

	private final AdminDashboardService adminDashboardService;

	@Autowired
	public AdminDashboardController(AdminDashboardService adminDashboardService) {
		this.adminDashboardService = adminDashboardService;
	}

	@GetMapping
	public ResponseEntity<AdminDashboardResponse> getDashboard() {
		return ResponseEntity.ok(adminDashboardService.getDashboard());
	}
}
